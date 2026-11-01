import { useEffect, useMemo, useRef, useState } from 'react';
import { Check, X, RotateCcw, Layers, Network, ListChecks, Maximize2 } from 'lucide-react';
import { fsrs, createEmptyCard, Rating } from 'ts-fsrs';

// Tools that turn reading into remembering, used inside articles:
//
//   Quiz       — [QUIZ] question | right answer | wrong | wrong | why [/QUIZ]
//                Recalling an answer fixes it far better than re-reading it.
//   Flashcards — built from an article's [KEY-TERMS]. Scheduled with FSRS
//                (the spaced-repetition method Anki uses), so a card comes
//                back just before it would be forgotten. Progress is kept on
//                this device only.
//   MindMap    — [MINDMAP] a short markdown outline [/MINDMAP], drawn as an
//                interactive mind map with markmap: the whole topic in one
//                picture. The library loads only when the map scrolls into view.

const shell = 'my-8 rounded-2xl border border-gray-200 bg-white p-4 sm:p-6';

function Heading({ icon: Icon, title, sub }) {
  return (
    <div className="flex items-start gap-3 mb-4">
      <span className="w-9 h-9 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center shrink-0"><Icon className="w-5 h-5" /></span>
      <div>
        <p className="text-[15px] sm:text-base font-bold text-gray-900 leading-snug">{title}</p>
        {sub && <p className="text-xs sm:text-sm text-gray-500 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

// Stable shuffle, so options don't jump around between renders
function shuffled(list, seed) {
  const a = [...list];
  let s = [...seed].reduce((n, c) => (n * 31 + c.charCodeAt(0)) >>> 0, 7);
  for (let i = a.length - 1; i > 0; i--) {
    s = (s * 1103515245 + 12345) >>> 0;
    const j = s % (i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ── Quiz ────────────────────────────────────────────────────────────────────
export function Quiz({ rows }) {
  const questions = useMemo(() => rows.map(([q, right, ...rest]) => {
    const why = rest.length > 2 ? rest.pop() : '';
    return { q, right, options: shuffled([right, ...rest], q), why };
  }), [rows]);
  const [picked, setPicked] = useState({});
  const answered = Object.keys(picked).length;
  const score = questions.filter((x, i) => picked[i] === x.right).length;

  return (
    <section className={shell} aria-label="Test yourself">
      <Heading icon={ListChecks} title="Test yourself" sub="Answer from memory first. It is the fastest way to make it stick." />
      <ol className="space-y-5">
        {questions.map((x, i) => {
          const done = picked[i] !== undefined;
          return (
            <li key={i}>
              <p className="text-sm sm:text-[15px] font-semibold text-gray-900 leading-snug">{i + 1}. {x.q}</p>
              <div className="mt-2 grid gap-2">
                {x.options.map(o => {
                  const isRight = o === x.right, isPicked = picked[i] === o;
                  const tone = !done ? 'border-gray-200 hover:border-brand-600/40 hover:bg-brand-50/50 cursor-pointer'
                    : isRight ? 'border-emerald-300 bg-emerald-50 text-emerald-900'
                    : isPicked ? 'border-red-200 bg-red-50 text-red-800' : 'border-gray-100 text-gray-400';
                  return (
                    <button key={o} type="button" disabled={done} onClick={() => setPicked(p => ({ ...p, [i]: o }))}
                      className={`flex items-center justify-between gap-3 text-left text-sm rounded-xl border px-3.5 py-2.5 transition-colors ${tone}`}>
                      <span>{o}</span>
                      {done && isRight && <Check className="w-4 h-4 shrink-0" />}
                      {done && isPicked && !isRight && <X className="w-4 h-4 shrink-0" />}
                    </button>
                  );
                })}
              </div>
              {done && x.why && <p className="mt-2 text-sm text-gray-600 leading-relaxed bg-gray-50 rounded-lg px-3 py-2">{x.why}</p>}
            </li>
          );
        })}
      </ol>
      {answered === questions.length && (
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-brand-50 border border-brand-100 px-4 py-3">
          <p className="text-sm font-semibold text-brand-800">
            {score} of {questions.length} right. {score === questions.length ? 'Well done — you can speak on this.' : 'Re-read the points you missed, then try again.'}
          </p>
          <button type="button" onClick={() => setPicked({})} className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 cursor-pointer">
            <RotateCcw className="w-4 h-4" /> Try again
          </button>
        </div>
      )}
    </section>
  );
}

// ── Flashcards with spaced repetition ───────────────────────────────────────
const SCHED = fsrs();
const STORE = 'ssbc:flashcards';

function loadDeck() {
  try { return JSON.parse(localStorage.getItem(STORE) || '{}'); } catch { return {}; }
}
function saveCard(id, card) {
  try {
    const all = loadDeck();
    all[id] = card;
    localStorage.setItem(STORE, JSON.stringify(all));
  } catch { /* private mode: the session still works, it just isn't kept */ }
}
const revive = c => c && ({ ...c, due: new Date(c.due), last_review: c.last_review ? new Date(c.last_review) : undefined });

function whenText(date) {
  const mins = Math.round((date - Date.now()) / 60000);
  if (mins < 60) return `${Math.max(1, mins)} min`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs} h`;
  return `${Math.round(hrs / 24)} d`;
}

export function Flashcards({ terms }) {
  const ids = terms.map(([t]) => `term:${t.trim().toLowerCase()}`);
  const [deck, setDeck] = useState(() => {
    const all = loadDeck();
    return Object.fromEntries(ids.map(id => [id, revive(all[id]) || createEmptyCard(new Date())]));
  });
  const [flipped, setFlipped] = useState(false);
  const [, tick] = useState(0);

  const now = new Date();
  const due = ids.filter(id => deck[id].due <= now);
  const current = due[0];
  const [term, meaning] = current ? terms[ids.indexOf(current)] : [];
  const preview = current ? SCHED.repeat(deck[current], now) : null;
  const nextDue = !current && ids.map(id => deck[id].due).sort((a, b) => a - b)[0];

  useEffect(() => { // so "come back in 1 min" cards return without a reload
    if (current || !nextDue) return;
    const t = setTimeout(() => tick(n => n + 1), Math.max(1000, Math.min(nextDue - Date.now(), 2 ** 31 - 1)));
    return () => clearTimeout(t);
  }, [current, nextDue]);

  function rate(r) {
    const next = preview[r].card;
    saveCard(current, next);
    setDeck(d => ({ ...d, [current]: next }));
    setFlipped(false);
  }

  const learned = ids.filter(id => deck[id].reps > 0).length;
  return (
    <section className={shell} aria-label="Flashcards">
      <Heading icon={Layers} title="Flashcards"
        sub={`${terms.length} key terms · ${learned} learned · cards come back just before you would forget them`} />
      {current ? (
        <>
          <button type="button" onClick={() => setFlipped(f => !f)} className="block w-full [perspective:1000px] cursor-pointer" aria-live="polite">
            <span className="relative block h-40 sm:h-44 transition-transform duration-500 [transform-style:preserve-3d]"
              style={{ transform: flipped ? 'rotateY(180deg)' : 'none' }}>
              <span className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl bg-brand-600 text-white px-5 [backface-visibility:hidden]">
                <span className="text-xl sm:text-2xl font-bold text-center">{term}</span>
                <span className="mt-3 text-xs text-white/70">Say what it means, then tap to check</span>
              </span>
              <span className="absolute inset-0 flex items-center justify-center rounded-2xl bg-brand-50 border border-brand-100 px-5 text-center text-sm sm:text-base text-gray-800 leading-relaxed [backface-visibility:hidden] [transform:rotateY(180deg)]">
                {meaning}
              </span>
            </span>
          </button>
          {flipped ? (
            <div className="mt-3 grid grid-cols-4 gap-2">
              {[[Rating.Again, 'Forgot'], [Rating.Hard, 'Hard'], [Rating.Good, 'Good'], [Rating.Easy, 'Easy']].map(([r, label]) => (
                <button key={label} type="button" onClick={() => rate(r)}
                  className="rounded-xl border border-gray-200 py-2 text-sm font-semibold text-gray-700 hover:border-brand-600/40 hover:bg-brand-50 cursor-pointer">
                  {label}<span className="block text-[11px] font-normal text-gray-400">{whenText(preview[r].card.due)}</span>
                </button>
              ))}
            </div>
          ) : (
            <p className="mt-3 text-center text-xs text-gray-400">{due.length} card{due.length === 1 ? '' : 's'} to go</p>
          )}
        </>
      ) : (
        <p className="rounded-xl bg-emerald-50 border border-emerald-100 px-4 py-3 text-sm text-emerald-800">
          All caught up. Your next card is due in {whenText(nextDue)} — come back then and it will be waiting.
        </p>
      )}
    </section>
  );
}

// ── Mind map ────────────────────────────────────────────────────────────────
export function MindMap({ markdown }) {
  const holder = useRef(null);
  const svgRef = useRef(null);
  const mm = useRef(null);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const el = holder.current;
    if (!el) return;
    let cancelled = false;
    const draw = async () => {
      try {
        const [{ Transformer }, { Markmap }] = await Promise.all([import('markmap-lib'), import('markmap-view')]);
        if (cancelled) return;
        const { root } = new Transformer().transform(markdown);
        mm.current = Markmap.create(svgRef.current, {
          // Fully open, and never zoomed past 100% — a small map otherwise fills the box with giant text
          color: () => '#6b86ad', duration: 400, initialExpandLevel: -1, maxInitialScale: 1, maxWidth: 220, paddingX: 10, spacingVertical: 6,
        }, root);
        setReady(true);
      } catch {
        if (!cancelled) setFailed(true);
      }
    };
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { io.disconnect(); draw(); } }, { rootMargin: '200px' });
    io.observe(el);
    return () => { cancelled = true; io.disconnect(); mm.current?.destroy?.(); };
  }, [markdown]);

  // The outline as plain text, shown if the map can't be drawn
  const outline = markdown.split('\n').filter(l => /^\s*[-#]/.test(l));

  return (
    <section ref={holder} className={shell} aria-label="Mind map">
      <div className="flex items-start justify-between gap-3">
        <Heading icon={Network} title="Mind map" sub="The whole topic in one picture. Tap a branch to open or close it; drag to move." />
        {ready && (
          <button type="button" onClick={() => mm.current?.fit()} title="Fit to view"
            className="shrink-0 w-9 h-9 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:text-gray-800 cursor-pointer">
            <Maximize2 className="w-4 h-4" />
          </button>
        )}
      </div>
      {failed ? (
        <ul className="text-sm text-gray-700 space-y-1">{outline.map((l, i) => <li key={i} style={{ paddingLeft: `${(l.match(/^\s*/)[0].length / 2) * 12}px` }}>{l.replace(/^\s*[-#]+\s*/, '')}</li>)}</ul>
      ) : (
        <div className="relative rounded-xl bg-gray-50 border border-gray-100 overflow-hidden">
          {!ready && <p className="absolute inset-0 flex items-center justify-center text-sm text-gray-400">Drawing the mind map…</p>}
          <svg ref={svgRef} className="w-full h-[360px] sm:h-[440px] text-[13px]" />
        </div>
      )}
    </section>
  );
}
