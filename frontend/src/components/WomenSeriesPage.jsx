import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { CheckCircle, ArrowRight, ArrowLeft } from 'lucide-react';
import IndianWomanOutline from './SwipeReader/scenes/IndianWomanOutline';

const SERIES = [
  { slug: 'women-workforce-paradox',    n: 1, title: 'The Workforce Paradox',          category: 'Economic',       stat: '41.7%', reading_time: 5, summary: 'India grows richer — women work less. FLFPR, pink collarization, the care economy trap.' },
  { slug: 'women-proxy-representation', n: 2, title: 'Power Without Authority',        category: 'Polity',         stat: '46.6%', reading_time: 4, summary: 'She won the election. He runs the village. Sarpanch Pati, 73rd Amendment, NCW notices 2025.' },
  { slug: 'women-glass-ceiling',        n: 3, title: 'The Invisible Ceiling',          category: 'Economic',       stat: '17%',   reading_time: 5, summary: 'Women hold 33% of entry-level roles. Only 17% reach the C-suite. Glass ceiling, broken rung, glass cliff.' },
  { slug: 'women-gender-pay-gap',       n: 4, title: 'The Pay Gap Nobody Talks About', category: 'Economic',       stat: '₹76',   reading_time: 4, summary: 'For every ₹100 a man earns, a woman earns ₹76. And the gap widens as women rise.' },
  { slug: 'women-safety-economy',       n: 5, title: 'Safety Is an Economic Problem',  category: 'Socio-Cultural', stat: '31%',   reading_time: 5, summary: 'An unsafe city locks women out of the economy. Nirbhaya Fund, POSH Act, Safe City Initiative.' },
  { slug: 'women-education-gap',        n: 6, title: "Education's Broken Promise",     category: 'Socio-Cultural', stat: '43%',   reading_time: 4, summary: 'Girls enrol. Girls top exams. Then they disappear. The STEM pipeline leak and child marriage.' },
  { slug: 'women-health-india',         n: 7, title: 'The Health Silence',             category: 'Socio-Cultural', stat: '63M',   reading_time: 5, summary: 'India is missing 63 million women. Maternal mortality, anaemia at 57%, malnutrition cycle.' },
];

const CAT = {
  'Economic':       { chip: 'bg-blue-50 text-blue-700',     stat: 'text-blue-700',   top: '#3b82f6' },
  'Polity':         { chip: 'bg-purple-50 text-purple-700', stat: 'text-purple-700', top: '#a855f7' },
  'Socio-Cultural': { chip: 'bg-brand-50 text-brand-700',   stat: 'text-brand-600',  top: '#1e3a5f' },
};

// Card rotation angles — gives the "cards lying on a desk" feel
const ROTS = [-2.5, 1.8, -1.2, 2.4, -1.6, 1, -2.2];

const LS_KEY = 'series_women_india_read';
function getRead() {
  try { return new Set(JSON.parse(localStorage.getItem(LS_KEY) || '[]')); }
  catch { return new Set(); }
}
function markRead(slug) {
  const s = getRead(); s.add(slug);
  try { localStorage.setItem(LS_KEY, JSON.stringify([...s])); } catch {}
}

