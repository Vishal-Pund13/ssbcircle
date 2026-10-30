import { useState, useEffect } from 'react';
import { Check, Lightbulb } from 'lucide-react';
import SoldierRunner from './SoldierRunner';
import { FORCES_FACTS } from '../data/forcesFacts';

// Shown while an AI request runs (a PIQ report takes 30–60 seconds). It says
// why the wait is long, shows what is being worked on, and passes the time
// with facts about the armed forces — so a long wait reads as progress, not a
// frozen page.
//
// steps: [{ label, at }] — `at` is the second after which a step shows as
// started. The timing is approximate; the request itself reports no progress.

const FACT_EVERY = 8000;

export default function AiWaitPanel({ title, steps }) {
  const [seconds, setSeconds] = useState(0);
  const [fact, setFact] = useState(() => Math.floor(Math.random() * FORCES_FACTS.length));

  useEffect(() => {
    const t = setInterval(() => setSeconds(s => s + 1), 1000);
    const f = setInterval(() => setFact(i => (i + 1) % FORCES_FACTS.length), FACT_EVERY);
    return () => { clearInterval(t); clearInterval(f); };
  }, []);

  const current = steps.reduce((n, s, i) => (seconds >= s.at ? i : n), 0);
  const clock = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;

  return (
    <div className="fixed inset-0 z-[70] bg-gray-900/40 backdrop-blur-sm flex items-end sm:items-center justify-center sm:p-4" role="status" aria-live="polite">
      <div className="w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl p-6"
        style={{ paddingBottom: 'calc(1.5rem + env(safe-area-inset-bottom))' }}>
        <div className="flex flex-col items-center text-center">
          <SoldierRunner className="w-28" />
          <h2 className="mt-1 text-lg font-bold text-gray-900">{title}</h2>
          <p className="mt-1.5 text-sm text-gray-600 leading-relaxed">
            This usually takes 30–60 seconds. Many aspirants are preparing at the same time and our AI
            answers them one by one — please keep this page open.
          </p>
          <p className="mt-2 text-xs font-semibold text-gray-400 tabular-nums">{clock}</p>
        </div>

        <ol className="mt-4 space-y-2">
          {steps.map((s, i) => {
            const done = i < current, now = i === current;
            return (
              <li key={s.label} className="flex items-center gap-2.5 text-sm">
                <span className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${done ? 'bg-emerald-500 text-white' : now ? 'border-2 border-brand-600' : 'border-2 border-gray-200'}`}>
                  {done ? <Check className="w-3 h-3" strokeWidth={3} /> : now ? <span className="w-1.5 h-1.5 rounded-full bg-brand-600 animate-pulse" /> : null}
                </span>
                <span className={done ? 'text-gray-500' : now ? 'font-semibold text-gray-900' : 'text-gray-400'}>{s.label}</span>
              </li>
            );
          })}
        </ol>

        <div className="mt-5 rounded-2xl bg-amber-50 border border-amber-100 p-4 min-h-[112px]">
          <p className="text-[11px] font-bold uppercase tracking-wide text-amber-700 flex items-center gap-1.5">
            <Lightbulb className="w-3.5 h-3.5" /> Did you know?
          </p>
          <p key={fact} className="mt-1.5 text-sm text-gray-800 leading-relaxed animate-[fadeIn_0.4s_ease-out]">{FORCES_FACTS[fact]}</p>
        </div>
      </div>
    </div>
  );
}
