import { useState } from 'react';
import { X, Check, AlertCircle } from 'lucide-react';
import { sendPlatformFeedback } from '../services/api';

// "Report a problem or idea" — reaches the admin dashboard, and counts towards
// the sender's moderator activity score. The page they were on is attached so
// a bug report says where it happened.

const KINDS = [
  { value: 'bug',     label: '🐞 Something is broken' },
  { value: 'idea',    label: '💡 An idea' },
  { value: 'content', label: '📄 Wrong or missing content' },
  { value: 'other',   label: '💬 Other' },
];

export default function PlatformFeedbackDialog({ onClose }) {
  const [kind, setKind] = useState('bug');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  async function submit(e) {
    e.preventDefault();
    setBusy(true); setError('');
    try {
      await sendPlatformFeedback({ kind, message: message.trim(), page: window.location.pathname });
      setSent(true);
    } catch (err) {
      setError(err.message || 'Could not send.');
    } finally { setBusy(false); }
  }

  return (
    <div className="fixed inset-0 z-[60] bg-black/40 flex items-end sm:items-center justify-center p-0 sm:p-4" onMouseDown={onClose}>
      <div className="bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl p-5 shadow-xl" onMouseDown={e => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <p className="text-base font-bold text-gray-900">Report a problem or idea</p>
          <button type="button" onClick={onClose} className="p-1.5 rounded-full hover:bg-gray-100 cursor-pointer" aria-label="Close"><X className="w-4 h-4" /></button>
        </div>
        {sent ? (
          <div className="py-6 text-center">
            <span className="w-11 h-11 rounded-full bg-emerald-50 text-emerald-600 inline-flex items-center justify-center"><Check className="w-5 h-5" /></span>
            <p className="mt-3 text-base font-semibold text-gray-900">Thank you!</p>
            <p className="text-sm text-gray-500 mt-1">The team reads every one. This also counts towards the moderator programme.</p>
            <button type="button" onClick={onClose} className="btn-primary text-sm px-5 py-2 mt-4">Done</button>
          </div>
        ) : (
          <form onSubmit={submit} className="mt-4 space-y-3">
            <div className="grid grid-cols-2 gap-2">
              {KINDS.map(k => (
                <button key={k.value} type="button" onClick={() => setKind(k.value)}
                  className={`text-left text-sm px-3 py-2 rounded-xl border cursor-pointer ${kind === k.value ? 'border-brand-600 bg-brand-50 font-semibold' : 'border-gray-200 hover:border-gray-300'}`}>
                  {k.label}
                </button>
              ))}
            </div>
            <textarea rows={4} maxLength={2000} value={message} onChange={e => setMessage(e.target.value)} autoFocus
              placeholder="What happened, or what would make SSBCircle better?"
              className="w-full text-sm border border-gray-200 rounded-xl px-3.5 py-3 focus:outline-none focus:border-brand-400" />
            {error && <p className="text-sm text-red-600 flex items-start gap-1.5"><AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /> {error}</p>}
            <button type="submit" disabled={busy || message.trim().length < 10} className="btn-primary text-sm w-full py-2.5">{busy ? 'Sending…' : 'Send'}</button>
          </form>
        )}
      </div>
    </div>
  );
}
