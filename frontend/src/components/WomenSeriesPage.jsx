import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { CheckCircle, ArrowRight, BookOpen } from 'lucide-react';
import IndianWomanOutline from './SwipeReader/scenes/IndianWomanOutline';

const SERIES = [
  { slug: 'women-workforce-paradox',    n: 1, title: 'The Workforce Paradox',         category: 'Economic',       stat: '41.7%', reading_time: 5, summary: 'India grows richer — women work less. FLFPR, pink collarization, the care economy trap.' },
  { slug: 'women-proxy-representation', n: 2, title: 'Power Without Authority',       category: 'Polity',         stat: '46.6%', reading_time: 4, summary: 'She won the election. He runs the village. Sarpanch Pati, 73rd Amendment, NCW notices 2025.' },
  { slug: 'women-glass-ceiling',        n: 3, title: 'The Invisible Ceiling',         category: 'Economic',       stat: '17%',   reading_time: 5, summary: 'Women hold 33% of entry-level roles. Only 17% reach the C-suite. Glass ceiling, broken rung, glass cliff.' },
  { slug: 'women-gender-pay-gap',       n: 4, title: 'The Pay Gap Nobody Talks About',category: 'Economic',       stat: '₹76',   reading_time: 4, summary: 'For every ₹100 a man earns, a woman earns ₹76. And the gap widens as women rise.' },
  { slug: 'women-safety-economy',       n: 5, title: 'Safety Is an Economic Problem', category: 'Socio-Cultural', stat: '31%',   reading_time: 5, summary: 'An unsafe city locks women out of the economy. Nirbhaya Fund, POSH Act, Safe City Initiative.' },
  { slug: 'women-education-gap',        n: 6, title: "Education's Broken Promise",    category: 'Socio-Cultural', stat: '43%',   reading_time: 4, summary: 'Girls enrol. Girls top exams. Then they disappear. The STEM pipeline leak and child marriage.' },
  { slug: 'women-health-india',         n: 7, title: 'The Health Silence',            category: 'Socio-Cultural', stat: '63M',   reading_time: 5, summary: 'India is missing 63 million women. Maternal mortality, anaemia at 57%, malnutrition cycle.' },
];

const CAT_COLORS = {
  'Economic':       'bg-blue-50 text-blue-700',
  'Polity':         'bg-purple-50 text-purple-700',
  'Socio-Cultural': 'bg-brand-50 text-brand-700',
};

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
  const [read, setRead] = useState(() => getRead());

  useEffect(() => {
    const onFocus = () => setRead(getRead());
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, []);

  function handleRead(slug) {
    markRead(slug); setRead(getRead());
    navigate(`/read/${slug}`);
  }

  const done    = SERIES.filter(c => read.has(c.slug)).length;
  const nextCard = SERIES.find(c => !read.has(c.slug));

  return (
    <div className="min-h-screen bg-white">

      {/* ── Top nav ── */}
      <div className="border-b border-gray-100 px-4 sm:px-6 py-3">
        <div className="max-w-3xl mx-auto flex items-center gap-1.5 text-xs text-gray-400">
          <Link to="/" className="hover:text-gray-700 transition-colors">SSBCircle</Link>
          <span>/</span>
          <Link to="/current-affairs" className="hover:text-gray-700 transition-colors">News Cards</Link>
          <span>/</span>
          <span className="text-gray-600 font-medium">Society · Women</span>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-14">

        {/* ── Page header ── */}
        <div className="mb-10">
          {/* Woman outline — decorative, right-aligned */}
          <div className="flex items-start gap-6">
            <div className="flex-1">

          <div className="flex items-center gap-2 mb-4">
            <span className="text-[10px] font-bold text-brand-600 bg-brand-50 border border-brand-100 px-2.5 py-1 rounded-full uppercase tracking-widest">
              Society
            </span>
            <span className="text-[10px] text-gray-400">/</span>
            <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full uppercase tracking-widest">
              Women · 7 Cards
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 leading-snug mb-2">
            Major Issues Faced by Women in India
          </h1>
          <p className="text-sm text-gray-500 mb-6">
            7 swipe cards · GD · Lecturette · PI · Economic Survey 2025-26
          </p>

          {/* Progress */}
          <div className="flex items-center gap-4">
            <div className="flex-1 max-w-xs">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs text-gray-400">Progress</span>
                <span className="text-xs font-semibold text-gray-700">{done} / {SERIES.length} read</span>
              </div>
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-brand-600 rounded-full transition-all duration-500"
                  style={{ width: `${(done / SERIES.length) * 100}%` }} />
              </div>
            </div>

            {nextCard && (
              <button
                onClick={() => handleRead(nextCard.slug)}
                className="shrink-0 flex items-center gap-1.5 text-xs font-semibold text-brand-600 hover:text-brand-700 cursor-pointer transition-colors">
                {done === 0 ? 'Start reading' : 'Continue'} <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}

            {done === SERIES.length && (
              <span className="shrink-0 flex items-center gap-1 text-xs font-semibold text-emerald-600">
                <CheckCircle className="w-3.5 h-3.5" /> Complete
              </span>
            )}
          </div>
        </div>

            </div>{/* end flex-1 */}
            {/* Woman silhouette — visible on sm+ */}
            <div className="hidden sm:block shrink-0 w-28 opacity-80 mt-2">
              <IndianWomanOutline className="w-full h-auto" color="#1e3a5f" />
            </div>
          </div>{/* end flex row */}
        </div>{/* end mb-10 */}

        {/* ── Divider ── */}
        <div className="border-t border-gray-100 mb-2" />

        {/* ── Card list — Notion block style ── */}
        <div className="divide-y divide-gray-100">
          {SERIES.map((card) => {
            const isDone = read.has(card.slug);
            return (
              <button
                key={card.slug}
                onClick={() => handleRead(card.slug)}
                className="w-full text-left group py-4 flex items-start gap-4 hover:bg-gray-50 -mx-3 px-3 rounded-lg transition-colors cursor-pointer"
              >
                {/* Number */}
                <span className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold mt-0.5 transition-colors ${
                  isDone ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500 group-hover:bg-brand-50 group-hover:text-brand-600'
                }`}>
                  {isDone ? '✓' : card.n}
                </span>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className={`text-sm font-semibold leading-snug ${isDone ? 'text-gray-500' : 'text-gray-900'}`}>
                          {card.title}
                        </h3>
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-widest shrink-0 ${CAT_COLORS[card.category]}`}>
                          {card.category}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 leading-relaxed line-clamp-1">{card.summary}</p>
                    </div>

                    {/* Right side */}
                    <div className="shrink-0 flex flex-col items-end gap-1">
                      <span className="text-base font-extrabold text-brand-600 leading-none">{card.stat}</span>
                      <span className="text-[9px] text-gray-400">{card.reading_time} min</span>
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* ── Footer CTA ── */}
        <div className="border-t border-gray-100 mt-2 pt-8 text-center">
          {done === SERIES.length ? (
            <div>
              <p className="text-sm text-gray-600 mb-4">Series complete. Ready to practice?</p>
              <Link to="/?tab=live"
                className="inline-flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm px-5 py-2.5 rounded-lg transition-colors">
                Find a GD room <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ) : (
            <div>
              <p className="text-xs text-gray-400 mb-4">{SERIES.length - done} card{SERIES.length - done > 1 ? 's' : ''} remaining · ~{(SERIES.length - done) * 4}–{(SERIES.length - done) * 5} min</p>
              <Link to="/current-affairs" className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
                ← Back to all News Cards
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
