import { useEffect, useRef, useState, lazy, Suspense } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { getActiveRooms, closeRoom, getSessions, toggleInterest, cancelSession, startSession, getFeatured, getPastSessions, getArticles } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { MENTORS } from '../data/mentors';
import { articleHref } from '../data/swipeArticles';
import DailyMeetsNote from './DailyMeetsNote';
import SsbCountdown from './SsbCountdown';
import CommunityHighlights from './CommunityHighlights';
import SiteNav from './SiteNav';
import { trackEvent } from '../analytics';
import { PrepPath, SsbStages } from './HomePrep';
import { ExamTicker } from './ExamCalendar';
import HomeRail from './HomeRail';
import { HOME_FAQ } from '../data/homeFaq';
import { Mic, Timer, FileText, CheckSquare, Radio, ArrowRight, Trash2, Zap, Lightbulb, Users, Presentation, Target, Headphones, RefreshCw, X, Calendar, Heart, PlayCircle, Share2, Check, Sparkles, ChevronDown, Shield, Star, Lock, BookOpen, Video, Award, ChevronRight, GraduationCap, ExternalLink, AlertTriangle, HeartHandshake, PenLine, Footprints, Signpost } from 'lucide-react';
import Hello, { firstName } from './Hello';
import { NEWS_SECTIONS } from '../data/newsSections';
import { todayIST, daysBetween } from './prep/dates';


const HERO_CARDS = [
  {
    slug:     null,
    category: null,
    stat:     '+ more',
    title:    'More cards coming',
    hint:     'Defence · Polity · Socio-Cultural',
    rotate:   -13,
    x:        -62,
    y:        22,
    ghost:    true,
  },
  {
    slug:     'super-el-nino',
    category: 'Geographic',
    stat:     '+2°C',
    title:    'Super El Niño',
    hint:     "India's monsoon & 600M farmers at risk",
    rotate:   -4,
    x:        -14,
    y:        4,
  },
  {
    slug:     'rupee-depreciation',
    category: 'Economic',
    stat:     '₹90',
    title:    'The Rupee Story',
    hint:     'Why the rupee falls — and why that\'s not always bad',
    rotate:   7,
    x:        38,
    y:        -14,
  },
];

function SpreadNewsCards({ small = false }) {
  const navigate = useNavigate();
  const [hovered, setHovered] = useState(null);
  const W = small ? 140 : 176;
  const cW = small ? 220 : 300;
  const cH = small ? 240 : 320;

  return (
    <div className="flex flex-col items-center gap-3 select-none">
      {/* Card spread */}
      <div className="relative" style={{ width: cW, height: cH }}>
        {HERO_CARDS.map((card, i) => {
          const isHov = hovered === i && !card.ghost;
          return (
            /* Float wrapper — bobs via CSS class in index.css */
            <div
              key={i}
              className={!isHov && !card.ghost ? 'hero-card-float' : ''}
              style={{
                position: 'absolute', top: '50%', left: '50%',
                width: W, zIndex: isHov ? 10 : i + 1,
                '--float-duration': `${2.6 + i * 0.55}s`,
                '--float-delay':    `${i * 0.55}s`,
              }}
            >
            <div
              onClick={() => !card.ghost && navigate(`/read/${card.slug}`)}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
              className={card.ghost ? '' : 'cursor-pointer'}
              style={{
                transform:  isHov
                  ? `translate(calc(-50% + ${card.x}px), calc(-50% + ${card.y - 14}px)) rotate(0deg) scale(1.06)`
                  : `translate(calc(-50% + ${card.x}px), calc(-50% + ${card.y}px)) rotate(${card.rotate}deg)`,
                transition: 'transform 0.22s cubic-bezier(0.34,1.4,0.64,1), box-shadow 0.2s ease',
              }}
            >
              <div
                className={`rounded-2xl overflow-hidden ${card.ghost ? 'border-2 border-dashed border-gray-200 bg-white/60' : 'border border-gray-200 bg-white'}`}
                style={{
                  boxShadow: isHov
                    ? '0 28px 56px rgba(30,58,95,0.2), 0 4px 12px rgba(30,58,95,0.08)'
                    : '0 4px 18px rgba(0,0,0,0.09)',
                }}
              >
                {!card.ghost && <div className="h-0.5 bg-brand-600" />}
                <div className={`p-4 ${card.ghost ? 'opacity-35' : ''}`}>
                  {/* Header row */}
                  <div className="flex items-center justify-between mb-3">
                    {card.category ? (
                      <span className="text-[8px] font-bold text-brand-600 bg-brand-50 px-2 py-0.5 rounded-full border border-brand-100 uppercase tracking-widest">
                        {card.category}
                      </span>
                    ) : (
                      <span className="text-[8px] font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full uppercase tracking-widest">
                        Coming soon
                      </span>
                    )}
                    {/* Mini SSBCircle logo */}
                    <svg viewBox="0 0 48 48" fill="none" className="w-3.5 h-3.5 opacity-25 shrink-0">
                      <circle cx="24" cy="24" r="22" stroke="#1e3a5f" strokeWidth="3" />
                      <circle cx="14" cy="20" r="3.5" fill="#1e3a5f" />
                      <circle cx="24" cy="14" r="3.5" fill="#1e3a5f" />
                      <circle cx="34" cy="20" r="3.5" fill="#1e3a5f" />
                      <circle cx="30" cy="31" r="3.5" fill="#1e3a5f" />
                      <circle cx="18" cy="31" r="3.5" fill="#1e3a5f" />
                      <path d="M14 20 L24 14 L34 20 L30 31 L18 31 Z" stroke="#1e3a5f" strokeWidth="1.5" fill="none" />
                    </svg>
                  </div>

                  {/* Big stat */}
                  <p className={`font-extrabold leading-none mb-2 ${card.ghost ? 'text-xl text-gray-300' : 'text-[2rem] text-gray-900 tracking-tight'}`}>
                    {card.stat}
                  </p>
                  <p className="text-xs font-bold text-gray-800 leading-snug mb-1.5">{card.title}</p>
                  <p className="text-[11px] text-gray-400 leading-relaxed">{card.hint}</p>

                  {/* Read CTA — fades in on hover */}
                  {!card.ghost && (
                    <div className={`mt-3 pt-2.5 border-t border-gray-100 flex items-center gap-1 text-[11px] font-bold text-brand-600 transition-opacity duration-200 ${isHov ? 'opacity-100' : 'opacity-0'}`}>
                      Read card
                      <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  )}
                </div>
              </div>
            </div>
            </div>
          );
        })}
      </div>

      {/* Caption */}
      <p className="text-[12px] text-gray-400 font-medium text-center">
        Click any card to read · <Link to="/current-affairs" className="text-brand-600 hover:underline font-semibold">Browse all News Cards</Link>
      </p>
    </div>
  );
}

const CATEGORIES = ['All', 'GD', 'PPDT', 'Lecturette', 'IO Practice'];
const GD_SUBCATEGORIES = ['Defence', 'International Relations', 'Society', 'Economy', 'Science & Tech', 'Environment', 'Sports & Awards'];
// Below the first screen and it carries the whole Prep Sheet's data (~20 KB
// gzipped), so it loads after the page instead of with it.
const HomePrepSheet = lazy(() => import('./HomePrepSheet'));

// The home page is long; HomeRail shows where you are on it. Page order.
const HOME_SECTIONS = [
  { id: 'top',       label: 'Start' },
  { id: 'stages',    label: 'SSB stages' },
  { id: 'prep',      label: 'Prep Sheet' },
  { id: 'news',      label: 'News cards' },
  { id: 'rooms',     label: 'Live rooms' },
  { id: 'community', label: 'Community' },
  { id: 'mentors',   label: 'Mentors' },
  { id: 'faq',       label: 'FAQ' },
];

// Three rooms is a screenful on a phone and one tidy row on a desktop
const PAGE_SIZE = 3;
const pageSize = PAGE_SIZE;

// Shown until enough real users are active on the platform
const MOCK_ASPIRANTS = [
  { id: 'm1', display_name: 'Arjun Singh',   avatar_url: null, rooms_hosted: 12, color: 'bg-blue-600'    },
  { id: 'm2', display_name: 'Priya Sharma',  avatar_url: null, rooms_hosted: 9,  color: 'bg-emerald-600' },
  { id: 'm3', display_name: 'Rahul Verma',   avatar_url: null, rooms_hosted: 8,  color: 'bg-purple-600'  },
  { id: 'm4', display_name: 'Sneha Reddy',   avatar_url: null, rooms_hosted: 7,  color: 'bg-rose-600'    },
  { id: 'm5', display_name: 'Vikram Nair',   avatar_url: null, rooms_hosted: 6,  color: 'bg-teal-600'    },
  { id: 'm6', display_name: 'Anjali Gupta',  avatar_url: null, rooms_hosted: 5,  color: 'bg-amber-600'   },
  { id: 'm7', display_name: 'Rohan Patel',   avatar_url: null, rooms_hosted: 4,  color: 'bg-orange-500'  },
  { id: 'm8', display_name: 'Kavya Menon',   avatar_url: null, rooms_hosted: 3,  color: 'bg-brand-600'   },
];
const AVATAR_COLORS = ['bg-blue-600','bg-emerald-600','bg-purple-600','bg-rose-600','bg-teal-600','bg-amber-600','bg-orange-500','bg-brand-600'];

