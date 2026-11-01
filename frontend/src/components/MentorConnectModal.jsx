import { useEffect, useMemo, useState } from 'react';
import { X, MessageCircle, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { trackEvent, visitorId } from '../analytics';

const API = import.meta.env.VITE_API_URL || '';
const ENTRY_OPTIONS = ['NDA', 'CDS', 'AFCAT', 'Tech entry (TES / TGC / SSC Tech)', 'Navy', 'Other'];

// The profile's exam choice, mapped to the options above
function entryFrom(exam = '') {
  if (/^(NDA|CDS|AFCAT)$/.test(exam)) return exam;
  if (/TGC|SSC Tech|TES/.test(exam)) return ENTRY_OPTIONS[3];
  if (/Navy/.test(exam)) return 'Navy';
  return exam ? 'Other' : '';
}

// "2026-12-12" -> "12 Dec 2026"
function readableDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return isNaN(d) ? iso : d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

// A short code that rides in the WhatsApp message and is logged with the
// referral, so every aspirant sent to a mentor can be matched later.
function newCode() {
  const abc = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const n = crypto.getRandomValues?.(new Uint8Array(5)) || Array.from({ length: 5 }, () => Math.floor(Math.random() * 256));
  return 'SSBC-' + Array.from(n, x => abc[x % abc.length]).join('');
}

// Turns the aspirant's answers into a pre-filled WhatsApp message, so the
// mentor opens the chat with real context instead of a bare "Hi ma'am".
function buildMessage({ name, entry, ssbDate, challenge, goal, code }) {
  const lines = [`Hi, I'm ${name.trim()} — connecting with you via SSBCircle.`, '', `Entry: ${entry}`];
  if (ssbDate.trim()) lines.push(`SSB date (if upcoming): ${ssbDate.trim()}`);
  if (challenge.trim()) lines.push(`Biggest challenge currently: ${challenge.trim()}`);
  if (goal.trim()) lines.push(`What I'd like to achieve through mentoring: ${goal.trim()}`);
  lines.push('', `SSBCircle ref: ${code}`);
  return lines.join('\n');
}

const steps = who => ['Fill this in (1 minute)', 'WhatsApp opens with your introduction — just press send', `${who} replies personally with available slots`];

// source: where the aspirant tapped from (piq_report, tat_report, mentor_page…)
export default function MentorConnectModal({ mentor, onClose, source = 'unknown' }) {
  const { user } = useAuth();
  const [name, setName] = useState(user?.display_name || '');
  const [entry, setEntry] = useState(entryFrom(user?.exam_type));
  const [ssbDate, setSsbDate] = useState(readableDate(user?.ssb_date));

  // If sign-in finishes after the form opened, fill in what is still empty
  useEffect(() => {
    if (!user) return;
    setName(v => v || user.display_name || '');
    setEntry(v => v || entryFrom(user.exam_type));
    setSsbDate(v => v || readableDate(user.ssb_date));
  }, [user]);
  const [challenge, setChallenge] = useState('');
  const [goal, setGoal] = useState('');
  const code = useMemo(newCode, []);
  const firstName = mentor.name.split(' ').slice(0, -1).join(' ') || mentor.name;

  const canSubmit = name.trim().length > 0 && entry.length > 0;

  const handleSubmit = () => {
    if (!canSubmit) return;
    const message = buildMessage({ name, entry, ssbDate, challenge, goal, code });
    let token = null;
    try { token = localStorage.getItem('token'); } catch { /* private mode */ }
    fetch(`${API}/api/track/mentor-referral`, {
      method: 'POST', keepalive: true,
      headers: { 'content-type': 'application/json', ...(token && { authorization: `Bearer ${token}` }) },
      body: JSON.stringify({ code, mentor: mentor.slug, source, entry, visitor_id: visitorId() }),
    }).catch(() => {});
    trackEvent('mentor_connect', { mentor: mentor.slug, source });
    window.open(`https://wa.me/${mentor.whatsapp}?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer');
    onClose();
  };

  const field = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:border-brand-400 mb-4';

  return (
    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center sm:p-4 bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-xl w-full max-w-md max-h-[92vh] overflow-y-auto p-5 sm:p-6"
        style={{ paddingBottom: 'calc(1.25rem + env(safe-area-inset-bottom))' }} onClick={e => e.stopPropagation()}>

        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3 min-w-0">
            {mentor.photoAvatar
              ? <img src={mentor.photoAvatar} alt="" className="w-11 h-11 rounded-full object-cover object-top shrink-0" />
              : <span className="w-11 h-11 rounded-full bg-emerald-50 flex items-center justify-center shrink-0"><MessageCircle className="w-5 h-5 text-emerald-600" /></span>}
            <div className="min-w-0">
              <h3 className="text-base font-bold text-gray-900 leading-snug">Talk to {firstName}</h3>
              <p className="text-xs text-gray-500 truncate">{mentor.tagline}</p>
            </div>
          </div>
          <button onClick={onClose} aria-label="Close" className="text-gray-300 hover:text-gray-500 transition-colors cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <ol className="mb-5 space-y-1.5 rounded-xl bg-emerald-50 border border-emerald-100 px-3.5 py-3">
          {steps(firstName).map((s, i) => (
            <li key={s} className="flex items-start gap-2 text-[13px] text-emerald-900">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" /> <span><span className="font-semibold">{i + 1}.</span> {s}</span>
            </li>
          ))}
        </ol>

        <label className="block text-xs font-semibold text-gray-600 mb-1.5">Your name</label>
        <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Rohan Sharma" maxLength={60} className={field} />

        <label className="block text-xs font-semibold text-gray-600 mb-1.5">Preparing for</label>
        <div className="flex flex-wrap gap-1.5 mb-4">
          {ENTRY_OPTIONS.map(e => (
            <button key={e} type="button" onClick={() => setEntry(e)}
              className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-all cursor-pointer ${entry === e ? 'bg-brand-600 border-brand-600 text-white' : 'bg-white border-gray-200 text-gray-500 hover:border-brand-200'}`}>
              {e}
            </button>
          ))}
        </div>

        <label className="block text-xs font-semibold text-gray-600 mb-1.5">SSB date <span className="font-normal text-gray-400">(if you have one)</span></label>
        <input value={ssbDate} onChange={e => setSsbDate(e.target.value)} placeholder="e.g. 12 Dec 2026, or not yet allotted" maxLength={60} className={field} />

        <label className="block text-xs font-semibold text-gray-600 mb-1.5">Your biggest challenge right now <span className="font-normal text-gray-400">(optional)</span></label>
        <textarea value={challenge} onChange={e => setChallenge(e.target.value)} rows={2} maxLength={300}
          placeholder="e.g. I freeze in the interview, or my PIQ feels weak" className={`${field} resize-none`} />

        <label className="block text-xs font-semibold text-gray-600 mb-1.5">What you want from mentoring <span className="font-normal text-gray-400">(optional)</span></label>
        <textarea value={goal} onChange={e => setGoal(e.target.value)} rows={2} maxLength={300} className={`${field} resize-none mb-5`} />

        <button onClick={handleSubmit} disabled={!canSubmit}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed">
          <MessageCircle className="w-4 h-4" /> Continue to WhatsApp <ArrowRight className="w-4 h-4" />
        </button>
        <p className="mt-2 text-center text-[11px] text-gray-400">You can edit the message before sending. Your reference: {code}</p>
      </div>
    </div>
  );
}
