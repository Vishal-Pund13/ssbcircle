import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { CheckCircle, BookOpen, ChevronLeft, ArrowRight } from 'lucide-react';

// ── Woman illustration — brand-navy SVG, platform-native aesthetic ─────────
function WomanIllustration() {
  return (
    <svg viewBox="0 0 420 200" fill="none" className="w-full max-w-[380px]" aria-hidden>
      {/* Background rings — like a rising sun/empowerment motif */}
      <circle cx="320" cy="100" r="90"  stroke="rgba(255,255,255,0.07)" strokeWidth="1.5"/>
      <circle cx="320" cy="100" r="68"  stroke="rgba(255,255,255,0.10)" strokeWidth="1.5"/>
      <circle cx="320" cy="100" r="46"  stroke="rgba(255,255,255,0.14)" strokeWidth="1.5"/>
      <circle cx="320" cy="100" r="24"  stroke="rgba(255,255,255,0.18)" strokeWidth="1.5"/>

      {/* Woman silhouette — geometric / platform style */}
      {/* Head */}
      <circle cx="320" cy="55" r="22" fill="rgba(255,255,255,0.18)" stroke="rgba(255,255,255,0.45)" strokeWidth="1.8"/>
      {/* Hair — flowing arc */}
      <path d="M300 50 Q298 32 320 28 Q344 26 346 48 Q347 56 340 62 Q338 42 320 40 Q304 40 302 54Z"
        fill="rgba(255,255,255,0.22)" stroke="rgba(255,255,255,0.35)" strokeWidth="1"/>
      {/* Neck + shoulders */}
      <path d="M313 75 L314 82 L295 90 Q288 93 285 102 L285 140 L355 140 L355 102 Q352 93 345 90 L326 82 L327 75Z"
        fill="rgba(255,255,255,0.14)" stroke="rgba(255,255,255,0.28)" strokeWidth="1.2"/>
      {/* Raised arm — empowerment gesture */}
      <path d="M345 92 Q358 78 368 64" stroke="rgba(255,255,255,0.55)" strokeWidth="3.5" strokeLinecap="round"/>
      {/* Raised fist */}
      <rect x="360" y="52" width="12" height="14" rx="3.5" fill="rgba(255,255,255,0.32)" stroke="rgba(255,255,255,0.55)" strokeWidth="1.5"/>
      <rect x="359" y="48" width="14" height="7" rx="2.5" fill="rgba(255,255,255,0.28)" stroke="rgba(255,255,255,0.5)" strokeWidth="1"/>

      {/* SSBCircle logo dots constellation — left side */}
      <circle cx="100" cy="45"  r="3.5" fill="rgba(255,255,255,0.5)"/>
      <circle cx="140" cy="25"  r="3.5" fill="rgba(255,255,255,0.5)"/>
      <circle cx="175" cy="50"  r="3.5" fill="rgba(255,255,255,0.5)"/>
      <circle cx="162" cy="88"  r="3.5" fill="rgba(255,255,255,0.5)"/>
      <circle cx="120" cy="80"  r="3.5" fill="rgba(255,255,255,0.5)"/>
      {/* Pentagon lines connecting them — like the logo */}
      <path d="M100 45 L140 25 L175 50 L162 88 L120 80 Z"
        stroke="rgba(255,255,255,0.2)" strokeWidth="1" fill="none"/>

      {/* Floating topic glyphs — 7 dots representing the 7 cards */}
      {[
        { cx: 40,  cy: 100, label: "₹" },
        { cx: 65,  cy: 140, label: "⚖" },
        { cx: 55,  cy: 60,  label: "🎓" },
        { cx: 200, cy: 155, label: "♥" },
        { cx: 240, cy: 30,  label: "🛡" },
        { cx: 210, cy: 100, label: "↑" },
        { cx: 280, cy: 165, label: "✦" },
      ].map((d, i) => (
        <g key={i}>
          <circle cx={d.cx} cy={d.cy} r="12" fill="rgba(255,255,255,0.1)" stroke="rgba(255,255,255,0.22)" strokeWidth="1"/>
          <text x={d.cx} y={d.cy + 4} textAnchor="middle" fontSize="9" fill="rgba(255,255,255,0.7)" fontWeight="bold">{d.label}</text>
        </g>
      ))}

      {/* Female symbol (♀) — large, ghosted */}
      <circle cx="70" cy="160" r="14" stroke="rgba(255,255,255,0.12)" strokeWidth="2" fill="none"/>
      <line x1="70" y1="174" x2="70" y2="188" stroke="rgba(255,255,255,0.12)" strokeWidth="2"/>
      <line x1="63" y1="182" x2="77" y2="182" stroke="rgba(255,255,255,0.12)" strokeWidth="2"/>
    </svg>
  );
}

