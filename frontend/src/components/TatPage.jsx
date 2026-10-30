import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { getTat, analyzeTat } from '../services/api';
import { TAT_DEMOS } from '../data/tatDemo';
import SiteNav from './SiteNav';
import { trackEvent } from '../analytics';
import AiFeedback from './AiFeedback';
import AiWaitPanel from './AiWaitPanel';
import { AlertCircle, Clock, Eye, PenLine, Sparkles, ChevronRight, RotateCcw, Quote, User } from 'lucide-react';

// TAT practice, run the way the real test runs: the picture shows for 30
// seconds and disappears, then there are 4 minutes to write. The feedback
// reads the story the way an assessor would, and never gives a score — a
// single story is not a verdict, the series is.

const PICTURE_COUNT = 33;          // frontend/public/tat/01.jpg … 33.jpg
const VIEW_SECONDS  = 30;
const WRITE_SECONDS = 240;

const pictureSrc = id => `/tat/${String(id).padStart(2, '0')}.jpg`;
const words = s => (s.trim().match(/\S+/g) || []).length;
const clock = s => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

// Prefer pictures this aspirant has not written on recently
function pickPicture(recentIds) {
  const all = Array.from({ length: PICTURE_COUNT }, (_, i) => i + 1);
  const fresh = all.filter(id => !recentIds.includes(id));
  const pool = fresh.length ? fresh : all;
  return pool[Math.floor(Math.random() * pool.length)];
}

// Resets only when `round` changes, so pausing (e.g. while analysing) keeps the time shown
function useCountdown(seconds, running, onDone, round) {
  const [left, setLeft] = useState(seconds);
  const done = useRef(onDone);
  done.current = onDone;
  useEffect(() => { setLeft(seconds); }, [seconds, round]);
  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => setLeft(l => {
      if (l <= 1) { clearInterval(t); done.current?.(); return 0; }
      return l - 1;
    }), 1000);
    return () => clearInterval(t);
  }, [running]);
  return left;
}

function Picture({ id, className = '' }) {
  if (id === 0) {
    return (
      <div className={`bg-white border-2 border-dashed border-gray-300 rounded-xl flex items-center justify-center text-sm text-gray-400 ${className}`}>
        Blank slide — imagine your own picture
      </div>
    );
  }
  return <img src={pictureSrc(id)} alt="TAT picture" className={`rounded-xl border border-gray-200 bg-gray-100 object-contain ${className}`} />;
}

// ── Report ──────────────────────────────────────────────────────────────────

