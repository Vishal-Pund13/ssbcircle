import { useState } from 'react';
import { X, MessageCircle, ArrowRight } from 'lucide-react';

const STAGE_OPTIONS = [
  'Preparing for my first SSB',
  'Repeating / been screened out before',
  'Recommended — refining before next stage',
  'Just exploring, new to SSB',
];

// Turns the aspirant's answers into a pre-filled WhatsApp message, so the
// mentor opens the chat with real context instead of a bare "Hi ma'am".
function buildMessage(mentor, { name, stage, topics, note }) {
  const lines = [`Hi, I'm ${name.trim()} — connecting with you via SSBCircle.`, '', `Stage: ${stage}`];
  if (topics.length) lines.push(`Looking for guidance on: ${topics.join(', ')}`);
  if (note.trim()) lines.push('', note.trim());
  return lines.join('\n');
}

export default function MentorConnectModal({ mentor, onClose }) {
  const [name, setName] = useState('');
  const [stage, setStage] = useState('');
  const [topics, setTopics] = useState([]);
  const [note, setNote] = useState('');

  const toggleTopic = (t) => setTopics(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);
  const canSubmit = name.trim().length > 0 && stage.length > 0;

  const handleSubmit = () => {
    if (!canSubmit) return;
    const message = buildMessage(mentor, { name, stage, topics, note });
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
        <label className="block text-xs font-semibold text-gray-600 mb-1.5">Your name</label>
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="e.g. Rohan Sharma"
          maxLength={60}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:border-brand-400 mb-4"
        />

        {/* Stage */}
        <label className="block text-xs font-semibold text-gray-600 mb-1.5">Where are you in your SSB journey?</label>
        <div className="flex flex-col gap-1.5 mb-4">
          {STAGE_OPTIONS.map(s => (
            <button key={s} type="button" onClick={() => setStage(s)}
              className={`px-3 py-2 rounded-lg text-sm text-left border transition-all cursor-pointer ${stage === s ? 'bg-brand-50 border-brand-300 text-brand-700 font-semibold' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
              {s}
            </button>
          ))}
        </div>

        {/* Topics */}
        {mentor.specialties?.length > 0 && (
          <>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">What would you like guidance on? <span className="font-normal text-gray-300">(optional)</span></label>
            <div className="flex flex-wrap gap-1.5 mb-4">
              {mentor.specialties.map(t => (
                <button key={t} type="button" onClick={() => toggleTopic(t)}
                  className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-all cursor-pointer ${topics.includes(t) ? 'bg-brand-600 border-brand-600 text-white' : 'bg-white border-gray-200 text-gray-500 hover:border-brand-200'}`}>
                  {t}
                </button>
              ))}
            </div>
          </>
        )}

        {/* Note */}
        <label className="block text-xs font-semibold text-gray-600 mb-1.5">Anything else? <span className="font-normal text-gray-300">(optional)</span></label>
        <textarea
          value={note}
          onChange={e => setNote(e.target.value)}
          placeholder="Your background, upcoming batch, a specific concern..."
          rows={3}
          maxLength={400}
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
