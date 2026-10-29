import { useState } from 'react';
import { ThumbsUp, ThumbsDown, Check } from 'lucide-react';
import { sendAiFeedback } from '../services/api';

// "Was this useful?" under an AI report. The answers show on the admin
// dashboard and are the main signal for tuning the prompts, so a thumbs-down
// also asks what was wrong. Remembered on this device so it is not asked twice.

export default function AiFeedback({ feature, refId, prompt = 'Was this feedback useful?' }) {
  const key = `ssbc:aifb:${feature}:${refId}`;
  const [stage, setStage] = useState(() => {
    try { return localStorage.getItem(key) ? 'done' : 'ask'; } catch { return 'ask'; }
  });   // ask → (no) comment → done
  const [comment, setComment] = useState('');
  const [busy, setBusy] = useState(false);

  async function send(helpful, text) {
    setBusy(true);
    try {
      await sendAiFeedback({ feature, ref_id: String(refId), helpful, ...(text && { comment: text }) });
      try { localStorage.setItem(key, helpful ? 'yes' : 'no'); } catch {}
    } catch { /* not worth interrupting the reader over */ }
    finally { setBusy(false); }
  }

  if (!refId) return null;

  if (stage === 'done') {
    return (
      <p className="text-xs text-gray-500 flex items-center gap-1.5 px-1">
        <Check className="w-3.5 h-3.5 text-emerald-600" /> Thanks — your feedback helps us improve these reports.
      </p>
    );
  }

  if (stage === 'comment') {
    return (
      <div className="bg-white border border-gray-200 rounded-2xl px-4 py-3.5 space-y-2.5">
        <p className="text-sm font-semibold text-gray-800">Sorry about that. What was wrong or missing?</p>
        <textarea rows={2} maxLength={1000} value={comment} onChange={e => setComment(e.target.value)}
          placeholder="E.g. too general, wrong about my picture, hard to understand…"
          className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-brand-400" />
        <div className="flex gap-2">
          <button type="button" disabled={busy || !comment.trim()}
            onClick={async () => { await send(false, comment.trim()); setStage('done'); }}
            className="btn-primary text-xs px-4 py-2">Send</button>
          <button type="button" onClick={() => setStage('done')}
            className="text-xs font-semibold text-gray-400 hover:text-gray-600 px-2 cursor-pointer">Skip</button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-2xl px-4 py-3.5 flex flex-wrap items-center justify-between gap-3">
      <p className="text-sm font-semibold text-gray-800">{prompt}</p>
      <div className="flex gap-2">
        <button type="button" disabled={busy} onClick={async () => { await send(true); setStage('done'); }}
          className="inline-flex items-center gap-1.5 text-sm font-semibold px-3.5 py-2 rounded-xl border border-gray-200 hover:border-emerald-300 hover:bg-emerald-50 text-gray-700 cursor-pointer">
          <ThumbsUp className="w-4 h-4" /> Yes
        </button>
        <button type="button" disabled={busy} onClick={async () => { await send(false); setStage('comment'); }}
          className="inline-flex items-center gap-1.5 text-sm font-semibold px-3.5 py-2 rounded-xl border border-gray-200 hover:border-red-300 hover:bg-red-50 text-gray-700 cursor-pointer">
          <ThumbsDown className="w-4 h-4" /> No
        </button>
      </div>
    </div>
  );
}