// ── Unique icons for each card ────────────────────────────────────────────
const CARD_ICONS = {
  'women-workforce-paradox': ({ cls }) => (
    <svg viewBox="0 0 40 40" fill="none" className={cls}>
      {/* Person at laptop + rising bar */}
      <circle cx="14" cy="10" r="5" stroke="currentColor" strokeWidth="1.8"/>
      <path d="M8 22 Q14 18 20 22 L22 32 L6 32Z" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinejoin="round"/>
      <rect x="25" y="28" width="4" height="7" rx="1" fill="currentColor" opacity="0.5"/>
      <rect x="31" y="22" width="4" height="13" rx="1" fill="currentColor" opacity="0.7"/>
      <rect x="37" y="15" width="4" height="20" rx="1" fill="currentColor"/>
      <path d="M26 18 L32 12 L38 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M35 6 L38 6 L38 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  'women-proxy-representation': ({ cls }) => (
    <svg viewBox="0 0 40 40" fill="none" className={cls}>
      {/* Ballot box + two figures (one shadowed behind) */}
      <rect x="12" y="18" width="16" height="14" rx="2" stroke="currentColor" strokeWidth="1.8"/>
      <path d="M18 18 L18 24 L22 24 L22 18" stroke="currentColor" strokeWidth="1.5"/>
      {/* Front figure (woman) */}
      <circle cx="28" cy="7" r="4" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M23 16 Q28 13 33 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      {/* Shadow figure behind */}
      <circle cx="12" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.2" strokeDasharray="2 1" opacity="0.45"/>
      <path d="M7 16 Q12 13.5 17 16" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeDasharray="2 1" opacity="0.45"/>
      <text x="20" y="29" textAnchor="middle" fontSize="7" fill="currentColor" fontWeight="bold" opacity="0.7">VOTE</text>
    </svg>
  ),
  'women-glass-ceiling': ({ cls }) => (
    <svg viewBox="0 0 40 40" fill="none" className={cls}>
      {/* Building floors + glass line */}
      <rect x="6" y="30" width="28" height="6" rx="1" fill="currentColor" opacity="0.15" stroke="currentColor" strokeWidth="1.2"/>
      <rect x="8" y="22" width="24" height="6" rx="1" fill="currentColor" opacity="0.15" stroke="currentColor" strokeWidth="1.2"/>
      <rect x="10" y="14" width="20" height="6" rx="1" fill="currentColor" opacity="0.15" stroke="currentColor" strokeWidth="1.2"/>
      {/* Glass ceiling line */}
      <line x1="4" y1="12" x2="36" y2="12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" opacity="0.9"/>
      <text x="20" y="11" textAnchor="middle" fontSize="5" fill="currentColor" opacity="0.5">GLASS</text>
      {/* Arrow hitting ceiling */}
      <path d="M20 32 L20 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M16 17 L20 13 L24 17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  'women-gender-pay-gap': ({ cls }) => (
    <svg viewBox="0 0 40 40" fill="none" className={cls}>
      {/* Two coin stacks — taller (man) and shorter (woman) */}
      {/* Taller stack — man */}
      <ellipse cx="28" cy="28" rx="7" ry="2.5" fill="currentColor" opacity="0.3"/>
      <rect x="21" y="10" width="14" height="18" rx="0" fill="currentColor" opacity="0.12"/>
      <ellipse cx="28" cy="10" rx="7" ry="2.5" fill="currentColor" opacity="0.5"/>
      <ellipse cx="28" cy="15" rx="7" ry="2.5" fill="currentColor" opacity="0.4"/>
      <ellipse cx="28" cy="20" rx="7" ry="2.5" fill="currentColor" opacity="0.5"/>
      <ellipse cx="28" cy="25" rx="7" ry="2.5" fill="currentColor" opacity="0.6"/>
      {/* Shorter stack — woman */}
      <ellipse cx="12" cy="28" rx="6" ry="2.2" fill="currentColor" opacity="0.3"/>
      <rect x="6" y="20" width="12" height="8" rx="0" fill="currentColor" opacity="0.12"/>
      <ellipse cx="12" cy="20" rx="6" ry="2.2" fill="currentColor" opacity="0.45"/>
      <ellipse cx="12" cy="24" rx="6" ry="2.2" fill="currentColor" opacity="0.55"/>
      {/* Gap arrow */}
      <path d="M18 16 L22 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="2 1"/>
      <text x="7" y="38" fontSize="7" fill="currentColor" fontWeight="bold" opacity="0.7">₹76</text>
      <text x="23" y="38" fontSize="7" fill="currentColor" fontWeight="bold" opacity="0.7">₹100</text>
    </svg>
  ),
  'women-safety-economy': ({ cls }) => (
    <svg viewBox="0 0 40 40" fill="none" className={cls}>
      {/* Shield */}
      <path d="M20 4 L34 9 L34 22 Q34 32 20 38 Q6 32 6 22 L6 9 Z"
        stroke="currentColor" strokeWidth="1.8" fill="none"/>
      {/* Person inside shield */}
      <circle cx="20" cy="16" r="4" stroke="currentColor" strokeWidth="1.4"/>
      <path d="M15 28 Q20 24 25 28" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
      {/* Checkmark */}
      <path d="M14 21 L18 25 L26 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.6"/>
    </svg>
  ),
  'women-education-gap': ({ cls }) => (
    <svg viewBox="0 0 40 40" fill="none" className={cls}>
      {/* Graduation cap */}
      <path d="M8 16 L20 10 L32 16 L20 22 Z" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinejoin="round"/>
      <path d="M28 19 L28 28 Q20 33 12 28 L12 19" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="32" y1="16" x2="32" y2="25" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <circle cx="32" cy="27" r="2" fill="currentColor" opacity="0.7"/>
      {/* Broken pipeline arrow */}
      <path d="M6 36 L16 36" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <path d="M22 36 L34 36" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      {/* Gap */}
      <path d="M18 33 L18 39" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.5"/>
      <path d="M14 36 L18 33" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.5"/>
      <path d="M14 36 L18 39" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.5"/>
    </svg>
  ),
  'women-health-india': ({ cls }) => (
    <svg viewBox="0 0 40 40" fill="none" className={cls}>
      {/* Woman silhouette */}
      <circle cx="20" cy="10" r="5.5" stroke="currentColor" strokeWidth="1.6"/>
      <path d="M13 22 Q20 18 27 22 L29 35 L11 35Z" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinejoin="round"/>
      {/* Heart with pulse line */}
      <path d="M8 28 Q8 24 12 24 Q16 24 16 28 Q16 24 20 24 Q24 24 24 28 Q24 32 20 36 L16 40 L12 36 Q8 32 8 28Z"
        stroke="currentColor" strokeWidth="1.4" fill="none" opacity="0.7"/>
      {/* Pulse line */}
      <path d="M28 30 L30 26 L32 34 L34 28 L36 30 L38 30" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.6"/>
    </svg>
  ),
};