const FIT = {
  fits:   { label: 'Fits the picture',        cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  partly: { label: 'Partly fits the picture', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  off:    { label: 'Does not fit the picture', cls: 'bg-red-50 text-red-700 border-red-200' },
};
const LEVEL = {
  strong:     { label: 'Strong',     cls: 'bg-emerald-500' },
  developing: { label: 'Developing', cls: 'bg-amber-400' },
  weak:       { label: 'Weak',       cls: 'bg-red-400' },
};

function Heading({ children, note }) {
  return (
    <div className="mb-2.5">
      <p className="text-[12px] font-bold uppercase tracking-[0.15em] text-gray-400">{children}</p>
      {note && <p className="text-xs text-gray-500 mt-1 leading-relaxed">{note}</p>}
    </div>
  );
}

function Report({ attempt }) {
  const a = attempt.analysis || {};
  const fit = FIT[a.picture_fit?.verdict];
  return (
    <div className="space-y-5">
      <div className="bg-white border border-gray-200 rounded-2xl p-5 sm:p-6 grid grid-cols-1 sm:grid-cols-5 gap-5">
        <Picture id={attempt.picture_id} className="sm:col-span-2 w-full max-h-64" />
        <div className="sm:col-span-3">
          <p className="text-[12px] font-bold uppercase tracking-[0.15em] text-gray-400 mb-2">Your story · {words(attempt.story)} words</p>
          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{attempt.story}</p>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl p-5 sm:p-6 space-y-6">
        {a.summary && (
          <div className="bg-brand-50 border border-brand-100 rounded-xl px-4 py-3">
            <p className="text-[12px] font-bold text-brand-700 mb-1">How an assessor might read this</p>
            <p className="text-sm text-gray-700 leading-relaxed">{a.summary}</p>
          </div>
        )}

        {(fit || a.structure) && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {fit && (
              <div>
                <Heading>The picture</Heading>
                <span className={`inline-block text-[12px] font-bold px-2.5 py-1 rounded-full border ${fit.cls}`}>{fit.label}</span>
                {a.picture_fit.note && <p className="text-xs text-gray-600 mt-2 leading-relaxed">{a.picture_fit.note}</p>}
              </div>
            )}
            {a.hero && (
              <div>
                <Heading>Your hero</Heading>
                <p className="text-xs text-gray-600 leading-relaxed">{a.hero}</p>
              </div>
            )}
          </div>
        )}

        {a.structure && (
          <div>
            <Heading note="A clear story has three parts.">Story shape</Heading>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {[['before', 'What led to it'], ['action', 'What the hero does'], ['outcome', 'How it ends']].map(([k, label]) => {
                const missing = /^missing/i.test(a.structure[k] || '');
                return (
                  <div key={k} className={`border rounded-xl p-3 ${missing ? 'border-red-200 bg-red-50/50' : 'border-gray-200'}`}>
                    <p className="text-[12px] font-bold text-gray-800">{label}</p>
                    <p className={`text-xs mt-1 leading-relaxed ${missing ? 'text-red-600' : 'text-gray-600'}`}>{a.structure[k]}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {a.pillars?.length > 0 && (
          <div>
            <Heading note="What the psychologist looks for in every story. No marks — this is a picture of how you think.">The five things assessors read</Heading>
            <div className="space-y-2.5">
              {a.pillars.map((p, i) => {
                const lv = LEVEL[p.level] || LEVEL.developing;
                return (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-28 shrink-0">
                      <p className="text-xs font-bold text-gray-800">{p.name}</p>
                      <p className="flex items-center gap-1.5 text-[11px] text-gray-500 mt-0.5">
                        <span className={`w-2 h-2 rounded-full ${lv.cls}`} />{lv.label}
                      </p>
                    </div>
                    <p className="text-xs text-gray-600 leading-relaxed flex-1">{p.note}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {a.borrowed?.length > 0 && (
          <div>
            <Heading note="Assessors spot memorised themes fast. Your own simple idea is worth more.">Lines that sound borrowed</Heading>
            <div className="space-y-2.5">
              {a.borrowed.map((b, i) => (
                <div key={i} className="border-l-2 border-red-300 pl-3">
                  <p className="text-sm text-gray-800 italic flex items-start gap-1.5"><Quote className="w-3 h-3 mt-1 shrink-0 text-red-300" />{b.quote}</p>
                  <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{b.why}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {a.strengths?.length > 0 && (
          <div>
            <Heading>What works</Heading>
            <ul className="space-y-1.5">
              {a.strengths.map((s, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-700 leading-relaxed">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0 mt-2" />{s}
                </li>
              ))}
            </ul>
          </div>
        )}

        {a.improve?.length > 0 && (
          <div>
            <Heading>What to change</Heading>
            <div className="space-y-3">
              {a.improve.map((g, i) => (
                <div key={i} className="border-l-2 border-amber-300 pl-3">
                  <p className="text-sm font-semibold text-gray-800">{g.issue}</p>
                  <p className="text-xs text-brand-700 mt-1 leading-relaxed">Do this: {g.fix}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {a.from_your_life ? (
          <div className="border border-emerald-200 bg-emerald-50/60 rounded-xl px-4 py-3.5">
            <p className="text-[12px] font-bold text-emerald-800 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" /> Optional ideas from your PIQ
            </p>
            <p className="text-[12px] text-emerald-800/70 mb-2">
              We read your PIQ and found experiences that could suit this picture. These are only suggestions —
              your story should come from what you see in the picture.
            </p>
            <p className="text-sm text-gray-700 leading-relaxed">{a.from_your_life.link}</p>
            {a.from_your_life.ideas?.length > 0 && (
              <ul className="mt-2 space-y-1.5">
                {a.from_your_life.ideas.map((idea, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-700 leading-relaxed">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0 mt-2" />{idea}
                  </li>
                ))}
              </ul>
            )}
            <p className="text-[12px] text-emerald-800/70 mt-2">Use one only if it feels natural. Real experience is easier to write and hard to fake, but a forced one reads like a memorised theme.</p>
          </div>
        ) : (
          <Link to="/piq" className="block border border-dashed border-gray-300 rounded-xl px-4 py-3 hover:border-brand-300 transition-colors">
            <p className="text-sm font-semibold text-gray-800">Want ideas from your own life?</p>
            <p className="text-xs text-gray-500 mt-0.5">Fill your PIQ and we will suggest real experiences of yours that could fit pictures like this one. Optional. →</p>
          </Link>
        )}

        {a.rethink?.length > 0 && (
          <div>
            <Heading note="Rewrite this same story in your own words. Answer these first.">Before you rewrite</Heading>
            <ol className="space-y-1.5 list-decimal pl-5">
              {a.rethink.map((q, i) => <li key={i} className="text-sm text-gray-700 leading-relaxed">{q}</li>)}
            </ol>
          </div>
        )}

        <p className="text-[12px] text-gray-400 leading-relaxed border-t border-gray-100 pt-4">
          Practice feedback on one story, not an assessment. At the SSB your whole series is read together.
          Write what you truly think — the truth needs no remembering.
        </p>
      </div>
    </div>
  );
}

// ── Page ────────────────────────────────────────────────────────────────────

export default function TatPage() {
  const [phase,    setPhase]    = useState('intro');   // intro | view | write | analysing | report
  const [picture,  setPicture]  = useState(null);
  const [story,    setStory]    = useState('');
  const [timed,    setTimed]    = useState(true);
  const [error,    setError]    = useState('');
  const [attempts, setAttempts] = useState([]);
  const [usage,    setUsage]    = useState(null);
  const [current,  setCurrent]  = useState(null);
  const [round,    setRound]    = useState(0);
  const [waited,   setWaited]   = useState(0);

  useEffect(() => {
    getTat()
      .then(d => { setAttempts(d.attempts || []); setUsage({ used: d.used_today, limit: d.daily_limit }); })
      .catch(() => {});
  }, []);

  const viewLeft  = useCountdown(VIEW_SECONDS,  phase === 'view', () => setPhase('write'), round);
  const writeLeft = useCountdown(WRITE_SECONDS, phase === 'write' && timed, () => {}, round);

  // Analysis can take up to a minute on the free model; a ticking count shows it is still working
  useEffect(() => {
    if (phase !== 'analysing') return;
    setWaited(0);
    const t = setInterval(() => setWaited(w => w + 1), 1000);
    return () => clearInterval(t);
  }, [phase]);

  function start(id) {
    setPicture(id ?? pickPicture(attempts.map(a => a.picture_id)));
    setStory(''); setError(''); setTimed(true); setRound(r => r + 1);
    setPhase(id === 0 ? 'write' : 'view');
    trackEvent('tat_start', { blank: id === 0 });
  }

  function loadDemo(demo) {
    setPicture(demo.pictureId); setStory(demo.story); setError('');
    setTimed(false); setPhase('write');
  }

  async function submit() {
    setPhase('analysing'); setError('');
    try {
      const { attempt, used_today, daily_limit, has_piq } = await analyzeTat(picture, story);
      trackEvent('tat_submit', { words: words(story), timed, with_piq: !!has_piq });
      setAttempts(list => [attempt, ...list]);
      setUsage({ used: used_today, limit: daily_limit });
      setCurrent(attempt);
      setPhase('report');
    } catch (err) {
      setError(err.message || 'Could not analyse your story.');
      setPhase('write');
      trackEvent('tat_error');
    }
  }

  const wc = words(story);
  const timeUp = timed && writeLeft === 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <SiteNav />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-7 space-y-5">

        {phase === 'intro' && (
          <>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-brand-600">TAT Practice</p>
              <h1 className="mt-2 text-2xl sm:text-3xl font-bold text-gray-900 leading-tight">Write a story, see how it reads</h1>
              <p className="mt-3 text-sm text-gray-500 leading-relaxed">
                Just like the real test: you see a picture for 30 seconds, then you have 4 minutes to write a story.
                The feedback reads it the way a psychologist would.
              </p>
              {usage && <p className="mt-2 text-[12px] text-gray-400">{usage.used} of {usage.limit} stories analysed today</p>}
            </div>

            <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-3">
              <p className="text-sm font-bold text-gray-900">Before you start</p>
              <ul className="space-y-2 text-sm text-gray-600 leading-relaxed">
                <li>• <b>Write your own thoughts.</b> A simple honest idea beats a memorised theme. Assessors spot copied lines fast.</li>
                <li>• <b>Let the story come from the picture.</b> Don't force a favourite theme onto it.</li>
                <li>• <b>Keep your hero real.</b> Solve the problem with normal means and practical steps, not one magic line.</li>
                <li>• <b>Believe in your hero.</b> If they worked hard, let it pay off.</li>
                <li>• <b>Think in three parts:</b> what led to this, what the hero does, how it ends.</li>
              </ul>
            </div>

            <div className="flex flex-wrap gap-3">
              <button onClick={() => start()} className="btn-primary text-sm px-6 py-3 inline-flex items-center gap-2">
                <Eye className="w-4 h-4" /> Show me a picture
              </button>
              <button onClick={() => start(0)} className="btn-secondary text-sm px-5 py-3">Blank slide</button>
            </div>

            {import.meta.env.DEV && (
              <div className="flex flex-wrap gap-2">
                {TAT_DEMOS.map(d => (
                  <button key={d.label} type="button" onClick={() => loadDemo(d)}
                    className="text-[12px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-lg cursor-pointer hover:bg-amber-100">
                    Dev: {d.label}
                  </button>
                ))}
              </div>
            )}
          </>
        )}

        {phase === 'view' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold text-gray-900 flex items-center gap-2"><Eye className="w-4 h-4 text-brand-600" /> Look carefully</p>
              <span className="text-sm font-bold tabular-nums text-brand-700 flex items-center gap-1.5"><Clock className="w-4 h-4" />{clock(viewLeft)}</span>
            </div>
            <Picture id={picture} className="w-full max-h-[70vh]" />
            <button onClick={() => setPhase('write')} className="text-xs font-semibold text-gray-400 hover:text-gray-600 cursor-pointer">
              I'm ready to write →
            </button>
          </div>
        )}

        {(phase === 'write' || phase === 'analysing') && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold text-gray-900 flex items-center gap-2"><PenLine className="w-4 h-4 text-brand-600" /> Write your story</p>
              {timed && (
                <span className={`text-sm font-bold tabular-nums flex items-center gap-1.5 ${writeLeft <= 30 ? 'text-red-600' : 'text-brand-700'}`}>
                  <Clock className="w-4 h-4" />{clock(writeLeft)}
                </span>
              )}
            </div>
            {picture === 0 && <p className="text-xs text-gray-500">Blank slide: picture a scene in your mind, then write about it.</p>}
            {timeUp && <p className="text-xs font-semibold text-red-600">Time is up. At the SSB you would stop here — finish your line and submit.</p>}
            <textarea
              className="input-base text-sm w-full min-h-[260px] leading-relaxed"
              placeholder="What led to this scene? What does your hero do? How does it end?"
              value={story} onChange={e => setStory(e.target.value)} disabled={phase === 'analysing'} autoFocus />
            <div className="flex flex-wrap items-center gap-3">
              <button onClick={submit} disabled={phase === 'analysing' || wc < 30}
                className="inline-flex items-center gap-1.5 bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors cursor-pointer">
                <Sparkles className="w-4 h-4" />
                {phase === 'analysing' ? `Reading your story… ${waited}s` : 'Get feedback'}
              </button>
              <span className="text-xs text-gray-400">
                {phase === 'analysing' ? 'This usually takes 20–60 seconds. Please keep this page open.' : `${wc} words${wc < 30 ? ' · write at least 30' : ''}`}
              </span>
              <button onClick={() => setPhase('intro')} disabled={phase === 'analysing'}
                className="ml-auto text-xs font-semibold text-gray-400 hover:text-gray-600 cursor-pointer">Cancel</button>
            </div>
            {error && (
              <p className="text-xs text-red-600 flex items-start gap-1.5"><AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" /> {error}</p>
            )}
            {phase === 'analysing' && (
              <AiWaitPanel title="Reading your story like an assessor would" steps={[
                { label: 'Reading your story', at: 0 },
                { label: 'Looking at your hero, the action and the outcome', at: 6 },
                { label: 'Spotting the qualities it shows', at: 15 },
                { label: 'Writing your feedback', at: 26 },
              ]} />
            )}
          </div>
        )}

        {phase === 'report' && current && (
          <>
            <Report attempt={current} />
            <AiFeedback key={current.id} feature="tat" refId={current.id} prompt="Was this feedback on your story useful?" />
            <div className="flex flex-wrap gap-3">
              <button onClick={() => start()} className="btn-primary text-sm px-5 py-2.5 inline-flex items-center gap-2">
                <Eye className="w-4 h-4" /> Next picture
              </button>
              <button onClick={() => { setStory(current.story); setPicture(current.picture_id); setTimed(false); setPhase('write'); trackEvent('tat_rewrite'); }}
                className="btn-secondary text-sm px-5 py-2.5 inline-flex items-center gap-2">
                <RotateCcw className="w-4 h-4" /> Rewrite this one
              </button>
            </div>
          </>
        )}

        {attempts.length > 0 && phase !== 'view' && (
          <div className="pt-2">
            <p className="text-[12px] font-bold uppercase tracking-[0.15em] text-gray-400 mb-2.5">Your recent stories</p>
            <div className="space-y-2">
              {attempts.map(a => (
                <button key={a.id} type="button" onClick={() => { setCurrent(a); setPhase('report'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  className="w-full flex items-center gap-3 bg-white border border-gray-200 rounded-xl p-2.5 text-left hover:border-brand-300 transition-colors cursor-pointer">
                  <Picture id={a.picture_id} className="w-16 h-12 shrink-0 text-[8px]" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-gray-700 line-clamp-2">{a.story}</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">{new Date(a.created_at).toLocaleString('en-IN')}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300 shrink-0" />
                </button>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
