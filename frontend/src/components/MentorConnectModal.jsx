import { useState } from 'react';
import { X, MessageCircle, ArrowRight } from 'lucide-react';

const ENTRY_OPTIONS = ['NDA', 'CDS', 'AFCAT', 'Other'];

// Turns the aspirant's answers into a pre-filled WhatsApp message, so the
// mentor opens the chat with real context instead of a bare "Hi ma'am".
function buildMessage(mentor, { name, entry, ssbDate, challenge, goal }) {
  const lines = [`Hi, I'm ${name.trim()} — connecting with you via SSBCircle.`, '', `Entry: ${entry}`];
  if (ssbDate.trim()) lines.push(`SSB date (if upcoming): ${ssbDate.trim()}`);
  if (challenge.trim()) lines.push(`Biggest challenge currently: ${challenge.trim()}`);
  if (goal.trim()) lines.push(`What I'd like to achieve through mentoring: ${goal.trim()}`);
  return lines.join('\n');
}

export default function MentorConnectModal({ mentor, onClose }) {
  const [name, setName] = useState('');
  const [entry, setEntry] = useState('');
  const [ssbDate, setSsbDate] = useState('');
  const [challenge, setChallenge] = useState('');
  const [goal, setGoal] = useState('');

  const canSubmit = name.trim().length > 0 && entry.length > 0;

  const handleSubmit = () => {
    if (!canSubmit) return;
    const message = buildMessage(mentor, { name, entry, ssbDate, challenge, goal });
    window.open(`https://wa.me/${mentor.whatsapp}?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto p-6" onClick={e => e.stopPropagation()}>

        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
            <MessageCircle className="w-4.5 h-4.5 text-emerald-600" />
          </div>
          <button onClick={onClose} className="text-gray-300 hover:text-gray-500 transition-colors cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <h3 className="text-base font-bold text-gray-900 mb-1">Help {mentor.name} know you a bit</h3>
        <p className="text-xs text-gray-400 mb-5 leading-relaxed">
          A couple of quick details so your WhatsApp message has real context — not just "Hi". You can still edit it before sending.
        </p>

        {/* Name */}
        <label className="block text-xs font-semibold text-gray-600 mb-1.5">Name</label>
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="e.g. Rohan Sharma"
          maxLength={60}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:border-brand-400 mb-4"
        />

        {/* Entry */}
        <label className="block text-xs font-semibold text-gray-600 mb-1.5">Entry</label>
        <div className="flex flex-wrap gap-1.5 mb-4">
          {ENTRY_OPTIONS.map(e => (
            <button key={e} type="button" onClick={() => setEntry(e)}
              className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-all cursor-pointer ${entry === e ? 'bg-brand-600 border-brand-600 text-white' : 'bg-white border-gray-200 text-gray-500 hover:border-brand-200'}`}>
              {e}
            </button>
          ))}
        </div>

        {/* SSB date */}
        <label className="block text-xs font-semibold text-gray-600 mb-1.5">SSB date <span className="font-normal text-gray-300">(if upcoming)</span></label>
        <input
          value={ssbDate}
          onChange={e => setSsbDate(e.target.value)}
          placeholder="e.g. 12 Sept 2026, or not yet allotted"
          maxLength={60}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:border-brand-400 mb-4"
        />

        {/* Biggest challenge */}
        <label className="block text-xs font-semibold text-gray-600 mb-1.5">Biggest challenge currently</label>
        <textarea
          value={challenge}
          onChange={e => setChallenge(e.target.value)}
          rows={2}
          maxLength={300}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 resize-none focus:outline-none focus:border-brand-400 mb-4"
        />

        {/* Goal */}
        <label className="block text-xs font-semibold text-gray-600 mb-1.5">What would you like to achieve through mentoring?</label>
        <textarea
          value={goal}
          onChange={e => setGoal(e.target.value)}
          rows={2}
          maxLength={300}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 resize-none focus:outline-none focus:border-brand-400 mb-5"
        />

        <button onClick={handleSubmit} disabled={!canSubmit}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed">
          Continue to WhatsApp <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