// ── Card colour themes — each card gets unique accent ─────────────────────
const CARD_THEMES = {
  'women-workforce-paradox':    { accent: '#0891b2', bg: '#ecfeff', border: '#a5f3fc', text: '#0e7490' }, // cyan
  'women-proxy-representation': { accent: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe', text: '#5b21b6' }, // purple
  'women-glass-ceiling':        { accent: '#ea580c', bg: '#fff7ed', border: '#fed7aa', text: '#c2410c' }, // orange
  'women-gender-pay-gap':       { accent: '#dc2626', bg: '#fef2f2', border: '#fecaca', text: '#b91c1c' }, // red
  'women-safety-economy':       { accent: '#d97706', bg: '#fffbeb', border: '#fde68a', text: '#b45309' }, // amber
  'women-education-gap':        { accent: '#059669', bg: '#ecfdf5', border: '#a7f3d0', text: '#047857' }, // emerald
  'women-health-india':         { accent: '#db2777', bg: '#fdf2f8', border: '#fbcfe8', text: '#be185d' }, // pink
};

const SERIES = [
  { slug: 'women-workforce-paradox',    n: 1, title: 'The Workforce Paradox',        category: 'Economic',       stat: '41.7%', statLabel: 'FLFPR 2023-24',                    summary: 'India grows richer — women work less. The FLFPR paradox, pink collarization, and the care economy trap.' },
  { slug: 'women-proxy-representation', n: 2, title: 'Power Without Authority',      category: 'Polity',         stat: '46.6%', statLabel: 'Panchayat seats held by women',    summary: "She won the election. He runs the village. Sarpanch Pati — democracy's most stubborn loophole." },
  { slug: 'women-glass-ceiling',        n: 3, title: 'The Invisible Ceiling',        category: 'Economic',       stat: '17%',   statLabel: 'Women in C-suite',                 summary: 'Women hold 33% of entry-level roles. Only 17% reach the C-suite. Glass ceiling, broken rung, glass cliff.' },
  { slug: 'women-gender-pay-gap',       n: 4, title: 'The Pay Gap Nobody Talks About', category: 'Economic',    stat: '₹76',   statLabel: 'Per ₹100 earned by men',           summary: 'For every ₹100 a man earns, a woman earns ₹76 in urban India. And it widens as women rise.' },
  { slug: 'women-safety-economy',       n: 5, title: 'Safety Is an Economic Problem', category: 'Socio-Cultural', stat: '31%', statLabel: 'Women cite commuting as barrier',  summary: "An unsafe city doesn't just endanger women — it locks them out of the economy." },
  { slug: 'women-education-gap',        n: 6, title: "Education's Broken Promise",  category: 'Socio-Cultural', stat: '43%',   statLabel: 'STEM graduates who are women',     summary: 'Girls enrol. Girls top exams. Then they disappear. The pipeline from school to career — and where it breaks.' },
  { slug: 'women-health-india',         n: 7, title: 'The Health Silence',           category: 'Socio-Cultural', stat: '63M',   statLabel: "Missing women — Amartya Sen",     summary: 'India is missing 63 million women. Maternal mortality, anaemia, malnutrition — four crises in plain sight.' },
];

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
    function onFocus() { setRead(getRead()); }
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, []);

  function handleRead(slug) {
    markRead(slug); setRead(getRead());
    navigate(`/read/${slug}`);
  }

  const doneCount = SERIES.filter(c => read.has(c.slug)).length;
  const nextCard  = SERIES.find(c => !read.has(c.slug));

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── Hero header with woman illustration ── */}
      <div className="bg-brand-600 relative overflow-hidden">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-6 pb-10 relative z-10">
          <Link to="/current-affairs"
            className="inline-flex items-center gap-1.5 text-brand-100 hover:text-white text-sm font-medium mb-6 transition-colors">
            <ChevronLeft className="w-4 h-4" /> News Cards
          </Link>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            {/* Left: text */}
            <div className="flex-1">
              {/* Series badge */}
              <div className="inline-flex items-center gap-2 bg-white/15 border border-white/25 text-white text-[10px] font-bold px-3 py-1 rounded-full mb-4 uppercase tracking-widest">
                <svg viewBox="0 0 34 24" fill="none" className="w-5 h-3.5 shrink-0">
                  <rect x="1" y="5" width="20" height="14" rx="2.5" fill="rgba(255,255,255,0.3)" transform="rotate(-11 11 12)" />
                  <rect x="5" y="3" width="20" height="14" rx="2.5" fill="rgba(255,255,255,0.5)" transform="rotate(-5 15 10)" />
                  <rect x="10" y="2" width="20" height="14" rx="2.5" fill="white" stroke="rgba(255,255,255,0.3)" strokeWidth="1"/>
                  <line x1="13.5" y1="8"    x2="27" y2="8"    stroke="#1e3a5f" strokeWidth="1.6" strokeLinecap="round"/>
                  <line x1="13.5" y1="11.5" x2="25" y2="11.5" stroke="#c7d2fe" strokeWidth="1.3" strokeLinecap="round"/>
                </svg>
                Society · 7-Card Series
              </div>

              <h1 className="text-2xl sm:text-3xl font-bold text-white leading-snug mb-2">
                Major Issues Faced<br className="sm:hidden"/> by Women in India
              </h1>
              <p className="text-brand-100 text-sm mb-6">
                GD · Lecturette · PI · Economic Survey 2025-26
              </p>

              {/* Progress */}
              <div className="max-w-xs">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-semibold text-brand-100">Your progress</span>
                  <span className="text-xs font-bold text-white">{doneCount} / {SERIES.length}</span>
                </div>
                <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                  <div className="h-full bg-white rounded-full transition-all duration-700"
                    style={{ width: `${(doneCount / SERIES.length) * 100}%` }} />
                </div>
                {doneCount === SERIES.length ? (
                  <p className="text-xs text-emerald-300 font-semibold mt-2 flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5" /> Series complete — you're GD-ready on all 7 topics
                  </p>
                ) : (
                  <p className="text-xs text-brand-200 mt-2">{SERIES.length - doneCount} card{SERIES.length - doneCount > 1 ? 's' : ''} remaining</p>
                )}
              </div>

              {/* CTA */}
              {nextCard && (
                <button
                  onClick={() => handleRead(nextCard.slug)}
                  className="mt-5 inline-flex items-center gap-2 bg-white text-brand-700 font-bold text-sm px-5 py-2.5 rounded-xl hover:bg-brand-50 transition-colors cursor-pointer">
                  <BookOpen className="w-4 h-4" />
                  {doneCount === 0 ? 'Start with Card 1' : `Continue — Card ${nextCard.n}`}
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Right: woman illustration */}
            <div className="hidden sm:block shrink-0 w-[340px] opacity-90">
              <WomanIllustration />
            </div>
          </div>
        </div>

        {/* Decorative pattern overlay */}
        <div className="absolute inset-0 opacity-5 pointer-events-none"
          style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
      </div>

      {/* ── 7 Cards grid ── */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">

        {/* Section label */}
        <div className="flex items-center gap-3 mb-6">
          <div className="h-px flex-1 bg-gray-200" />
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">7 Topics · Swipe Cards</span>
          <div className="h-px flex-1 bg-gray-200" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {SERIES.map((card) => {
            const done   = read.has(card.slug);
            const theme  = CARD_THEMES[card.slug] || {};
            const Icon   = CARD_ICONS[card.slug];
            return (
              <button
                key={card.slug}
                onClick={() => handleRead(card.slug)}
                className="text-left bg-white rounded-2xl border overflow-hidden hover:shadow-lg transition-all duration-200 group cursor-pointer"
                style={{ borderColor: done ? '#6ee7b7' : '#e5e7eb' }}
              >
                {/* Coloured top bar — unique per card */}
                <div className="h-1 w-full" style={{ background: theme.accent }} />

                <div className="p-4 flex flex-col gap-3">
                  {/* Icon + number row */}
                  <div className="flex items-start justify-between">
                    {/* Card icon — unique SVG */}
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: theme.bg, border: `1px solid ${theme.border}` }}>
                      {Icon && <Icon cls="w-6 h-6" style={{ color: theme.accent }} />}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[9px] font-bold text-gray-300 uppercase tracking-widest">{card.n} / 7</span>
                      {done && <CheckCircle className="w-4 h-4 text-emerald-500" />}
                    </div>
                  </div>

                  {/* Stat */}
                  <div>
                    <p className="text-2xl font-extrabold leading-none tracking-tight" style={{ color: theme.accent }}>{card.stat}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5 leading-tight">{card.statLabel}</p>
                  </div>

                  {/* Title + summary */}
                  <div>
                    <h3 className="text-sm font-bold text-gray-900 leading-snug mb-1">{card.title}</h3>
                    <p className="text-[11px] text-gray-500 leading-relaxed line-clamp-2">{card.summary}</p>
                  </div>

                  {/* Category chip */}
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-widest"
                      style={{ background: theme.bg, color: theme.text, border: `1px solid ${theme.border}` }}>
                      {card.category}
                    </span>
                    <span className="text-[11px] font-bold transition-opacity opacity-0 group-hover:opacity-100 flex items-center gap-0.5"
                      style={{ color: theme.accent }}>
                      {done ? 'Read again' : 'Read card'} <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Series complete state */}
        {doneCount === SERIES.length && (
          <div className="mt-8 text-center bg-brand-50 border border-brand-100 rounded-2xl py-8 px-4">
            <CheckCircle className="w-8 h-8 text-brand-600 mx-auto mb-3" />
            <h3 className="text-base font-bold text-brand-900 mb-1">Series complete!</h3>
            <p className="text-sm text-brand-700 mb-4">You've covered all 7 women's issues. Walk into any GD or Lecturette ready to speak.</p>
            <Link to="/?tab=live" className="inline-flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm px-5 py-2.5 rounded-xl transition-colors">
              Find a GD room to practice <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
