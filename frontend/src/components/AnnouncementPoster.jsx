import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { X, FileText, PenLine, Mic, ArrowRight, Quote, BadgeCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { TESTIMONIALS } from '../data/testimonials';
import { trackEvent } from '../analytics';
import { firstName } from './Hello';

// "Prepare for the SSB smartly" — an announcement poster for the AI tools.
//
// Shown on the home page only. Pages people reach from search (the officer
// guide, articles) are left alone: Google ranks pages down when a pop-up
// covers them for mobile visitors. Once closed it stays away for two weeks;
// once someone taps through it never comes back. Bump KEY to show a new
// announcement to everyone again.

const KEY = 'ssbc:poster-ai-tools';
const SNOOZE_DAYS = 14;
const DELAY_MS = 1500;

const FEATURES = [
  { icon: FileText, title: 'Get your PIQ assessed',
    text: 'See what your IO is likely to ask. Your report is a ready template of questions tailored to you — download it and stick it on your wall.' },
  { icon: PenLine, title: 'Get your TAT stories assessed',
    text: 'Write on real TAT pictures and get feedback the way an assessor reads them.' },
  { icon: Mic, title: 'Speak, and get your answers analysed',
    text: 'Answer Prep Sheet questions out loud and see how you really come across.' },
];

function shouldShow() {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (!v) return true;
    if (v.done) return false;
    return Date.now() - v.closedAt > SNOOZE_DAYS * 86400000;
  } catch { return false; }   // no storage: do not risk showing it on every visit
}
function remember(value) { try { localStorage.setItem(KEY, JSON.stringify(value)); } catch { /* private mode */ } }

export default function AnnouncementPoster() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const closeRef = useRef(null);

  useEffect(() => {
    if (pathname !== '/' || !shouldShow()) return;
    const t = setTimeout(() => { setOpen(true); trackEvent('poster_view'); }, DELAY_MS);
    return () => clearTimeout(t);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const onKey = e => { if (e.key === 'Escape') close('esc'); };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = prev; };
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  function close(how) {
    remember({ closedAt: Date.now() });
    trackEvent('poster_close', { how });
    setOpen(false);
  }

  function go() {
    remember({ done: true });
    trackEvent('poster_cta');
    setOpen(false);
    navigate(user ? '/piq' : '/register');
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] bg-black/50 flex items-end sm:items-center justify-center sm:p-4" onMouseDown={() => close('backdrop')}>
      <div role="dialog" aria-modal="true" aria-labelledby="poster-title" onMouseDown={e => e.stopPropagation()}
        className="relative w-full sm:max-w-lg max-h-[92vh] overflow-y-auto bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl">

        {/* Poster head */}
        <div className="relative overflow-hidden bg-gradient-to-br from-brand-700 via-brand-600 to-indigo-600 text-white px-6 pt-6 pb-7 rounded-t-3xl">
          <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full bg-white/10" aria-hidden="true" />
          <div className="absolute right-10 bottom-[-40px] w-24 h-24 rounded-full bg-white/5" aria-hidden="true" />
          <button ref={closeRef} type="button" onClick={() => close('x')} aria-label="Close"
            className="absolute top-3 right-3 w-10 h-10 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/20 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-white">
            <X className="w-5 h-5" />
          </button>
          <p className="relative inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.2em] bg-white/15 border border-white/20 px-2.5 py-1 rounded-full">
            New on SSBCircle
          </p>
          <h2 id="poster-title" className="relative mt-3 text-[1.9rem] sm:text-4xl font-extrabold leading-[1.05] tracking-tight">
            {user ? <>{firstName(user)}, prepare<br />for the SSB smartly.</> : <>Prepare for the SSB<br />smartly.</>}
          </h2>
          <p className="relative mt-3 text-sm sm:text-base text-white/85 leading-relaxed max-w-sm">
            AI feedback built on the methods SSB mentors use to assess candidates.
          </p>
        </div>

        {/* What you get */}
        <ul className="px-6 pt-5 space-y-4">
          {FEATURES.map(({ icon: Icon, title, text }) => (
            <li key={title} className="flex gap-3.5">
              <span className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center shrink-0"><Icon className="w-5 h-5" /></span>
              <div>
                <p className="text-base font-bold text-gray-900 leading-snug">{title}</p>
                <p className="text-sm text-gray-600 leading-relaxed mt-0.5">{text}</p>
              </div>
            </li>
          ))}
        </ul>

        {/* Real results */}
        {TESTIMONIALS.length > 0 && (
          <div className="px-6 pt-5">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-gray-500">From aspirants</p>
            <div className="mt-2 flex gap-3 overflow-x-auto snap-x snap-mandatory scrollbar-hide -mx-6 px-6 pb-1">
              {TESTIMONIALS.map(t => (
                <figure key={t.name} className={`snap-start shrink-0 ${TESTIMONIALS.length > 1 ? 'w-[85%]' : 'w-full'} bg-amber-50 border border-amber-100 rounded-2xl p-4`}>
                  <Quote className="w-5 h-5 text-amber-400" aria-hidden="true" />
                  <blockquote className="mt-1.5 text-sm text-gray-800 leading-relaxed">{t.quote}</blockquote>
                  <figcaption className="mt-3 flex items-center gap-2">
                    <span className="w-8 h-8 rounded-full bg-brand-600 text-white text-xs font-bold flex items-center justify-center">{t.name[0]}</span>
                    <span>
                      <span className="block text-sm font-bold text-gray-900">{t.name}</span>
                      <span className="flex items-center gap-1 text-xs font-semibold text-emerald-700"><BadgeCheck className="w-3.5 h-3.5" /> {t.result}</span>
                    </span>
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        )}

        {/* Action */}
        <div className="px-6 pt-5 pb-6" style={{ paddingBottom: 'calc(1.5rem + env(safe-area-inset-bottom))' }}>
          <button type="button" onClick={go} className="w-full btn-primary text-base py-3.5">
            {user ? 'Get my PIQ assessed' : 'Get started'} <ArrowRight className="w-5 h-5" />
          </button>
          <button type="button" onClick={() => close('later')}
            className="mt-2 w-full text-sm font-semibold text-gray-500 hover:text-gray-700 py-2.5 cursor-pointer">
            Maybe later
          </button>
        </div>
      </div>
    </div>
  );
}