export default function WomenSeriesPage() {
  const navigate = useNavigate();
  const [read,    setRead]    = useState(() => getRead());
  const [hovered, setHovered] = useState(null);

  useEffect(() => {
    const onFocus = () => setRead(getRead());
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, []);

  function handleRead(slug) {
    markRead(slug); setRead(getRead());
    navigate(`/read/${slug}`);
  }

  const done     = SERIES.filter(c => read.has(c.slug)).length;
  const nextCard = SERIES.find(c => !read.has(c.slug));

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── Breadcrumb ── */}
      <div className="border-b border-gray-100 bg-white px-4 sm:px-6 py-3">
        <div className="max-w-4xl mx-auto flex items-center gap-1.5 text-xs text-gray-400">
          <Link to="/" className="hover:text-gray-700 transition-colors">SSBCircle</Link>
          <span>/</span>
          <Link to="/current-affairs" className="hover:text-gray-700 transition-colors">News Cards</Link>
          <span>/</span>
          <span className="text-gray-600 font-medium">Society · Women</span>
        </div>
      </div>

      {/* ── Hero — dark navy ── */}
      <div className="bg-brand-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-10">

          {/* Back button — desktop only, top of hero */}
          <Link
            to="/current-affairs"
            className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold text-white/50 hover:text-white/80 transition-colors mb-5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            All News Cards
          </Link>

          <div className="flex items-end gap-6">
            <div className="flex-1">

              {/* Tags */}
              <div className="flex items-center gap-2 mb-3">
                <span className="text-[10px] font-bold text-white/50 uppercase tracking-widest">Society</span>
                <span className="text-white/25">/</span>
                <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Women · 7 Cards</span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-bold text-white leading-tight mb-1.5">
                Major Issues Faced by Women in India
              </h1>
              <p className="text-sm text-white/45 mb-7">
                GD · Lecturette · PI · Economic Survey 2025-26
              </p>

              {/* Progress */}
              <div className="flex items-center gap-4">
                <div className="flex-1 max-w-xs">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs text-white/45">Progress</span>
                    <span className="text-xs font-bold text-white/75">{done} / {SERIES.length} read</span>
                  </div>
                  <div className="h-1.5 bg-white/15 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-white rounded-full transition-all duration-500"
                      style={{ width: `${(done / SERIES.length) * 100}%` }}
                    />
                  </div>
                </div>

                {nextCard && (
                  <button
                    onClick={() => handleRead(nextCard.slug)}
                    className="shrink-0 flex items-center gap-1.5 text-xs font-semibold text-white bg-white/10 hover:bg-white/20 border border-white/20 px-3 py-1.5 rounded-full cursor-pointer transition-all"
                  >
                    {done === 0 ? 'Start reading' : 'Continue'} <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}

                {done === SERIES.length && (
                  <span className="shrink-0 flex items-center gap-1 text-xs font-semibold text-emerald-300">
                    <CheckCircle className="w-3.5 h-3.5" /> Complete
                  </span>
                )}
              </div>
            </div>

            {/* Officer illustration */}
            <div className="hidden sm:block shrink-0 w-16 opacity-35 pb-1">
              <IndianWomanOutline className="w-full h-auto" color="white" />
            </div>
          </div>
        </div>
      </div>

      {/* ── Card grid — lying cards ── */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 py-3">
          {SERIES.map((card, i) => {
            const isDone  = read.has(card.slug);
            const isHov   = hovered === i;
            const cat     = CAT[card.category];
            const topColor = isDone ? '#34d399' : cat.top;

            return (
              <div
                key={card.slug}
                onClick={() => handleRead(card.slug)}
                onMouseEnter={() => setHovered(i)}
                onMouseLeave={() => setHovered(null)}
                className="cursor-pointer"
                style={{
                  transform:  isHov
                    ? 'rotate(0deg) translateY(-4px) scale(1.03)'
                    : `rotate(${ROTS[i]}deg)`,
                  transition: 'transform 0.22s cubic-bezier(0.34,1.4,0.64,1), box-shadow 0.2s ease',
                  position:   'relative',
                  zIndex:     isHov ? 10 : 1,
                }}
              >
                <div
                  className={`rounded-2xl overflow-hidden border bg-white ${isDone ? 'border-emerald-200' : 'border-gray-200'}`}
                  style={{
                    boxShadow: isHov
                      ? '0 24px 48px rgba(30,58,95,0.18), 0 4px 12px rgba(30,58,95,0.06)'
                      : '0 2px 14px rgba(0,0,0,0.07)',
                  }}
                >
                  {/* Category colour bar */}
                  <div style={{ height: 4, background: topColor }} />

                  <div className="p-4">
                    {/* Header row */}
                    <div className="flex items-start justify-between mb-3">
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-widest ${cat.chip}`}>
                        {card.category}
                      </span>
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 ${
                        isDone ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'
                      }`}>
                        {isDone ? '✓' : card.n}
                      </span>
                    </div>

                    {/* Big stat */}
                    <p className={`text-[2.2rem] font-extrabold leading-none tracking-tight mb-2 ${isDone ? 'text-gray-300' : cat.stat}`}>
                      {card.stat}
                    </p>

                    {/* Title */}
                    <p className={`text-sm font-bold leading-snug mb-2 ${isDone ? 'text-gray-400' : 'text-gray-900'}`}>
                      {card.title}
                    </p>

                    {/* Summary */}
                    <p className="text-[10px] text-gray-400 leading-relaxed line-clamp-2">
                      {card.summary}
                    </p>

                    {/* Footer */}
                    <div className="mt-3 pt-2.5 border-t border-gray-100 flex items-center justify-between">
                      <span className="text-[9px] text-gray-400">{card.reading_time} min read</span>
                      <div className={`flex items-center gap-1 text-[10px] font-bold text-brand-600 transition-opacity duration-150 ${isHov ? 'opacity-100' : 'opacity-0'}`}>
                        Read card
                        <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Footer CTA ── */}
        <div className="border-t border-gray-200 mt-4 pt-8 text-center">
          {done === SERIES.length ? (
            <div>
              <p className="text-sm text-gray-600 mb-4">Series complete. Ready to practice?</p>
              <Link
                to="/?tab=live"
                className="inline-flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm px-5 py-2.5 rounded-lg transition-colors"
              >
                Find a GD room <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ) : (
            <div>
              <p className="text-xs text-gray-400 mb-3">
                {SERIES.length - done} card{SERIES.length - done > 1 ? 's' : ''} remaining
              </p>
              <Link to="/current-affairs" className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-400 hover:text-gray-700 transition-colors">
                <ArrowLeft className="w-3.5 h-3.5" /> Back to all News Cards
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