const CATEGORY_COLORS = {
  'GD':          'bg-blue-50 text-blue-700 border-blue-100',
  'PPDT':        'bg-purple-50 text-purple-700 border-purple-100',
  'Lecturette':  'bg-orange-50 text-orange-700 border-orange-100',
  'IO Practice': 'bg-emerald-50 text-emerald-700 border-emerald-100',
};


// ── Latest Reads — real articles pulled from the API ────────────────────────
const PILLAR_LABELS = Object.fromEntries(NEWS_SECTIONS.map(s => [s.id, s.label]));

// Published within the last 10 days counts as new
function isFresh(dateStr) {
  if (!dateStr) return false;
  return (Date.now() - new Date(dateStr).getTime()) < 10 * 24 * 60 * 60 * 1000;
}

// Readers only shown once the number helps rather than hurts
function readersLabel(n) {
  return n >= 20 ? `${n.toLocaleString('en-IN')} aspirants read this` : null;
}

function PillarTag({ category, light = false }) {
  return (
    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border truncate ${light
      ? 'bg-white/15 text-white border-white/25'
      : 'bg-brand-50 text-brand-600 border-brand-100'}`}>
      {PILLAR_LABELS[category] || category}
    </span>
  );
}

function NewTag({ light = false }) {
  return (
    <span className={`text-[10.5px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wide shrink-0 border ${light
      ? 'bg-emerald-500 text-white border-emerald-400'
      : 'text-emerald-700 bg-emerald-50 border-emerald-200'}`}>
      New
    </span>
  );
}

// The newest card — big, with its photo when the article has one
function FeaturedRead({ a }) {
  const fresh   = isFresh(a.published_at);
  const readers = readersLabel(a.readers);
  return (
    <Link to={articleHref(a.slug || a.id)}
      className="group relative rounded-2xl overflow-hidden flex flex-col justify-end h-full min-h-[300px] sm:min-h-[340px] bg-brand-600 shadow-sm hover:shadow-xl transition-shadow">
      {a.cover_image ? (
        <img src={a.cover_image} alt="" loading="eager"
          className="absolute inset-0 w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500" />
      ) : (
        <div className="absolute inset-0 opacity-10 pointer-events-none"
          style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.9) 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
      )}
      {/* Keeps the text readable on any photo */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/45 to-black/5" />

      <div className="relative p-5 sm:p-6 flex flex-col gap-2.5">
        <div className="flex items-center gap-2">
          <PillarTag category={a.category} light />
          {fresh && <NewTag light />}
        </div>
        <h3 className="text-lg sm:text-2xl font-bold text-white leading-snug">{a.title}</h3>
        <p className="text-xs sm:text-sm text-white/80 leading-relaxed line-clamp-2">{a.summary}</p>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 mt-1">
          <span className="inline-flex items-center gap-1.5 bg-white text-brand-700 font-bold text-xs px-4 py-2 rounded-xl group-hover:bg-brand-50 transition-colors">
            Read now <ArrowRight className="w-3.5 h-3.5" />
          </span>
          <span className="text-[12px] text-white/70">{a.reading_time || 'Quick read'}</span>
          {readers && <span className="text-[12px] text-white/70">· {readers}</span>}
        </div>
      </div>
    </Link>
  );
}

function CompactRead({ a }) {
  const fresh = isFresh(a.published_at);
  return (
    <Link to={articleHref(a.slug || a.id)}
      className="group shrink-0 w-[78%] sm:w-auto lg:flex-1 snap-start bg-white border border-gray-200 rounded-xl overflow-hidden flex hover:border-brand-600/30 hover:shadow-md transition-all">
      {a.cover_image && (
        <img src={a.cover_image} alt="" loading="lazy" className="w-20 sm:w-24 object-cover shrink-0" />
      )}
      <div className="p-3.5 flex flex-col gap-1.5 flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <PillarTag category={a.category} />
          {fresh && <NewTag />}
        </div>
        <h3 className="text-sm font-semibold text-gray-800 leading-snug line-clamp-2 group-hover:text-brand-600 transition-colors">
          {a.title}
        </h3>
        <div className="flex items-center justify-between gap-2 mt-auto">
          <span className="text-[11px] text-gray-400">{a.reading_time || 'Quick read'}</span>
          <span className="flex items-center gap-0.5 text-[12px] font-semibold text-brand-600 shrink-0">
            Read <ChevronRight className="w-3 h-3" />
          </span>
        </div>
      </div>
    </Link>
  );
}

function LatestReadsSection({ articles, loading }) {
  // Nothing to show and nothing loading — don't render an empty shell
  if (!loading && articles.length === 0) return null;

  const [featured, ...rest] = articles;
  const hasNew = articles.some(a => isFresh(a.published_at));

  return (
    <section className="bg-gray-50 border-b border-gray-100 px-4 sm:px-6 py-8 sm:py-12">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="flex items-end justify-between gap-4 mb-5">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <BookOpen className="w-4 h-4 text-brand-600 shrink-0" />
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Read before your GD and interview</h2>
              {hasNew && (
                <span className="flex items-center gap-1 text-[10.5px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full uppercase tracking-widest">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" /> New
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm text-gray-500">
              Current affairs made simple for GD, Lecturette and PI. 2–5 minutes each.
            </p>
          </div>
          <Link to="/current-affairs"
            className="hidden sm:flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-700 shrink-0 whitespace-nowrap">
            All news cards <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
            <div className="lg:col-span-3 min-h-[300px] sm:min-h-[340px] bg-white border border-gray-100 rounded-2xl animate-pulse" />
            <div className="lg:col-span-2 hidden lg:flex flex-col gap-3">
              {[1, 2, 3, 4].map(i => <div key={i} className="flex-1 bg-white border border-gray-100 rounded-xl animate-pulse" />)}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
            <div className="lg:col-span-3"><FeaturedRead a={featured} /></div>

            {rest.length > 0 && (
              /* Phone: swipe sideways. Tablet: 2-up grid. Desktop: a list beside the featured card */
              <div className="lg:col-span-2 -mx-4 px-4 sm:mx-0 sm:px-0 flex sm:grid sm:grid-cols-2 lg:flex lg:flex-col gap-3 overflow-x-auto sm:overflow-visible snap-x snap-mandatory pb-1 sm:pb-0">
                {rest.map(a => <CompactRead key={a.id} a={a} />)}
              </div>
            )}
          </div>
        )}

        <Link to="/current-affairs"
          className="sm:hidden mt-4 flex items-center justify-center gap-1 text-xs font-semibold text-brand-600 py-2">
          See all news cards <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </section>
  );
}

function Logo() {
  return (
    <div className="flex items-center gap-2">
      <svg viewBox="0 0 48 48" fill="none" className="w-7 h-7 shrink-0">
        <circle cx="24" cy="24" r="22" stroke="#1e3a5f" strokeWidth="3" />
        <circle cx="14" cy="20" r="3.5" fill="#1e3a5f" />
        <circle cx="24" cy="14" r="3.5" fill="#1e3a5f" />
        <circle cx="34" cy="20" r="3.5" fill="#1e3a5f" />
        <circle cx="30" cy="31" r="3.5" fill="#1e3a5f" />
        <circle cx="18" cy="31" r="3.5" fill="#1e3a5f" />
        <path d="M14 20 L24 14 L34 20 L30 31 L18 31 Z" stroke="#1e3a5f" strokeWidth="1.5" fill="none" />
      </svg>
      <span className="font-bold text-gray-900 text-[15px] tracking-tight">SSBCircle</span>
    </div>
  );
}

function Avatar({ name, avatarUrl }) {
  const initials = name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?';
  const [broken, setBroken] = useState(false);
  if (avatarUrl && !broken) return <img src={avatarUrl} referrerPolicy="no-referrer" onError={() => setBroken(true)} alt={name} className="w-7 h-7 rounded-full object-cover" />;
  return (
    <div className="w-7 h-7 rounded-full bg-brand-600 flex items-center justify-center text-[11px] font-bold text-white shrink-0">
      {initials}
    </div>
  );
}

async function share({ title, text, url }) {
  if (navigator.share) {
    try {
      await navigator.share({ title, text, url });
      return true;
    } catch (err) {
      if (err?.name === 'AbortError') return false; // user dismissed — don't copy
    }
  }
  try { await navigator.clipboard.writeText(url); return 'copied'; } catch {}
  return false;
}

function ShareButton({ title, text, url }) {
  const [done, setDone] = useState(false);
  async function handleShare() {
    const result = await share({ title, text, url });
    if (result === true || result === 'copied') {
      setDone(result);
      setTimeout(() => setDone(false), 2000);
    }
  }
  const label = done === 'copied' ? 'Link copied!' : done ? 'Shared!' : 'Share';
  return (
    <button onClick={handleShare}
      className="p-1.5 rounded-lg text-gray-300 hover:text-brand-600 hover:bg-brand-50 transition-colors cursor-pointer"
      title={label}>
      {done ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Share2 className="w-3.5 h-3.5" />}
    </button>
  );
}

function timeAgo(dateStr) {
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

// ── Mentor credential card ────────────────────────────────────────────────────
// Split layout: navy left panel (identity) + white right panel (content).
// Clicking anywhere navigates to the full /mentor/:slug page.

function MentorCard({ mentor }) {
  const navigate = useNavigate();
  return (
    <div
      onClick={() => navigate(`/mentor/${mentor.slug}`)}
      className="flex rounded-2xl overflow-hidden border border-gray-200 hover:border-brand-600/25 hover:shadow-lg transition-all duration-200 cursor-pointer group"
    >
      {/* ── Left panel — navy credential strip ── */}
      <div className="relative w-[96px] sm:w-[108px] shrink-0 bg-gradient-to-b from-brand-600 to-brand-700 flex flex-col items-center justify-center gap-3 py-6 overflow-hidden">
        {/* Subtle dot texture */}
        <div className="absolute inset-0 opacity-[0.07] pointer-events-none"
          style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '12px 12px' }} />

        {/* Avatar */}
        {mentor.photo ? (
          <img src={mentor.photoAvatar || mentor.photo} alt={mentor.name}
            width="56" height="56" loading="lazy" decoding="async"
            className="relative z-10 w-14 h-14 rounded-full object-cover border-2 border-white/30 group-hover:border-white/50 transition-all" />
        ) : (
          <div className="relative z-10 w-14 h-14 rounded-full bg-white/15 border-2 border-white/30 flex items-center justify-center text-white text-xl font-bold select-none group-hover:border-white/50 transition-all">
            {mentor.avatarInitials}
          </div>
        )}

        {/* Branch label */}
        <div className="relative z-10 text-center">
          <p className="text-[10.5px] font-bold text-white/90 tracking-widest uppercase leading-tight">
            {mentor.branch.replace('Indian ', '')}
          </p>
        </div>

        {/* Active indicator */}
        {mentor.isActive && (
          <div className="relative z-10 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[10.5px] text-emerald-300 font-semibold">Active</span>
          </div>
        )}
      </div>

      {/* ── Right panel — white content ── */}
      <div className="flex-1 min-w-0 bg-white p-4 sm:p-5 flex flex-col gap-2.5">

        {/* Name + verified badge */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="text-sm sm:text-base font-bold text-gray-900 leading-snug group-hover:text-brand-600 transition-colors">
              {mentor.name}
            </h3>
            <p className="text-[12px] text-gray-400 mt-0.5">{mentor.rank}</p>
          </div>
          <span className="shrink-0 flex items-center gap-1 text-[10.5px] font-bold text-sky-700 bg-sky-50 border border-sky-100 px-2 py-1 rounded-lg">
            <Shield className="w-2.5 h-2.5" /> Verified
          </span>
        </div>

        {/* Bio */}
        <p className="text-xs text-gray-400 leading-relaxed line-clamp-2 flex-1">{mentor.bio}</p>

        {/* Specialty chips */}
        <div className="flex flex-wrap gap-1">
          {mentor.specialties.slice(0, 3).map(tag => (
            <span key={tag} className="text-[10.5px] font-semibold text-brand-600 bg-brand-50 px-2 py-0.5 rounded-full border border-brand-100">
              {tag}
            </span>
          ))}
        </div>

        {/* Footer: talk to them, or read more */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-gray-100 mt-auto">
          <span className="flex items-center gap-1 text-[11px] text-gray-400">
            <Award className="w-3 h-3 text-sky-300" /> {mentor.yearsOfService} service
          </span>
          <span className="flex items-center gap-0.5 text-[12px] font-semibold text-brand-600 group-hover:gap-1 transition-all">
            View profile <ChevronRight className="w-3 h-3" />
          </span>
        </div>
      </div>
    </div>
  );
}

// Mentors are here for one thing: an aspirant who wants to hear from a real
// officer — about life in the forces, or for guidance on their own
// preparation — can reach one. Each card opens the mentor's profile, which is
// where they get in touch.
const MENTOR_TOPICS = ['Life in the forces', 'Which entry and branch suits you', 'Your PIQ and SSB prep'];

function MentorsSection() {
  return (
    <section className="border-t border-gray-100 bg-white py-10 sm:py-14 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto">

        <div className="mb-6">
          <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-brand-600 flex items-center gap-1.5"><Shield className="w-3.5 h-3.5" /> Verified officers</p>
          <h2 className="mt-1.5 text-xl sm:text-2xl font-bold text-gray-900">Talk to a real officer</h2>
          <p className="text-sm text-gray-600 mt-1 max-w-2xl leading-relaxed">
            Want to know what life in the forces is really like, or need guidance for your preparation?
            Open a mentor's profile to reach out — they reply personally. Slots are limited.
          </p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {MENTOR_TOPICS.map(t => (
              <span key={t} className="inline-flex items-center gap-1 text-xs font-medium text-gray-700 bg-gray-50 border border-gray-200 px-2.5 py-1 rounded-full">
                <Check className="w-3 h-3 text-emerald-600" /> {t}
              </span>
            ))}
          </div>
        </div>

        {/* 2-column grid — credential cards are wider than article cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
          {MENTORS.map(mentor => (
            <MentorCard key={mentor.id} mentor={mentor} />
          ))}

          {/* Placeholder card — same split layout, greyed out */}
          <div className="flex rounded-2xl overflow-hidden border-2 border-dashed border-gray-100">
            <div className="w-[96px] sm:w-[108px] shrink-0 bg-gray-50 flex flex-col items-center justify-center gap-2 py-6">
              <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                <Users className="w-4 h-4 text-gray-300" />
              </div>
              <p className="text-[8px] font-bold text-gray-300 uppercase tracking-widest text-center leading-tight">Soon</p>
            </div>
            <div className="flex-1 p-4 sm:p-5 flex flex-col justify-center gap-1">
              <p className="text-sm font-semibold text-gray-300 leading-snug">More mentors joining</p>
              <p className="text-xs text-gray-200 leading-relaxed">Army · Navy · Air Force<br />By invitation only</p>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}

// ── Ways to serve before the uniform ──────────────────────────────────────────
// Real, verified organizations — every link checked against its official site.

// Logos hotlinked via Commons' Special:FilePath (stable redirect to current file) —
// only for orgs with a verified CC/PD license. See credit line under the grid.
const COMMONS_FILE = name => `https://commons.wikimedia.org/wiki/Special:FilePath/${name}`;

const CONTRIBUTE_WAYS = [
  {
    icon:  GraduationCap,
    image: COMMONS_FILE('Emblem_of_National_Cadet_Corps_(India).png'),
    title: 'NCC',
    org:   'National Cadet Corps',
    desc:  "Uniformed, disciplined, closest to forces life. If you're still in school or college, this is day one of your journey.",
    link:  'https://indiancc.nic.in/how-to-join/',
  },
  {
    icon:  Shield,
    image: COMMONS_FILE('Territorial_Army_Crest.svg'),
    title: 'Territorial Army',
    org:   'Indian Army',
    desc:  'India\'s "citizen soldier" force — train and serve part-time alongside your studies or civilian career.',
    link:  'https://joinindianarmy.nic.in',
  },
  {
    icon:  Users,
    image: COMMONS_FILE('National_Service_Scheme_logo.svg'),
    title: 'NSS',
    org:   'National Service Scheme',
    desc:  'Campus-based community service — blood camps, literacy drives, disaster relief, right where you study.',
    link:  'https://nss.gov.in',
  },
  {
    icon:  AlertTriangle,
    image: '/civil-defence.png',
    title: 'Civil Defence',
    org:   'Ministry of Home Affairs',
    desc:  'Government-recognized volunteer force trained for disaster response and emergency support in your own city.',
    link:  'https://civildefencewarriors.gov.in/About_Civil_Defence.aspx',
  },
  {
    icon: Heart,
    title: 'NYKS',
    org:   'Nehru Yuva Kendra Sangathan',
    desc:  "India's largest grassroots youth network — literacy, health camps and disaster relief in your own district.",
    link:  'https://yas.nic.in/youth-affairs/nehru-yuva-kendra-sangathan',
  },
  {
    icon:  HeartHandshake,
    image: COMMONS_FILE('Goonj_logo.png'),
    title: 'NGO Volunteering',
    org:   'e.g. Goonj',
    desc:  'Teach, distribute relief material, or intern with NGOs — flexible, meaningful, and you can start today.',
    link:  'https://goonj.org/volunteer/',
  },
];

function ContributeCard({ way }) {
  const Icon = way.icon;
  // Falls back to the lucide icon if the Commons hotlink ever 404s
  const [imgFailed, setImgFailed] = useState(false);
  const showImage = way.image && !imgFailed;

  return (
    <a href={way.link} target="_blank" rel="noopener noreferrer" title={way.desc}
      className="group flex items-center gap-2.5 bg-white border border-gray-200 rounded-xl p-2.5 hover:border-brand-600/30 hover:shadow-sm transition-all">
      <span className="w-9 h-9 rounded-lg bg-brand-50 border border-brand-100 flex items-center justify-center overflow-hidden shrink-0">
        {showImage ? (
          <img src={way.image} alt="" loading="lazy" className="w-full h-full object-contain p-1" onError={() => setImgFailed(true)} />
        ) : (
          <Icon className="w-4 h-4 text-brand-600" />
        )}
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-bold text-gray-900 leading-tight">{way.title}</span>
        <span className="block text-[11px] text-gray-500 truncate">{way.org}</span>
      </span>
    </a>
  );
}

// Active aspirants — horizontal avatar strip, sits in the "who's here" zone
function ActiveAspirantsSection({ aspirants }) {
  const real      = aspirants.map((a, i) => ({ ...a, color: AVATAR_COLORS[i % AVATAR_COLORS.length] }));
  const displayed = real.length >= 4 ? real : [...real, ...MOCK_ASPIRANTS.slice(real.length)];

  return (
    <section className="border-t border-gray-100 bg-gray-50 py-10 sm:py-14 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-2 mb-1">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Active Aspirants</h2>
          <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full">On SSBCircle</span>
        </div>
        <p className="text-sm text-gray-400 mb-6">Students consistently practising and leading sessions on the platform.</p>
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide -mx-1 px-1">
          {displayed.map(a => {
            const initials = a.display_name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?';
            return (
              <div key={a.id} className="shrink-0 flex flex-col items-center gap-2 p-3 bg-white border border-gray-100 rounded-xl w-[72px] hover:border-brand-200 hover:shadow-sm transition-all">
                {a.avatar_url
                  ? <img src={a.avatar_url} referrerPolicy="no-referrer" alt={a.display_name} className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm" />
                  : <div className={`w-10 h-10 rounded-full ${a.color || 'bg-brand-600'} flex items-center justify-center text-xs font-bold text-white shadow-sm`}>{initials}</div>
                }
                <p className="text-[11px] font-semibold text-gray-700 text-center truncate w-full leading-tight">{a.display_name?.split(' ')[0]}</p>
                <p className="text-[10.5px] text-gray-400 tabular-nums">{a.rooms_hosted} {a.rooms_hosted === 1 ? 'room' : 'rooms'}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function ContributeSection() {
  return (
    <section className="bg-white px-4 sm:px-6 py-8 sm:py-10">
      <div className="max-w-5xl mx-auto">
        <p className="text-xs font-bold uppercase tracking-widest text-brand-600 flex items-center gap-2"><Sparkles className="w-3.5 h-3.5" /> Before the uniform</p>
        <h2 className="mt-1 text-lg sm:text-xl font-bold text-gray-900">Start serving now, whatever your result</h2>
        <p className="mt-1 text-sm text-gray-500 max-w-2xl">
          Each of these builds the same qualities the board looks for — initiative, cooperation, getting along with people.
        </p>
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {CONTRIBUTE_WAYS.map(way => <ContributeCard key={way.title} way={way} />)}
        </div>
        <p className="text-[11px] text-gray-300 mt-3">
          Emblems via Wikimedia Commons — NCC (Bharata-indstar) & Goonj (Cyyanide) logos under{' '}
          <a href="https://creativecommons.org/licenses/by-sa/4.0/" target="_blank" rel="noopener noreferrer" className="underline hover:text-gray-400">CC BY-SA 4.0</a>;
          {' '}Territorial Army crest & NSS logo are public domain. Civil Defence emblem is the official Ministry of Home Affairs / DGFSCDHG mark, shown for identification only — SSBCircle is not affiliated with or endorsed by the Government of India.
        </p>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

function RoomCard({ room, user, onJoin, onDelete }) {
  const [deleting, setDeleting] = useState(false);
  const isCreator = user && room.created_by === user.id;
  const colorClass = CATEGORY_COLORS[room.category] || 'bg-gray-100 text-gray-500 border-gray-200';
  const maxP = room.max_participants || 8;
  const count = room.participant_count ?? 0;
  const isFull = count >= maxP;

  async function handleDelete(e) {
    e.stopPropagation();
    if (!window.confirm('Close this room?')) return;
    setDeleting(true);
    try { await onDelete(room.room_code); }
    finally { setDeleting(false); }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:border-brand-600/30 hover:shadow-md transition-all duration-200 flex flex-col">
      <div className="h-0.5 bg-brand-600" />
      <div className="p-4 flex flex-col gap-3 flex-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="text-[12px] font-mono font-semibold text-gray-400 tracking-widest">{room.room_code}</span>
            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${isFull ? 'bg-red-50 text-red-500 border-red-200' : 'bg-gray-50 text-gray-500 border-gray-200'}`}>
              {isFull ? 'Full' : `${count}/${maxP}`}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[12px] text-gray-300 hidden sm:inline">{timeAgo(room.created_at)}</span>
            <ShareButton
              title={room.topic}
              text={`Join "${room.topic}" on SSBCircle — use code ${room.room_code}`}
              url={`${window.location.origin}/room/${room.room_code}`}
            />
            {isCreator && (
              <button onClick={handleDelete} disabled={deleting}
                className="p-1 text-gray-300 hover:text-red-500 transition-colors cursor-pointer disabled:opacity-40">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Category badges */}
        <div className="flex items-center gap-1.5">
          {room.category && (
            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${colorClass}`}>
              {room.category}
            </span>
          )}
          {room.subcategory && (
            <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-gray-50 text-gray-400 border border-gray-100">
              {room.subcategory}
            </span>
          )}
        </div>

        <div className="flex-1">
          <p className="text-sm font-semibold text-gray-800 leading-snug mb-1">
            {room.topic}
          </p>
          {room.description && (
            <p className="text-xs text-gray-400 leading-relaxed line-clamp-2">{room.description}</p>
          )}
        </div>

        {/* Participant avatars */}
        {room.participants?.length > 0 ? (
          <div className="flex items-center gap-2">
            <div className="flex -space-x-2">
              {room.participants.map((p, i) => (
                p.avatar_url
                  ? <img key={i} src={p.avatar_url} referrerPolicy="no-referrer" alt={p.name}
                      className="w-7 h-7 rounded-full border-2 border-white object-cover"
                      title={p.name} />
                  : <div key={i}
                      className="w-7 h-7 rounded-full bg-brand-600 border-2 border-white flex items-center justify-center text-[11px] font-bold text-white shrink-0"
                      title={p.name}>
                      {p.name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?'}
                    </div>
              ))}
            </div>
            <p className="text-xs text-gray-400 truncate">
              {isCreator
                ? <span className="text-brand-600 font-medium">You · Host</span>
                : <span className="font-medium text-gray-600">{room.admin_display_name}</span>}
              {count > 0 && <span className="text-gray-400"> · {count} in room</span>}
            </p>
          </div>
        ) : (
          room.admin_display_name && (
            <p className="text-xs text-gray-400">
              {isCreator
                ? <span className="text-brand-600 font-medium">You · Host</span>
                : <>by <span className="text-gray-600 font-medium">{room.admin_display_name}</span></>}
            </p>
          )
        )}

        <button
          onClick={() => !isFull && onJoin(room.room_code)}
          disabled={isFull}
          className={`w-full flex items-center justify-center gap-1.5 border text-xs font-semibold py-2.5 rounded-lg transition-colors ${isFull ? 'bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed' : 'bg-white hover:bg-brand-50 text-brand-600 border-brand-600 cursor-pointer'}`}
        >
          <Mic className="w-3.5 h-3.5" />
          {isFull ? 'Room Full' : user ? 'Join Room' : 'Sign in to Join'}
        </button>
      </div>
    </div>
  );
}

function Skeleton() {
  return (
    <div className="border border-gray-100 rounded-xl overflow-hidden animate-pulse">
      <div className="h-0.5 bg-gray-100" />
      <div className="p-4 space-y-3">
        <div className="h-3 bg-gray-100 rounded w-16" />
        <div className="h-4 bg-gray-100 rounded w-full" />
        <div className="h-4 bg-gray-100 rounded w-2/3" />
        <div className="h-9 bg-gray-100 rounded-lg" />
      </div>
    </div>
  );
}

function countdown(dateStr) {
  const diff = new Date(dateStr) - Date.now();
  if (diff <= 0) return 'Starting soon';
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  if (h > 0) return `in ${h}h ${m}m`;
  return `in ${m}m`;
}

function UpcomingTab({ sessions, loading, user, onRefresh, navigate, onInterest, onCancel, onStart }) {
  const COLORS = {
    'GD':          'bg-blue-50 text-blue-700 border-blue-100',
    'PPDT':        'bg-purple-50 text-purple-700 border-purple-100',
    'Lecturette':  'bg-orange-50 text-orange-700 border-orange-100',
    'IO Practice': 'bg-emerald-50 text-emerald-700 border-emerald-100',
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Upcoming Sessions</h2>
          <p className="text-xs sm:text-sm text-gray-400">Scheduled by aspirants — mark interest to stay reminded</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={onRefresh} className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 cursor-pointer font-medium px-2 py-1.5">
            <Radio className="w-3.5 h-3.5" /> Refresh
          </button>
          <button onClick={() => navigate('/create')} className="btn-primary text-xs py-2 px-4 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" /> Schedule
          </button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {[1,2,3].map(i => <div key={i} className="border border-gray-100 rounded-xl p-4 space-y-3 animate-pulse"><div className="h-3 bg-gray-100 rounded w-16"/><div className="h-4 bg-gray-100 rounded w-full"/><div className="h-9 bg-gray-100 rounded-lg"/></div>)}
        </div>
      ) : sessions.length === 0 ? (
        <div className="border border-dashed border-gray-200 rounded-xl py-12 text-center px-6">
          <div className="w-12 h-12 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center mx-auto mb-4">
            <Calendar className="w-5 h-5 text-gray-300" />
          </div>
          <p className="text-sm font-medium text-gray-700 mb-1">No upcoming sessions</p>
          <p className="text-xs text-gray-400 mb-5">Schedule one and invite your batch to join.</p>
          <button onClick={() => navigate(user ? '/create' : '/register')} className="btn-primary text-xs py-2 px-5">
            {user ? 'Schedule a Session' : 'Get started'}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {sessions.map(s => {
            const dt = new Date(s.scheduled_at);
            const isHost = user?.id === s.created_by;
            const isLive = !!s.is_room_active;
            const canStart = !isLive && isHost && (Date.now() >= dt.getTime() - 10 * 60000);
            return (
              <div key={s.id} className={`bg-white border rounded-xl overflow-hidden hover:shadow-md transition-all flex flex-col ${isLive ? 'border-emerald-300 hover:border-emerald-400' : 'border-gray-200 hover:border-brand-600/30'}`}>
                <div className={`h-0.5 ${isLive ? 'bg-emerald-500' : 'bg-brand-600'}`} />
                <div className="p-4 flex flex-col gap-3 flex-1">
                  <div className="flex items-center justify-between">
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${COLORS[s.category] || 'bg-gray-50 text-gray-500 border-gray-100'}`}>
                      {s.category}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {isLive ? (
                        <span className="flex items-center gap-1 text-[12px] font-semibold text-emerald-600">
                          <span className="relative flex h-1.5 w-1.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
                          </span>
                          Live Now
                        </span>
                      ) : (
                        <span className="text-[12px] font-semibold text-brand-600">{countdown(s.scheduled_at)}</span>
                      )}
                      <ShareButton
                        title={s.topic}
                        text={`Join "${s.topic}" (${s.category}) on SSBCircle — ${dt.toLocaleDateString('en-IN', { day:'numeric', month:'short' })} at ${dt.toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit' })}. Room code: ${s.room_code}`}
                        url={`${window.location.origin}/room/${s.room_code}`}
                      />
                    </div>
                  </div>
                  <p className="text-sm font-semibold text-gray-800 leading-snug flex-1">{s.topic}</p>
                  <div className="text-xs text-gray-400">
                    <p className="font-medium text-gray-600">{dt.toLocaleDateString('en-IN', { weekday:'short', day:'numeric', month:'short' })} · {dt.toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit' })}</p>
                    {s.host_display_name && <p className="mt-0.5">by {isHost ? <span className="text-brand-600 font-medium">You</span> : s.host_display_name}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    {isLive ? (
                      <button onClick={() => navigate(`/room/${s.room_code}`)} className="flex-1 flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold py-2.5 rounded-lg transition-colors cursor-pointer">
                        <PlayCircle className="w-3.5 h-3.5" /> Join Now
                      </button>
                    ) : canStart ? (
                      <button onClick={() => onStart(s.id)} className="flex-1 flex items-center justify-center gap-1.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold py-2.5 rounded-lg transition-colors cursor-pointer">
                        <PlayCircle className="w-3.5 h-3.5" /> Start Room
                      </button>
                    ) : (
                      <button
                        onClick={() => !s.is_interested && onInterest(s.id)}
                        disabled={s.is_interested}
                        className={`flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold py-2.5 rounded-lg border transition-all ${s.is_interested ? 'bg-emerald-50 text-emerald-700 border-emerald-200 cursor-not-allowed' : 'bg-white text-gray-600 border-gray-200 hover:bg-brand-50 hover:text-brand-600 hover:border-brand-200 cursor-pointer'}`}>
                        <Heart className={`w-3.5 h-3.5 ${s.is_interested ? 'fill-emerald-600' : ''}`} />
                        {s.is_interested ? 'Notification On' : 'Get Notification'}
                      </button>
                    )}
                    {isHost && !canStart && !isLive && (
                      <button
                        onClick={() => {
                          if (window.confirm('Cancel this session? This cannot be undone and all registered aspirants will lose their slot.')) {
                            onCancel(s.id);
                          }
                        }}
                        className="px-3 py-2.5 text-xs text-gray-400 hover:text-red-500 border border-gray-200 hover:border-red-200 rounded-lg transition-colors cursor-pointer">
                        Cancel
                      </button>
                    )}
                  </div>
                  <div className="flex items-center justify-center gap-1.5 mt-1">
                    <div className="flex -space-x-1">
                      {[...Array(Math.min(s.interest_count, 4))].map((_, i) => (
                        <div key={i} className="w-4 h-4 rounded-full bg-brand-600 border border-white" style={{ opacity: 1 - i * 0.15 }} />
                      ))}
                    </div>
                    <p className="text-[12px] text-gray-400">
                      {s.interest_count === 0
                        ? 'No notifications yet — be the first'
                        : `${s.interest_count} aspirant${s.interest_count > 1 ? 's' : ''} getting notified`}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function StepFlow({ steps }) {
  return (
    <div className="flex flex-wrap gap-1.5 mt-3">
      {steps.map((step, i) => (
        <div key={i} className="flex items-center gap-1.5">
          <div className="flex items-center gap-1.5 bg-brand-50 border border-brand-100 rounded-lg px-2.5 py-1.5">
            <span className="w-4 h-4 rounded-full bg-brand-600 text-white text-[11px] font-bold flex items-center justify-center shrink-0">{i + 1}</span>
            <span className="text-xs text-gray-700 font-medium">{step}</span>
          </div>
          {i < steps.length - 1 && (
            <ArrowRight className="w-3 h-3 text-gray-300 shrink-0" />
          )}
        </div>
      ))}
    </div>
  );
}

function FaqSection() {
  const [open, setOpen] = useState(null);
  return (
    <section className="border-t border-gray-100 bg-gray-50 py-10 sm:py-14 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Frequently asked questions</h2>
          <p className="text-sm text-gray-500 mt-1">Everything SSBCircle offers, in short.</p>
        </div>
        <div className="divide-y divide-gray-100 rounded-2xl border border-gray-100 bg-white overflow-hidden">
          {HOME_FAQ.map((item, i) => (
            <div key={i}>
              <button
                onClick={() => setOpen(p => p === i ? null : i)}
                className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left hover:bg-gray-50 transition-colors cursor-pointer"
              >
                <span className="text-[15px] font-semibold text-gray-800">{item.q}</span>
                <ChevronDown className={`w-4 h-4 text-gray-400 shrink-0 transition-transform duration-200 ${open === i ? 'rotate-180' : ''}`} />
              </button>
              {open === i && (
                <div className="px-5 pb-5">
                  {item.a && <p className="text-sm text-gray-600 leading-relaxed">{item.a}</p>}
                  {item.steps && <StepFlow steps={item.steps} />}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* AI costs money per call — say so plainly, where people read about the tools */}
        <p className="mt-4 flex items-start gap-2.5 text-sm text-amber-900 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 leading-relaxed">
          <Lightbulb className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
          <span><span className="font-semibold">Please use AI feedback responsibly.</span> Every check costs us real money to run. Use it when your answer is ready — that keeps SSBCircle running for everyone.</span>
        </p>
      </div>
    </section>
  );
}

// ── Swap AUTHOR_PHOTO with actual URL when available ─────────────────────
const AUTHOR_PHOTO = null; // e.g. '/deepak-surana.jpg'

const DEEPAK_BOOKS = [
  { title: 'The Shershah of Kargil',       cover: 'https://m.media-amazon.com/images/S/compressed.photo.goodreads.com/books/1697890147i/69104661.jpg',    link: 'https://www.goodreads.com/book/show/69104661-shershah-of-kargil' },
  { title: 'The Kargil Story',             cover: 'https://m.media-amazon.com/images/S/compressed.photo.goodreads.com/books/1676206099i/111336817.jpg',    link: 'https://www.goodreads.com/book/show/111336817-the-kargil-story' },
  { title: 'Para Commando',                cover: 'https://www.srishtipublishers.com/wp-content/uploads/2025/11/PARA-COMMANDO_FLAP_RGB_300-600x923.jpg',   link: 'https://www.srishtipublishers.com/product/para-commando/' },
  { title: 'The Liberators of Bangladesh', cover: 'https://rukminim2.flixcart.com/image/480/640/xif0q/book/h/3/i/the-liberators-of-bangladesh-original-imah2tms35yyt5bn.jpeg?q=20', link: 'https://www.flipkart.com/the-liberators-of-bangladesh/p/itm4c0424e14a733' },
];

// ── Terrier Cyber Quest 2026 notice ─────────────────────────────────────────
// Phase-aware: urgent countdown while registration is open, then a quieter
// "in progress" note, then it removes itself entirely after the event.
const TCQ = {
  regCloses:   new Date('2026-09-01T00:00:00+05:30'), // end of 31 Aug IST
  finaleEnds:  new Date('2026-10-10T00:00:00+05:30'), // after 9 Oct awards
  articleUrl:  '/article/terrier-cyber-quest-2026',
  registerUrl: 'https://www.cyberchallenge.in/tcq2026',
};

function TerrierCyberQuestBanner() {
  const [dismissed, setDismissed] = useState(() => {
    try { return localStorage.getItem('tcq2026_notice_dismissed') === '1'; } catch { return false; }
  });

  const now = Date.now();
  if (now >= TCQ.finaleEnds.getTime()) return null;   // event over — retire the banner
  if (dismissed) return null;

  const open     = now < TCQ.regCloses.getTime();
  const daysLeft = Math.max(0, Math.ceil((TCQ.regCloses.getTime() - now) / 86_400_000));

  function dismiss(e) {
    e.preventDefault(); e.stopPropagation();
    try { localStorage.setItem('tcq2026_notice_dismissed', '1'); } catch {}
    setDismissed(true);
  }

  return (
    <div className="border-b border-gray-100 bg-white px-4 sm:px-6 pt-5 sm:pt-6">
      <div className="max-w-5xl mx-auto">
        <Link to={TCQ.articleUrl}
          className={`relative block rounded-2xl border px-5 sm:px-6 py-4 sm:py-5 transition-colors group ${
            open ? 'border-amber-200 bg-amber-50 hover:border-amber-300'
                 : 'border-gray-200 bg-gray-50 hover:border-gray-300'}`}>

          <button onClick={dismiss} aria-label="Dismiss notice"
            className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 cursor-pointer p-1">
            <X className="w-3.5 h-3.5" />
          </button>

          <div className="flex flex-col sm:flex-row sm:items-center gap-4">

            {/* Icon */}
            <div className={`shrink-0 w-11 h-11 rounded-xl flex items-center justify-center border ${
              open ? 'bg-amber-100 border-amber-200' : 'bg-gray-100 border-gray-200'}`}>
              <Shield className={`w-5 h-5 ${open ? 'text-amber-700' : 'text-gray-500'}`} />
            </div>

            {/* Text */}
            <div className="flex-1 min-w-0 pr-6">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className={`text-[10.5px] font-bold px-2 py-0.5 rounded-full uppercase tracking-widest border ${
                  open ? 'text-amber-800 bg-amber-100 border-amber-200'
                       : 'text-gray-600 bg-gray-100 border-gray-200'}`}>
                  Opportunity · Indian Army
                </span>
                {open && (
                  <span className="flex items-center gap-1 text-[10.5px] font-bold text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full uppercase tracking-widest">
                    <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                    {daysLeft === 0 ? 'Closes today' : daysLeft === 1 ? '1 day left' : `${daysLeft} days left`}
                  </span>
                )}
              </div>
              <h3 className="text-sm sm:text-base font-bold text-gray-900 leading-snug">
                Terrier Cyber Quest 2026 — the Territorial Army wants your code
              </h3>
              <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">
                {open
                  ? 'Free national hackathon. Registration closes 31 August — and it gives you something real for your PIQ.'
                  : 'Registration has closed. Shortlisting and the New Delhi finale are underway — read why it matters for your SSB.'}
              </p>
            </div>

            {/* CTAs */}
            <div className="flex items-center gap-2 shrink-0">
              <span className="flex items-center gap-1 text-xs font-bold text-brand-600 group-hover:text-brand-700 whitespace-nowrap">
                Read more <ChevronRight className="w-3.5 h-3.5" />
              </span>
              {open && (
                <a href={TCQ.registerUrl} target="_blank" rel="noopener noreferrer"
                  onClick={e => e.stopPropagation()}
                  className="hidden sm:inline-flex items-center gap-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition-colors whitespace-nowrap">
                  Register <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}

function MentorAnnouncementBanner() {
  const mentor = MENTORS[0];
  if (!mentor) return null;

  const availableFromLabel = mentor.availableFrom && new Date(mentor.availableFrom) > new Date()
    ? new Date(mentor.availableFrom).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
    : null;

  return (
    <>
    {/* Phones: one slim row, so the first screen is the hero and not this */}
    <Link to={`/mentor/${mentor.slug}`}
      className="sm:hidden flex items-center gap-3 px-4 py-2.5 bg-brand-50 border-b border-brand-100">
      {mentor.photo
        ? <img src={mentor.photoAvatar || mentor.photo} alt="" width="36" height="36" className="w-9 h-9 rounded-full object-cover object-top shrink-0 ring-2 ring-brand-200" />
        : <span className="w-9 h-9 rounded-full bg-brand-600 flex items-center justify-center shrink-0"><Star className="w-4 h-4 text-white" /></span>}
      <span className="flex-1 min-w-0 text-sm leading-snug text-gray-800">
        <span className="font-semibold text-brand-700">New mentor:</span> {mentor.name}
      </span>
      <ChevronRight className="w-4 h-4 text-brand-600 shrink-0" />
    </Link>

    <div className="hidden sm:block border-b border-gray-100 bg-white px-6 py-3">
      <div className="max-w-5xl mx-auto">
        <Link to={`/mentor/${mentor.slug}`}
          className="group flex items-center gap-4 rounded-xl border border-brand-100 bg-brand-50 px-4 py-2.5 hover:border-brand-600/30 transition-colors">
          {mentor.photo ? (
            <img src={mentor.photoAvatar || mentor.photo} alt="" width="40" height="40" loading="lazy" decoding="async"
              className="w-10 h-10 rounded-full object-cover object-top shrink-0 ring-2 ring-brand-200" />
          ) : (
            <span className="w-10 h-10 rounded-full bg-brand-600 flex items-center justify-center shrink-0"><Star className="w-5 h-5 text-white" /></span>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm text-gray-900 leading-snug truncate">
              <span className="text-[10px] font-bold tracking-widest uppercase text-brand-600 bg-brand-100 px-2 py-0.5 rounded-full mr-2 align-middle">New mentor</span>
              <span className="font-bold text-brand-600">{mentor.name}</span> joins SSBCircle
            </p>
            <p className="mt-0.5 text-xs text-gray-500 truncate flex items-center gap-1.5">
              <Shield className="w-3 h-3 shrink-0" /> Verified officer · {mentor.specialties.slice(0, 2).join(' · ')}
              {availableFromLabel && <> · Appointments open {availableFromLabel}</>}
            </p>
          </div>
          <span className="shrink-0 inline-flex items-center gap-1 text-sm font-semibold text-brand-700 group-hover:gap-1.5 transition-all">
            View profile <ArrowRight className="w-4 h-4" />
          </span>
        </Link>
      </div>
    </div>
    </>
  );
}

export default function LandingPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [searchParams] = useSearchParams();
  const tabsSectionRef = useRef(null);
  const [menuOpen,        setMenuOpen]        = useState(false);
  const [showTips,        setShowTips]        = useState(false);
  const [showEarlyAccess, setShowEarlyAccess] = useState(false);
  const [rooms,           setRooms]           = useState([]);
  const [loading,         setLoading]         = useState(true);
  const [catFilter,       setCatFilter]       = useState('All');
  const [subFilter,       setSubFilter]       = useState('');
  const [visibleCount,    setVisibleCount]    = useState(pageSize);
  const [tab,             setTab]             = useState(() => searchParams.get('tab') === 'upcoming' ? 'upcoming' : 'live');
  const [sessions,        setSessions]        = useState([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [aspirants,       setAspirants]       = useState([]);
  const [pastSessions,    setPastSessions]    = useState([]);
  const [articles,        setArticles]        = useState([]);
  const [articlesLoading, setArticlesLoading] = useState(true);

  async function fetchRooms(showSkeleton = false) {
    if (showSkeleton) setLoading(true);
    try { setRooms(await getActiveRooms()); }
    catch { /* non-critical */ }
    finally { setLoading(false); }
  }

  async function fetchSessions(showSkeleton = false) {
    if (showSkeleton) setSessionsLoading(true);
    try { setSessions(await getSessions()); }
    catch { /* non-critical */ }
    finally { setSessionsLoading(false); }
  }

  useEffect(() => {
    // First load — show skeletons
    fetchRooms(true);
    fetchSessions(true);

    // Featured aspirants + past sessions — load once
    getFeatured().then(d => setAspirants(d.aspirants || [])).catch(() => {});
    getPastSessions().then(d => setPastSessions(d || [])).catch(() => {});
    getArticles()
      .then(d => setArticles((d || []).slice(0, 5)))
      .catch(() => setArticles([]))
      .finally(() => setArticlesLoading(false));

    // Scroll to tabs section if URL has ?tab= param
    if (searchParams.get('tab')) {
      setTimeout(() => {
        tabsSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 300);
    }

    // Background refresh — silent (no skeleton flash)
    const roomTimer    = setInterval(() => fetchRooms(false), 20_000);
    const sessionTimer = setInterval(() => fetchSessions(false), 45_000);
    return () => { clearInterval(roomTimer); clearInterval(sessionTimer); };
  }, []);

  // Reset visible count when filter changes
  function handleCatFilter(cat) {
    setCatFilter(cat);
    setSubFilter('');
    setVisibleCount(pageSize);
  }
  function handleSubFilter(sub) {
    setSubFilter(p => p === sub ? '' : sub);
    setVisibleCount(pageSize);
  }

  const ssbDays = user?.ssb_date ? daysBetween(todayIST(), user.ssb_date) : null;

  const filteredRooms = rooms.filter(r => {
    if (catFilter !== 'All' && r.category !== catFilter) return false;
    if (subFilter && r.subcategory !== subFilter) return false;
    return true;
  });
  const displayedRooms = filteredRooms.slice(0, visibleCount);
  const hasMore = filteredRooms.length > visibleCount;

  // "No other aspirants" means nobody is actually present — an open room with
  // no one in it still counts as quiet. Deliberately ignores the category
  // filter: people practising elsewhere on the site are still company.
  const nobodyAround = rooms.every(r => (r.participant_count ?? 0) === 0);

  function handleJoin(code) {
    if (!user) { navigate('/login'); return; }
    navigate(`/room/${code}`);
  }

  async function handleDelete(code) {
    try {
      await closeRoom(code);
      setRooms(p => p.filter(r => r.room_code !== code));
    } catch (e) { alert(e.message); }
  }

  return (
    <div className="min-h-screen bg-white">

      <SiteNav />
      <HomeRail sections={HOME_SECTIONS} />

      {/* Exam dates and results, scrolling under the navbar */}
      <ExamTicker />

      <main>

        {/* ── Terrier Cyber Quest 2026 notice — self-retires after the event ── */}
        <TerrierCyberQuestBanner />

        {/* ── Special Event Banner ── */}
        <MentorAnnouncementBanner />

        {/* ── Hero — what this is, one clear start, and (signed in) where you left off ── */}
        <section id="top" className="border-b border-gray-100 bg-gradient-to-b from-brand-50/60 to-white py-10 sm:py-14 lg:py-16 px-4 sm:px-6">
          <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            <div>
              {user ? (
                <Hello className="mb-4" />
              ) : (
                <p className="inline-flex items-center gap-2 text-xs font-semibold text-brand-700 bg-white border border-brand-100 px-3 py-1.5 rounded-full mb-5">
                  <Shield className="w-3.5 h-3.5" /> SSB preparation for every entry
                </p>
              )}

              <h1 className="text-[1.75rem] sm:text-5xl font-bold text-gray-900 leading-[1.1] tracking-tight mb-4">
                {user ? (
                  <>Welcome back,{' '}
                    {/* The name is the point of this line: brand colour on a marker stroke */}
                    <span className="relative inline-block whitespace-nowrap">
                      <span className="absolute inset-x-0 bottom-[0.08em] h-[0.38em] bg-amber-200/80 rounded-sm -rotate-1" aria-hidden="true" />
                      <span className="relative text-brand-600">{firstName(user)}</span>
                    </span>.
                    <br /><span className="text-gray-800">Let's keep going.</span></>
                ) : <>Start your SSB prep<br /><span className="text-brand-600">the right way.</span></>}
              </h1>

              {user && (user.exam_type || ssbDays != null) && (
                <div className="-mt-1 mb-5 flex flex-wrap gap-2">
                  {user.exam_type && (
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-700 bg-white border border-brand-100 px-3 py-1.5 rounded-full">
                      <Target className="w-3.5 h-3.5" /> Preparing for {user.exam_type.replace(/^Other:\s*/, '')}
                    </span>
                  )}
                  {ssbDays != null && ssbDays >= 0 && (
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-800 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-full">
                      <Calendar className="w-3.5 h-3.5" /> {ssbDays === 0 ? 'Your SSB is today — all the best' : `Your SSB in ${ssbDays} day${ssbDays === 1 ? '' : 's'}`}
                    </span>
                  )}
                </div>
              )}

              <p className="text-gray-600 text-sm sm:text-lg leading-relaxed mb-6">
                Know yourself through your PIQ, practise TAT stories with honest feedback, stay ready with
                news cards, and speak in live GD and PPDT rooms with other aspirants.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 mb-6">
                <button onClick={() => { trackEvent('home_cta', { which: user ? 'piq' : 'start_free' }); navigate(user ? '/piq' : '/register'); }}
                  className="btn-primary text-sm px-7 py-3 w-full sm:w-auto flex items-center justify-center gap-2">
                  {user ? 'Open my PIQ' : 'Get started'} <ArrowRight className="w-4 h-4" />
                </button>
                <button onClick={() => { trackEvent('home_cta', { which: 'tat' }); navigate('/tat'); }}
                  className="btn-secondary text-sm px-7 py-3 w-full sm:w-auto">
                  Try a TAT story
                </button>
              </div>

              {/* Start here — the way in for anyone unsure what to do first */}
              <Link to="/how-it-works" onClick={() => trackEvent('home_cta', { which: 'how_it_works' })}
                className="group mb-5 flex items-center gap-4 w-full sm:max-w-md rounded-2xl border-2 border-amber-300 bg-amber-50 px-4 py-3.5 shadow-sm hover:border-amber-400 hover:shadow-md transition-all">
                <span className="relative w-12 h-12 rounded-xl bg-amber-400 text-white flex items-center justify-center shrink-0">
                  <Signpost className="w-6 h-6" />
                  <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-amber-500 ring-2 ring-amber-50 animate-pulse" aria-hidden="true" />
                </span>
                <span className="min-w-0 flex-1 text-left">
                  <span className="block text-[11px] font-bold uppercase tracking-wider text-amber-700">New here?</span>
                  <span className="block text-base font-bold text-gray-900 leading-snug">See what to do first on SSBCircle</span>
                  <span className="block text-xs text-gray-600 mt-0.5">A 2-minute guide to every tool, for where you are</span>
                </span>
                <span className="w-9 h-9 rounded-full bg-white border border-amber-200 text-amber-700 flex items-center justify-center shrink-0 group-hover:translate-x-0.5 transition-transform">
                  <ArrowRight className="w-5 h-5" />
                </span>
              </Link>

              {!user && (
                <Link to="/become-an-officer" onClick={() => trackEvent('home_cta', { which: 'start_guide' })}
                  className="mb-5 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 hover:text-brand-900">
                  Dream of the uniform? How to become an officer <ArrowRight className="w-4 h-4" />
                </Link>
              )}

              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-gray-500">
                <span className="inline-flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-600" /> No download needed</span>
                <span className="inline-flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-600" /> NDA, CDS, AFCAT, TES and more</span>
                {!loading && rooms.length > 0 && (
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> {rooms.length} room{rooms.length > 1 ? 's' : ''} live now
                  </span>
                )}
              </div>
            </div>

            <PrepPath user={user} liveCount={rooms.length} />
          </div>
        </section>

        {/* ── Days to your SSB — personal, so it leads; renders nothing unless a date is saved ── */}
        <SsbCountdown user={user} />

        {/* The page runs: where to start → every stage → read → practise live → discuss */}
        <div id="stages"><SsbStages /></div>
        <div id="prep"><Suspense fallback={<div className="h-[300px] border-t border-gray-100" />}><HomePrepSheet /></Suspense></div>

        {/* ── Latest Reads — right under the hero so every visitor sees them ── */}
        <div id="news"><LatestReadsSection articles={articles} loading={articlesLoading} /></div>

        {/* ── Live / Upcoming tabs ── */}
        <section id="rooms" ref={tabsSectionRef} className="scroll-mt-16 border-t border-gray-100 bg-white px-4 sm:px-6 py-10 sm:py-14">
          <div className="max-w-5xl mx-auto">

          <div className="mb-5">
            <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-brand-600">Practise together</p>
            <h2 className="mt-1.5 text-xl sm:text-2xl font-bold text-gray-900">Speak with other aspirants</h2>
            <p className="text-sm text-gray-500 mt-1">GD, PPDT, Lecturette and mock interviews with other aspirants. Voice only, join from your phone.</p>
          </div>

          {/* Tab switcher */}
          <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl w-full sm:w-fit mb-6">
            <button onClick={() => setTab('live')}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer ${tab === 'live' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              Live Rooms
              {rooms.length > 0 && <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full">{rooms.length}</span>}
            </button>
            <button onClick={() => setTab('upcoming')}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer ${tab === 'upcoming' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
              <Calendar className="w-3.5 h-3.5 shrink-0" />
              Upcoming
              {sessions.length > 0 && <span className="text-xs font-bold text-brand-600 bg-brand-50 px-1.5 py-0.5 rounded-full">{sessions.length}</span>}
            </button>
          </div>

          {/* ── Early Access toggle — desktop only; on a phone it pushes the rooms down ── */}
          <div className="mb-6 hidden sm:block">
            <button
              onClick={() => setShowEarlyAccess(v => !v)}
              className="group flex items-center w-fit gap-2.5 px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-semibold transition-all cursor-pointer shadow-sm"
            >
              <Sparkles className="w-4 h-4 text-brand-100" />
              <span>Early Access</span>
              <span className="text-brand-100 text-xs font-normal hidden sm:inline">— see what's building behind the scenes</span>
              <ChevronDown className={`w-4 h-4 text-brand-100 transition-transform duration-200 ${showEarlyAccess ? 'rotate-180' : ''}`} />
            </button>

            {showEarlyAccess && (
              <div className="mt-3 rounded-2xl bg-brand-600 text-white overflow-hidden">
                <div className="px-5 py-4 flex flex-col sm:flex-row sm:items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold leading-snug mb-1.5">Intentionally limited. Uncompromisingly focused.</p>
                    <p className="text-xs text-brand-100 leading-relaxed">
                      SSBCircle runs a maximum of 8 live rooms and 4 upcoming sessions to keep every discussion meaningful and distraction-free. As aspirants grow, so does SSBCircle — shaped entirely by you.
                    </p>
                  </div>
                  <div className="flex sm:flex-col gap-3 sm:gap-2 shrink-0">
                    <div className="flex-1 sm:flex-none bg-white/8 border border-white/10 rounded-xl px-4 py-2.5 text-center">
                      <p className="text-xl font-bold tabular-nums leading-none">{loading ? '—' : rooms.length}<span className="text-brand-100 text-sm font-medium">/8</span></p>
                      <p className="text-[11px] text-brand-100 uppercase tracking-widest mt-0.5">Live Rooms</p>
                    </div>
                    <div className="flex-1 sm:flex-none bg-white/8 border border-white/10 rounded-xl px-4 py-2.5 text-center">
                      <p className="text-xl font-bold tabular-nums leading-none">{sessionsLoading ? '—' : sessions.length}<span className="text-brand-100 text-sm font-medium">/4</span></p>
                      <p className="text-[11px] text-brand-100 uppercase tracking-widest mt-0.5">Scheduled</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ── UPCOMING tab ── */}
          {tab === 'upcoming' && (
            <UpcomingTab sessions={sessions} loading={sessionsLoading} user={user}
              onRefresh={fetchSessions} navigate={navigate}
              onInterest={async (id) => {
                if (!user) { navigate('/login'); return; }
                const res = await toggleInterest(id).catch(() => null);
                if (res) setSessions(prev => prev.map(s => s.id === id ? {
                  ...s,
                  is_interested: res.interested,
                  interest_count: s.interest_count + (res.interested ? 1 : -1),
                } : s));
              }}
              onCancel={async (id) => {
                await cancelSession(id).catch(() => null);
                setSessions(prev => prev.filter(s => s.id !== id));
              }}
              onStart={async (id) => {
                const room = await startSession(id).catch(() => null);
                if (room) { fetchSessions(); navigate(`/room/${room.room_code}`); }
              }}
            />
          )}

          {/* ── LIVE tab ── */}
          {tab === 'live' && (<>
          <div className="flex items-center justify-between mb-5">
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Live rooms</h2>
                {!loading && rooms.length > 0 && (
                  <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    {rooms.length} active
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm text-gray-400">Open to all — sign in to join</p>
            </div>
            <button onClick={() => fetchRooms(false)}
              className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 cursor-pointer font-medium px-2 py-1.5">
              <Radio className="w-3.5 h-3.5" /> Refresh
            </button>
          </div>

          {/* Category filter tabs */}
          <div className="mb-4">
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              {CATEGORIES.map(cat => (
                <button key={cat} onClick={() => handleCatFilter(cat)}
                  className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
                    catFilter === cat ? 'bg-brand-600 text-white border-brand-600' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}>
                  {cat}
                </button>
              ))}
            </div>
            {catFilter === 'GD' && (
              <div className="flex gap-1.5 flex-wrap mt-2.5">
                {GD_SUBCATEGORIES.map(sub => (
                  <button key={sub} onClick={() => handleSubFilter(sub)}
                    className={`px-2.5 py-1 rounded-full border text-[12px] font-medium transition-all cursor-pointer ${
                      subFilter === sub ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-400 border-gray-200 hover:border-gray-300'
                    }`}>
                    {sub}
                  </button>
                ))}
              </div>
            )}
          </div>

          {!loading && nobodyAround && <DailyMeetsNote />}

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              <Skeleton /><Skeleton /><Skeleton />
            </div>
          ) : filteredRooms.length === 0 ? (
            <div className="border border-dashed border-gray-200 rounded-xl py-12 sm:py-16 text-center px-6">
              <div className="w-12 h-12 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center mx-auto mb-4">
                <Radio className="w-5 h-5 text-gray-300" />
              </div>
              <p className="text-sm font-medium text-gray-700 mb-1">
                {catFilter === 'All' ? 'No active rooms right now' : `No active ${catFilter} rooms`}
              </p>
              <p className="text-xs text-gray-400 mb-5 max-w-xs mx-auto">Start a discussion and share the code with your batch.</p>
              <button onClick={() => navigate(user ? '/create' : '/register')} className="btn-primary text-xs py-2 px-5">
                {user ? 'Create a Room' : 'Get started'}
              </button>
              <p className="text-xs text-gray-400 mt-4">
                No GD topic?{' '}
                <Link to="/current-affairs" className="text-brand-600 font-semibold hover:underline">Browse News Cards →</Link>
              </p>
            </div>
          ) : (
            <>
              {/* Phones: a swipeable row, so the rooms cost one screen, not three */}
              <div className="m-rail sm:grid-cols-2 lg:grid-cols-3">
                {displayedRooms.map(r => (
                  <RoomCard key={r.id} room={r} user={user} onJoin={handleJoin} onDelete={handleDelete} />
                ))}
              </div>
              {hasMore && (
                <div className="mt-5 text-center">
                  <button onClick={() => setVisibleCount(p => p + pageSize)} className="btn-secondary text-sm py-2.5 px-6 w-full sm:w-auto">
                    Show {Math.min(pageSize, filteredRooms.length - visibleCount)} more · {filteredRooms.length - visibleCount} left
                  </button>
                </div>
              )}
              {!user && (
                <div className="mt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-brand-50 border border-brand-100 rounded-xl px-4 sm:px-5 py-4">
                  <p className="text-sm text-brand-700 font-medium">Sign in to join or create a room</p>
                  <Link to="/register" className="btn-primary text-xs py-2 px-4 shrink-0 w-full sm:w-auto text-center">Join now</Link>
                </div>
              )}
              {user && (
                <div className="mt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-gray-50 border border-gray-100 rounded-xl px-4 sm:px-5 py-3.5">
                  <p className="text-sm text-gray-600 font-medium">Want to start your own discussion?</p>
                  <button onClick={() => navigate('/create')} className="btn-primary text-xs py-2 px-4 shrink-0 w-full sm:w-auto">Create a Room</button>
                </div>
              )}
            </>
          )}
          </>)}

          {/* Host caution — belongs with the rooms it refers to; only signed-in people host */}
          {user && <div className="mt-6 flex items-start gap-2.5 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" aria-hidden="true" />
            <p className="text-xs text-amber-800 leading-relaxed">
              <span className="font-bold">Hosts — once your session is over, please delete your room</span> using the <span className="font-semibold">"End & Delete Room"</span> button inside the room. This keeps the platform open for others to practise.
            </p>
          </div>}
          </div>
        </section>

        {/* ── Community — ask box + recent posts; renders nothing if empty and closed to posting ── */}
        <div id="community"><CommunityHighlights /></div>


        {/* ── Notable Sessions — social proof, sits with the rooms zone ── */}
        {pastSessions.length > 0 && (
          <section className="border-t border-gray-100 bg-gray-50 py-10 sm:py-14 px-4 sm:px-6">
            <div className="max-w-5xl mx-auto">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Notable Sessions</h2>
                  <p className="text-sm text-gray-400 mt-0.5">Past discussions led by veterans, recommended candidates & domain experts</p>
                </div>
              </div>
              <div className="m-rail sm:grid-cols-2 lg:grid-cols-3">
                {pastSessions.map(s => {
                  const colorClass = CATEGORY_COLORS[s.category] || 'bg-gray-100 text-gray-500 border-gray-200';
                  const initials = s.host_name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?';
                  const dt = new Date(s.created_at);
                  return (
                    <div key={s.room_code} className="bg-white border border-gray-100 rounded-xl p-4 flex flex-col gap-3 hover:border-gray-200 hover:shadow-sm transition-all">
                      <div className="flex items-center justify-between">
                        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${colorClass}`}>
                          {s.category}
                        </span>
                        <span className="text-[12px] text-gray-300">
                          {dt.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                        </span>
                      </div>
                      <p className="text-sm font-semibold text-gray-800 leading-snug flex-1">{s.topic}</p>
                      {s.summary && (
                        <p className="text-xs text-gray-500 leading-relaxed border-t border-gray-50 pt-2">{s.summary}</p>
                      )}
                      <div className="flex items-center gap-2 mt-auto pt-1">
                        {s.host_avatar
                          ? <img src={s.host_avatar} alt={s.host_name} className="w-5 h-5 rounded-full object-cover" />
                          : <div className="w-5 h-5 rounded-full bg-brand-600 flex items-center justify-center text-[8px] font-bold text-white shrink-0">{initials}</div>
                        }
                        <span className="text-[12px] text-gray-400">by {s.host_name || 'Aspirant'}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* ── Mentors ── */}
        <div id="mentors"><MentorsSection /></div>

        {/* ── Active Aspirants ── */}
        <ActiveAspirantsSection aspirants={aspirants} />

        {/* ── Ways to serve before the uniform ── */}
        <ContributeSection />

        {/* ── Coming soon: three short cards instead of two full-width blocks ── */}
        <section className="bg-white px-4 sm:px-6 py-8 sm:py-10">
          <div className="max-w-5xl mx-auto">
            <p className="text-xs font-bold uppercase tracking-widest text-brand-600 flex items-center gap-2"><Lock className="w-3.5 h-3.5" /> Coming soon</p>
            <h2 className="mt-1 text-lg sm:text-xl font-bold text-gray-900">Built in the open — you shape what comes next</h2>
            <div className="mt-4 m-rail sm:grid-cols-3">
              {[
                { icon: Footprints, title: 'The 21-day challenge', text: 'One entry a day for 21 days, checked by hand. The most consistent aspirant wins a new pair of running shoes.', tag: 'Seats open soon' },
                { icon: Shield, title: 'Sessions with veterans', text: 'Guided sessions with ex-servicemen and recommended candidates, with feedback on how you speak and lead.', tag: 'Invite-only' },
                { icon: Star, title: 'Peer ratings', text: 'After a session, rate each other on communication and leadership, and build a profile over time.', tag: 'Planned' },
              ].map(({ icon: Icon, title, text, tag }) => (
                <div key={title} className="rounded-2xl border border-gray-200 bg-gray-50/60 p-4">
                  <div className="flex items-center justify-between gap-2">
                    <span className="w-9 h-9 rounded-xl bg-white border border-gray-200 text-brand-600 flex items-center justify-center"><Icon className="w-4 h-4" /></span>
                    <span className="text-[11px] font-semibold text-gray-500 bg-white border border-gray-200 px-2 py-0.5 rounded-full">{tag}</span>
                  </div>
                  <h3 className="mt-3 text-sm font-bold text-gray-900">{title}</h3>
                  <p className="mt-1 text-xs text-gray-500 leading-relaxed">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

      </main>

      {/* ── SSB FAQ Section ── */}
      <div id="faq"><FaqSection /></div>

      <footer className="border-t border-gray-100 py-8 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Logo />
          <p className="text-xs text-gray-300">© {new Date().getFullYear()} SSBCircle</p>
        </div>
      </footer>
    </div>
  );
}
