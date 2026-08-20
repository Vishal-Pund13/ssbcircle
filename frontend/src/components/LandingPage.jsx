import { useEffect, useRef, useState, lazy, Suspense } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { getActiveRooms, closeRoom, getSessions, toggleInterest, cancelSession, startSession, getFeatured, getPastSessions } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { MENTORS } from '../data/mentors';
import { Mic, Timer, FileText, CheckSquare, Radio, ArrowRight, Trash2, Zap, Lightbulb, Users, Presentation, Target, Headphones, RefreshCw, X, Calendar, Heart, PlayCircle, Share2, Check, Sparkles, ChevronDown, Shield, Star, Lock, BookOpen, Video, Award, ChevronRight, GraduationCap, ExternalLink, AlertTriangle, HeartHandshake } from 'lucide-react';

// Lazy-loaded — keeps react-simple-maps out of the main bundle
const HeroMapAnimation = lazy(() => import('./HeroMapAnimation'));

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
                  <p className="text-[10px] text-gray-400 leading-relaxed">{card.hint}</p>

                  {/* Read CTA — fades in on hover */}
                  {!card.ghost && (
                    <div className={`mt-3 pt-2.5 border-t border-gray-100 flex items-center gap-1 text-[10px] font-bold text-brand-600 transition-opacity duration-200 ${isHov ? 'opacity-100' : 'opacity-0'}`}>
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
      <p className="text-[11px] text-gray-400 font-medium text-center">
        Click any card to read · <Link to="/current-affairs" className="text-brand-600 hover:underline font-semibold">Browse all News Cards</Link>
      </p>
    </div>
  );
}

const CATEGORIES = ['All', 'GD', 'PPDT', 'Lecturette', 'IO Practice'];
const GD_SUBCATEGORIES = ['Defence', 'International Relations', 'Society', 'Economy', 'Science & Tech', 'Environment', 'Sports & Awards'];
const PAGE_SIZE = 6;

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
  if (avatarUrl) return <img src={avatarUrl} alt={name} className="w-7 h-7 rounded-full object-cover" />;
  return (
    <div className="w-7 h-7 rounded-full bg-brand-600 flex items-center justify-center text-[10px] font-bold text-white shrink-0">
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
          <img src={mentor.photo} alt={mentor.name}
            className="relative z-10 w-14 h-14 rounded-full object-cover border-2 border-white/30 group-hover:border-white/50 transition-all" />
        ) : (
          <div className="relative z-10 w-14 h-14 rounded-full bg-white/15 border-2 border-white/30 flex items-center justify-center text-white text-xl font-bold select-none group-hover:border-white/50 transition-all">
            {mentor.avatarInitials}
          </div>
        )}

        {/* Branch label */}
        <div className="relative z-10 text-center">
          <p className="text-[9px] font-bold text-white/90 tracking-widest uppercase leading-tight">
            {mentor.branch.replace('Indian ', '')}
          </p>
        </div>

        {/* Active indicator */}
        {mentor.isActive && (
          <div className="relative z-10 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[9px] text-emerald-300 font-semibold">Active</span>
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
            <p className="text-[11px] text-gray-400 mt-0.5">{mentor.rank}</p>
          </div>
          <span className="shrink-0 flex items-center gap-1 text-[9px] font-bold text-sky-700 bg-sky-50 border border-sky-100 px-2 py-1 rounded-lg">
            <Shield className="w-2.5 h-2.5" /> Verified
          </span>
        </div>

        {/* Bio */}
        <p className="text-xs text-gray-400 leading-relaxed line-clamp-2 flex-1">{mentor.bio}</p>

        {/* Specialty chips */}
        <div className="flex flex-wrap gap-1">
          {mentor.specialties.slice(0, 3).map(tag => (
            <span key={tag} className="text-[9px] font-semibold text-brand-600 bg-brand-50 px-2 py-0.5 rounded-full border border-brand-100">
              {tag}
            </span>
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-2 pt-2 border-t border-gray-50 mt-auto">
          <span className="flex items-center gap-1 text-[10px] text-gray-300">
            <Award className="w-3 h-3 text-sky-300" /> {mentor.yearsOfService} service
          </span>
          <span className="flex items-center gap-0.5 text-[11px] font-semibold text-brand-600 group-hover:gap-1 transition-all">
            View Profile <ChevronRight className="w-3 h-3" />
          </span>
        </div>
      </div>
    </div>
  );
}

function MentorsSection() {
  return (
    <section className="border-t border-gray-100 bg-white py-10 sm:py-14 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto">

        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Mentors</h2>
            <p className="text-sm text-gray-400 mt-0.5">Verified officers guiding SSB aspirants — hand-picked, limited seats</p>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-sky-700 bg-sky-50 border border-sky-100 px-3 py-1.5 rounded-full shrink-0">
            <Shield className="w-3.5 h-3.5" /> Verified Service
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
    <a href={way.link} target="_blank" rel="noopener noreferrer"
      className="group flex flex-col gap-3 bg-white border border-gray-200 rounded-2xl p-4 sm:p-5 hover:border-brand-600/30 hover:shadow-md transition-all duration-200">
      <div className="flex items-center justify-between">
        <div className="w-11 h-11 rounded-xl bg-brand-50 border border-brand-100 flex items-center justify-center group-hover:bg-brand-100 transition-colors overflow-hidden shrink-0">
          {showImage ? (
            <img src={way.image} alt={`${way.title} emblem`} loading="lazy"
              className="w-full h-full object-contain p-1.5" onError={() => setImgFailed(true)} />
          ) : (
            <Icon className="w-5 h-5 text-brand-600" />
          )}
        </div>
        <ExternalLink className="w-3.5 h-3.5 text-gray-300 group-hover:text-brand-600 transition-colors" />
      </div>
      <div>
        <h3 className="text-sm font-bold text-gray-900">{way.title}</h3>
        <p className="text-[11px] text-gray-400">{way.org}</p>
      </div>
      <p className="text-xs text-gray-500 leading-relaxed flex-1">{way.desc}</p>
      <span className="text-[11px] font-semibold text-brand-600 flex items-center gap-1">
        Learn how <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
      </span>
    </a>
  );
}

function ContributeSection() {
  return (
    <section className="border-t border-gray-100 bg-gray-50 py-10 sm:py-14 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto">

        <div className="mb-8">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-4 h-4 text-brand-600" />
            <span className="text-xs font-bold uppercase tracking-widest text-brand-600">Before The Uniform</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Your Journey to Serve Doesn't Wait for a Result</h2>
          <p className="text-sm text-gray-400 mt-1 max-w-2xl">
            Selection isn't the only door in. Every option below builds the same Officer-Like Qualities SSB assessors look for — Initiative, Social Adaptability, Cooperation — and lets you contribute to the nation right now.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {CONTRIBUTE_WAYS.map(way => <ContributeCard key={way.title} way={way} />)}
        </div>

        <p className="text-[10px] text-gray-300 mt-4">
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
            <span className="text-[11px] font-mono font-semibold text-gray-400 tracking-widest">{room.room_code}</span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${isFull ? 'bg-red-50 text-red-500 border-red-200' : 'bg-gray-50 text-gray-500 border-gray-200'}`}>
              {isFull ? 'Full' : `${count}/${maxP}`}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-gray-300 hidden sm:inline">{timeAgo(room.created_at)}</span>
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
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${colorClass}`}>
              {room.category}
            </span>
          )}
          {room.subcategory && (
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-gray-50 text-gray-400 border border-gray-100">
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
                  ? <img key={i} src={p.avatar_url} alt={p.name}
                      className="w-7 h-7 rounded-full border-2 border-white object-cover"
                      title={p.name} />
                  : <div key={i}
                      className="w-7 h-7 rounded-full bg-brand-600 border-2 border-white flex items-center justify-center text-[10px] font-bold text-white shrink-0"
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
            {user ? 'Schedule a Session' : 'Get started free'}
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
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${COLORS[s.category] || 'bg-gray-50 text-gray-500 border-gray-100'}`}>
                      {s.category}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {isLive ? (
                        <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
                          <span className="relative flex h-1.5 w-1.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
                          </span>
                          Live Now
                        </span>
                      ) : (
                        <span className="text-[11px] font-semibold text-brand-600">{countdown(s.scheduled_at)}</span>
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
                    <p className="text-[11px] text-gray-400">
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

const FAQ_ITEMS = [
  {
    q: 'What is SSBCircle and what can I practice on it?',
    a: 'SSBCircle is a free platform built exclusively for SSB interview preparation. Read News Cards to get GD-ready on current affairs, then jump into live voice rooms to practice Group Discussion, PPDT, Lecturette, and IO mock interviews with real defence aspirants — no download, no subscription.',
  },
  {
    q: 'What are News Cards on SSBCircle?',
    a: 'News Cards are bite-sized swipeable topic cards on Defence, Economy, Polity, Geography & Society — built specifically for SSB GD and Lecturette prep. Each card takes about 5 minutes and gives you key data, multiple perspectives, and how to frame the topic in an SSB discussion. There is a short quiz at the end to lock it in.',
    steps: [
      'Open News Cards from the homepage',
      'Pick a topic — Rupee, El Niño, etc.',
      'Swipe through scenes: hook → concept → breakdown → two sides',
      'Take the optional quick quiz',
      'Open a GD room on the same topic',
    ],
  },
  {
    q: 'How to practice SSB Group Discussion (GD) on SSBCircle?',
    a: 'Matches the real SSB GD format — up to 8 participants, timed discussion, live transcript. No GD topic? Read a News Card first.',
    steps: [
      'Read a News Card for topic ideas',
      'Create GD room & set topic',
      'Share 6-letter code with peers',
      'Start GD timer',
      'Discuss — live transcript on',
      'Review transcript after',
    ],
  },
  {
    q: 'How to practice PPDT (Picture Perception & Discussion Test) on SSBCircle?',
    a: 'Simulates the full Day 1 PPDT flow — picture viewing, story writing, narration, and group discussion.',
    steps: [
      'Host creates PPDT room',
      'Share screen — show picture to group',
      'View picture — 30 sec timer',
      'Everyone writes story — 4 min',
      'Narrate stories — 1 min each',
      'Group discussion begins',
    ],
  },
  {
    q: 'How to practice Lecturette on SSBCircle?',
    a: 'Replicates the SSB Lecturette format — 4 topics, 1-min prep, 3-min talk to the group. Use News Cards to prepare solid talking points before the session.',
    steps: [
      'Read a News Card to prepare content',
      'Host creates Lecturette room',
      'Host announces 4 topics',
      'Each person picks a topic',
      '1 min preparation time',
      'Speak 3 min — timer running',
    ],
  },
  {
    q: 'How to practice SSB IO mock interview on SSBCircle?',
    a: 'Simulates the SSB personal interview — one person plays the IO, others observe and give feedback.',
    steps: [
      'Create IO Practice room',
      'One person plays interviewer (IO)',
      'Q&A — background, hobbies, current affairs',
      'Swap roles with next person',
      'Group debrief & feedback',
    ],
  },
  {
    q: 'Is SSBCircle free?',
    a: 'Yes — 100% free for all SSB aspirants. NDA, CDS, AFCAT, TA, TES, UES — all entry schemes. Sign in with Google and start instantly. No subscription, no paywall, no hidden charges.',
  },
];

function StepFlow({ steps }) {
  return (
    <div className="flex flex-wrap gap-1.5 mt-3">
      {steps.map((step, i) => (
        <div key={i} className="flex items-center gap-1.5">
          <div className="flex items-center gap-1.5 bg-brand-50 border border-brand-100 rounded-lg px-2.5 py-1.5">
            <span className="w-4 h-4 rounded-full bg-brand-600 text-white text-[10px] font-bold flex items-center justify-center shrink-0">{i + 1}</span>
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
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">SSB Interview — Frequently Asked Questions</h2>
          <p className="text-sm text-gray-400 mt-1">How to use SSBCircle for every part of SSB interview prep.</p>
        </div>
        <div className="divide-y divide-gray-100 rounded-2xl border border-gray-100 bg-white overflow-hidden">
          {FAQ_ITEMS.map((item, i) => (
            <div key={i}>
              <button
                onClick={() => setOpen(p => p === i ? null : i)}
                className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left hover:bg-gray-50 transition-colors cursor-pointer"
              >
                <span className="text-sm font-semibold text-gray-800">{item.q}</span>
                <ChevronDown className={`w-4 h-4 text-gray-400 shrink-0 transition-transform duration-200 ${open === i ? 'rotate-180' : ''}`} />
              </button>
              {open === i && (
                <div className="px-5 pb-5">
                  {item.a && <p className="text-sm text-gray-500 leading-relaxed">{item.a}</p>}
                  {item.steps && <StepFlow steps={item.steps} />}
                </div>
              )}
            </div>
          ))}
        </div>
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

function MentorAnnouncementBanner() {
  const mentor = MENTORS[0];
  if (!mentor) return null;

  const availableFromLabel = mentor.availableFrom
    ? new Date(mentor.availableFrom).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
    : null;

  return (
    <div className="border-b border-gray-100 bg-white px-4 sm:px-6 py-5 sm:py-6">
      <div className="max-w-5xl mx-auto">

        <div className="rounded-2xl border border-brand-100 bg-brand-50 px-5 sm:px-7 py-5 sm:py-6 flex flex-col sm:flex-row items-start sm:items-center gap-5 sm:gap-8">

          {/* Avatar */}
          <div className="shrink-0 flex flex-row sm:flex-col items-center gap-3 sm:gap-2 w-full sm:w-auto">
            {mentor.photo ? (
              <img src={mentor.photo} alt={mentor.name}
                className="w-14 h-14 sm:w-16 sm:h-16 rounded-full object-cover object-top shrink-0 ring-2 ring-brand-200" />
            ) : (
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-brand-600 flex items-center justify-center shrink-0 ring-2 ring-brand-200">
                <Star className="w-7 h-7 text-white" />
              </div>
            )}
            <div className="sm:hidden">
              <p className="text-sm font-bold text-gray-900">{mentor.name}</p>
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="inline-flex items-center gap-1.5 bg-brand-100 text-brand-600 text-[10px] font-bold px-2.5 py-0.5 rounded-full mb-2 tracking-widest uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-600 animate-pulse shrink-0" />
              New Mentor
            </div>
            <h2 className="text-gray-900 text-base sm:text-lg font-bold leading-snug mb-3">
              <span className="text-brand-600">{mentor.name}</span> joins SSBCircle as a Mentor
            </h2>

            {/* Specialty badges */}
            <div className="flex items-center gap-2 mb-4 flex-wrap">
              {mentor.specialties.slice(0, 2).map(tag => (
                <span key={tag} className="flex items-center gap-1.5 text-[11px] font-semibold text-brand-700 bg-white border border-brand-100 px-3 py-1.5 rounded-lg">
                  <Shield className="w-3.5 h-3.5 text-brand-500" /> {tag}
                </span>
              ))}
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              {availableFromLabel && (
                <>
                  <span className="flex items-center gap-1.5 text-[11px] text-gray-500 font-medium">
                    <Calendar className="w-3 h-3" /> Appointments open {availableFromLabel}
                  </span>
                  <span className="w-1 h-1 rounded-full bg-gray-300" />
                </>
              )}
              <span className="flex items-center gap-1.5 text-[11px] text-gray-500 font-medium">
                <Shield className="w-3 h-3" /> Verified Officer
              </span>
            </div>
          </div>

          {/* CTA */}
          <div className="shrink-0 flex flex-col items-center gap-1.5 w-full sm:w-auto">
            <Link to={`/mentor/${mentor.slug}`} className="btn-primary text-sm px-5 py-2.5 w-full sm:w-auto text-center whitespace-nowrap flex items-center justify-center gap-2">
              View Profile <ArrowRight className="w-4 h-4" />
            </Link>
            <p className="text-gray-400 text-[10px]">Meet your mentor</p>
          </div>

        </div>
      </div>
    </div>
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
  const [visibleCount,    setVisibleCount]    = useState(PAGE_SIZE);
  const [tab,             setTab]             = useState(() => searchParams.get('tab') === 'upcoming' ? 'upcoming' : 'live');
  const [sessions,        setSessions]        = useState([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [aspirants,       setAspirants]       = useState([]);
  const [pastSessions,    setPastSessions]    = useState([]);

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
    setVisibleCount(PAGE_SIZE);
  }
  function handleSubFilter(sub) {
    setSubFilter(p => p === sub ? '' : sub);
    setVisibleCount(PAGE_SIZE);
  }

  const filteredRooms = rooms.filter(r => {
    if (catFilter !== 'All' && r.category !== catFilter) return false;
    if (subFilter && r.subcategory !== subFilter) return false;
    return true;
  });
  const displayedRooms = filteredRooms.slice(0, visibleCount);
  const hasMore = filteredRooms.length > visibleCount;

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

      {/* ── Navbar ── */}
      <header className="border-b border-gray-100 sticky top-0 z-50 bg-white/95 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-3">
          <Link to="/"><Logo /></Link>

          {/* ── Desktop nav ── */}
          <nav className="hidden sm:flex items-center gap-2">
            <Link to="/current-affairs" className="text-sm text-gray-500 hover:text-gray-900 px-3 py-2 font-medium">News Cards</Link>
            {user ? (
              <>
                <Link to="/profile" className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg hover:bg-gray-50 transition-colors">
                  <Avatar name={user.display_name} avatarUrl={user.avatar_url} />
                  <span className="text-sm text-gray-600 font-medium">{user.display_name}</span>
                </Link>
                <button onClick={() => navigate('/join')} className="btn-secondary py-1.5 px-3 text-xs">Join</button>
                <button onClick={() => navigate('/create')} className="btn-primary py-1.5 px-4 text-sm">Create Room</button>
                <button onClick={logout} className="text-xs text-gray-400 hover:text-gray-600 px-2 cursor-pointer transition-colors">Sign out</button>
              </>
            ) : (
              <>
                <Link to="/login" className="text-sm text-gray-500 hover:text-gray-900 px-3 py-2 font-medium">Sign in</Link>
                <Link to="/register" className="btn-primary py-1.5 px-4 text-sm">Get started</Link>
              </>
            )}
          </nav>

          {/* ── Mobile right: primary action + hamburger ── */}
          <div className="sm:hidden flex items-center gap-2">
            {user ? (
              <button onClick={() => navigate('/create')} className="btn-primary py-1.5 px-3 text-xs">
                + Create
              </button>
            ) : (
              <Link to="/register" className="btn-primary py-1.5 px-3 text-xs">Get started</Link>
            )}
            <button
              onClick={() => setMenuOpen(v => !v)}
              className="flex items-center justify-center w-9 h-9 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 transition-colors cursor-pointer"
              aria-label="Menu"
            >
              {menuOpen ? (
                <X className="w-4 h-4 text-gray-600" />
              ) : (
                <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h9" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* ── Mobile menu panel ── */}
        {menuOpen && (
          <div className="sm:hidden bg-white border-t border-gray-100 shadow-xl">
            <div className="px-4 py-4 flex flex-col gap-1">

              {/* News Cards row */}
              <Link to="/current-affairs"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-brand-50 transition-colors group">
                <div className="w-8 h-8 rounded-lg bg-brand-50 border border-brand-100 flex items-center justify-center shrink-0 group-hover:bg-brand-100 transition-colors">
                  <BookOpen className="w-4 h-4 text-brand-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-800">News Cards</p>
                  <p className="text-[11px] text-gray-400">GD topics · Lecturette prep</p>
                </div>
              </Link>

              <div className="h-px bg-gray-100 my-1" />

              {user ? (
                <>
                  {/* Profile */}
                  <Link to="/profile" onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-gray-50 transition-colors">
                    <Avatar name={user.display_name} avatarUrl={user.avatar_url} />
                    <div>
                      <p className="text-sm font-semibold text-gray-800">{user.display_name}</p>
                      <p className="text-[11px] text-gray-400">View profile</p>
                    </div>
                  </Link>

                  <div className="h-px bg-gray-100 my-1" />

                  {/* Room actions */}
                  <div className="grid grid-cols-2 gap-2 px-1">
                    <button onClick={() => { navigate('/join'); setMenuOpen(false); }}
                      className="btn-secondary text-sm py-2.5 w-full">Join Room</button>
                    <button onClick={() => { navigate('/create'); setMenuOpen(false); }}
                      className="btn-primary text-sm py-2.5 w-full">Create Room</button>
                  </div>

                  <div className="h-px bg-gray-100 my-1" />

                  <button onClick={() => { logout(); setMenuOpen(false); }}
                    className="text-sm text-gray-400 hover:text-gray-600 text-left px-3 py-2.5 cursor-pointer transition-colors">
                    Sign out
                  </button>
                </>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-2 px-1 mt-1">
                    <Link to="/login" onClick={() => setMenuOpen(false)}
                      className="btn-secondary text-sm py-2.5 text-center">Sign in</Link>
                    <Link to="/register" onClick={() => setMenuOpen(false)}
                      className="btn-primary text-sm py-2.5 text-center">Get started</Link>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      <main>

        {/* ── Special Event Banner ── */}
        <MentorAnnouncementBanner />

        {/* ── Hero ── */}
        <section className="border-b border-gray-100 py-10 sm:py-16 lg:py-20 px-4 sm:px-6">
          <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-10 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-6 border border-emerald-100">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                {!loading && rooms.length > 0
                  ? `${rooms.length} discussion${rooms.length > 1 ? 's' : ''} happening right now`
                  : 'Live voice rooms · Join any time'}
              </div>

              <h1 className="text-[2rem] sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-[1.1] tracking-tight mb-3 sm:mb-4">
                Practice SSB GD with<br />
                <span className="text-brand-600">real aspirants.</span>
              </h1>

              {/* News Cards chip */}
              <Link to="/current-affairs"
                className="inline-flex items-center gap-2 text-xs font-semibold text-brand-600 bg-brand-50 border border-brand-100 px-3 py-1.5 rounded-full hover:bg-brand-100 transition-colors mb-4 sm:mb-5 select-none">
                {/* Stacked cards icon */}
                <svg viewBox="0 0 34 24" fill="none" className="w-7 h-5 shrink-0">
                  {/* Back card */}
                  <rect x="1" y="5" width="20" height="14" rx="2.5" fill="#e0e7ff"
                    transform="rotate(-11 11 12)" />
                  {/* Middle card */}
                  <rect x="5" y="3" width="20" height="14" rx="2.5" fill="#eef2ff"
                    transform="rotate(-5 15 10)" />
                  {/* Front card */}
                  <rect x="10" y="2" width="20" height="14" rx="2.5" fill="white"
                    stroke="#c7d2fe" strokeWidth="1.2" />
                  {/* Headline line */}
                  <line x1="13.5" y1="8" x2="27" y2="8"
                    stroke="#1e3a5f" strokeWidth="1.6" strokeLinecap="round" />
                  {/* Body lines */}
                  <line x1="13.5" y1="11.5" x2="25" y2="11.5"
                    stroke="#c7d2fe" strokeWidth="1.3" strokeLinecap="round" />
                  <line x1="13.5" y1="14.5" x2="22" y2="14.5"
                    stroke="#c7d2fe" strokeWidth="1.3" strokeLinecap="round" />
                </svg>
                <span>News Cards</span>
              </Link>

              <p className="text-gray-500 text-sm sm:text-lg leading-relaxed mb-6 sm:mb-8">
                India's free platform for SSB interview preparation. Practice Group Discussion (GD), PPDT, Lecturette and IO online with real defence aspirants — anywhere, anytime.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 mb-8">
                <button onClick={() => navigate(user ? '/create' : '/register')}
                  className="btn-primary text-sm px-7 py-3 w-full sm:w-auto flex items-center justify-center gap-2">
                  {user ? 'Create a Room' : 'Get started free'}
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button onClick={() => navigate(user ? '/join' : '/login')}
                  className="btn-secondary text-sm px-7 py-3 w-full sm:w-auto">
                  Join a Room
                </button>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex -space-x-2">
                  {['A','V','R','S','P'].map((l, i) => (
                    <div key={i} className="w-7 h-7 rounded-full bg-brand-600 border-2 border-white flex items-center justify-center text-[9px] font-bold text-white" style={{ opacity: 1 - i * 0.12 }}>{l}</div>
                  ))}
                </div>
                <p className="text-xs text-gray-500">
                  <span className="font-semibold text-gray-700">100+</span> aspirants joined · <span className="font-semibold text-gray-700">Free</span>
                </p>
              </div>

            </div>

            <div className="hidden lg:flex flex-col justify-center items-center gap-3">
              <Suspense fallback={<div className="w-[340px] h-[360px] bg-gray-50 rounded-2xl animate-pulse" />}>
                <HeroMapAnimation />
              </Suspense>
              <p className="text-xs text-gray-400 font-medium text-center">Connecting aspirants to learn and practice communication skills</p>
            </div>
          </div>
        </section>

        {/* ── Live / Upcoming tabs ── */}
        <section ref={tabsSectionRef} className="max-w-5xl mx-auto px-4 sm:px-6 py-10 sm:py-14">

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

          {/* ── Early Access toggle ── */}
          <div className="mb-6">
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
                      <p className="text-[10px] text-brand-100 uppercase tracking-widest mt-0.5">Live Rooms</p>
                    </div>
                    <div className="flex-1 sm:flex-none bg-white/8 border border-white/10 rounded-xl px-4 py-2.5 text-center">
                      <p className="text-xl font-bold tabular-nums leading-none">{sessionsLoading ? '—' : sessions.length}<span className="text-brand-100 text-sm font-medium">/4</span></p>
                      <p className="text-[10px] text-brand-100 uppercase tracking-widest mt-0.5">Scheduled</p>
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
                    className={`px-2.5 py-1 rounded-full border text-[11px] font-medium transition-all cursor-pointer ${
                      subFilter === sub ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-400 border-gray-200 hover:border-gray-300'
                    }`}>
                    {sub}
                  </button>
                ))}
              </div>
            )}
          </div>

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
                {user ? 'Create a Room' : 'Get started free'}
              </button>
              <p className="text-xs text-gray-400 mt-4">
                No GD topic?{' '}
                <Link to="/current-affairs" className="text-brand-600 font-semibold hover:underline">Browse News Cards →</Link>
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {displayedRooms.map(r => (
                  <RoomCard key={r.id} room={r} user={user} onJoin={handleJoin} onDelete={handleDelete} />
                ))}
              </div>
              {hasMore && (
                <div className="mt-5 text-center">
                  <button onClick={() => setVisibleCount(p => p + PAGE_SIZE)} className="btn-secondary text-xs py-2 px-6">
                    Load more · {filteredRooms.length - visibleCount} remaining
                  </button>
                </div>
              )}
              {!user && (
                <div className="mt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-brand-50 border border-brand-100 rounded-xl px-4 sm:px-5 py-4">
                  <p className="text-sm text-brand-700 font-medium">Sign in to join or create a room</p>
                  <Link to="/register" className="btn-primary text-xs py-2 px-4 shrink-0 w-full sm:w-auto text-center">Join free</Link>
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
        </section>

        {/* ── Host caution notice ── */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 pb-4">
          <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
            <span className="shrink-0 text-base mt-0.5">⚠️</span>
            <p className="text-xs text-amber-800 leading-relaxed">
              <span className="font-bold">Hosts — once your session is over, please delete your room</span> using the <span className="font-semibold">"End & Delete Room"</span> button inside the room. This keeps the platform open for others to practise.
            </p>
          </div>
        </div>

        {/* ── India map — mobile only, below host caution ── */}
        <div className="lg:hidden border-t border-gray-100 py-6 flex flex-col items-center gap-2 bg-white">
          <Suspense fallback={<div className="w-[300px] h-[320px] bg-gray-50 rounded-xl animate-pulse" />}>
            <HeroMapAnimation />
          </Suspense>
          <p className="text-xs text-gray-400 font-medium text-center px-4">Connecting aspirants across India</p>
        </div>

        {/* ── Mentors ── */}
        <MentorsSection />

        {/* ── Ways to serve before the uniform ── */}
        <ContributeSection />

        {/* ── Recent Discussions ── */}
        {pastSessions.length > 0 && (
          <section className="border-t border-gray-100 bg-white py-10 sm:py-14 px-4 sm:px-6">
            <div className="max-w-5xl mx-auto">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Notable Sessions</h2>
                  <p className="text-sm text-gray-400 mt-0.5">Past discussions led by veterans, recommended candidates & domain experts</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {pastSessions.map(s => {
                  const colorClass = CATEGORY_COLORS[s.category] || 'bg-gray-100 text-gray-500 border-gray-200';
                  const initials = s.host_name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?';
                  const dt = new Date(s.created_at);
                  return (
                    <div key={s.room_code} className="bg-white border border-gray-100 rounded-xl p-4 flex flex-col gap-3 hover:border-gray-200 hover:shadow-sm transition-all">
                      <div className="flex items-center justify-between">
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${colorClass}`}>
                          {s.category}
                        </span>
                        <span className="text-[11px] text-gray-300">
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
                        <span className="text-[11px] text-gray-400">by {s.host_name || 'Aspirant'}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* ── News Cards feature showcase ── */}
        <section className="border-t border-gray-100 bg-gray-50 px-4 sm:px-6 py-10 sm:py-14">
          <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center gap-8 sm:gap-12">

            {/* Left: text */}
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold text-brand-600 uppercase tracking-widest mb-3">✦ Latest Addition</p>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 leading-snug mb-3">News Cards</h2>
              <p className="text-sm text-gray-500 leading-relaxed mb-6 max-w-sm">
                No GD topic? Swipe through bite-sized cards on Defence, Economy, Polity, Geography & Society — then walk into any discussion ready to speak.
              </p>
              <div className="flex flex-col gap-2 mb-6">
                {['Read a card in 5 minutes', 'Learn the issue with data & examples', 'Practice speaking it in a live GD room'].map((s, i) => (
                  <div key={i} className="flex items-center gap-2.5 text-sm text-gray-600">
                    <span className="w-5 h-5 rounded-full bg-brand-600 flex items-center justify-center shrink-0">
                      <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </span>
                    {s}
                  </div>
                ))}
              </div>
              <Link to="/current-affairs" className="btn-primary text-sm px-6 py-2.5 inline-flex">
                Explore News Cards
              </Link>
            </div>

            {/* Right: spread cards */}
            <div className="shrink-0">
              <SpreadNewsCards small />
            </div>
          </div>
        </section>

        {/* ── How it works ── */}
        <section className="border-t border-gray-100 bg-white py-10 sm:py-14 px-4 sm:px-6">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">How SSBCircle Works for SSB Prep</h2>
            <p className="text-sm text-gray-400 mb-8">From knowing nothing about a topic to speaking confidently in a live GD — in four steps.</p>
            <div className="relative">
              <div className="hidden sm:block absolute top-[15px] left-[3rem] right-[3rem]"
                style={{ height: '1px', background: 'repeating-linear-gradient(to right,#bfdbfe 0,#bfdbfe 6px,transparent 6px,transparent 14px)' }} />
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-8 sm:gap-5">
                {[
                  {
                    n: '01',
                    title: 'Sign in with Google',
                    desc: 'One tap with your Google account — no password, no forms, no friction.',
                    badge: {
                      label: 'Google',
                      cls: 'text-gray-600 bg-white border-gray-200',
                      icon: (
                        <svg viewBox="0 0 18 18" className="w-3.5 h-3.5 shrink-0">
                          <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/>
                          <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"/>
                          <path fill="#FBBC05" d="M3.964 10.71c-.18-.54-.282-1.117-.282-1.71s.102-1.17.282-1.71V4.958H.957C.347 6.173 0 7.548 0 9s.348 2.827.957 4.042l3.007-2.332z"/>
                          <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z"/>
                        </svg>
                      ),
                    },
                  },
                  {
                    n: '02',
                    title: 'Read a News Card',
                    desc: 'Swipe through a bite-sized card on Defence, Economy, Polity or Geography — 5 minutes, GD-ready.',
                    tag: 'News Cards',
                    tagLink: '/current-affairs',
                  },
                  {
                    n: '03',
                    title: 'Open or join a room',
                    desc: 'Host a session on the topic you just read, or enter a 6-letter code to join one.',
                    badge: {
                      label: 'Live Room',
                      cls: 'text-emerald-700 bg-emerald-50 border-emerald-100',
                      icon: (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5 shrink-0">
                          <rect x="9" y="2" width="6" height="11" rx="3"/>
                          <path d="M5 10a7 7 0 0 0 14 0"/>
                          <line x1="12" y1="19" x2="12" y2="22"/>
                          <line x1="8" y1="22" x2="16" y2="22"/>
                        </svg>
                      ),
                    },
                  },
                  {
                    n: '04',
                    title: 'Practice and improve',
                    desc: 'Use the timer, live transcript and checklist every session to track your growth.',
                    badge: {
                      label: 'Speak Up',
                      cls: 'text-brand-600 bg-brand-50 border-brand-100',
                      icon: (
                        <svg viewBox="0 0 24 24" fill="none" className="w-3.5 h-3.5 shrink-0">
                          <circle cx="8" cy="7" r="3" fill="currentColor" opacity="0.85"/>
                          <path d="M2 21c0-3.314 2.686-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                          <path d="M15 9a3 3 0 0 1 0 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                          <path d="M18.5 6a7 7 0 0 1 0 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.5"/>
                        </svg>
                      ),
                    },
                  },
                ].map(({ n, title, desc, tag, tagLink, badge }) => (
                  <div key={n} className="flex sm:flex-col gap-4 sm:gap-0">
                    <div className="shrink-0 z-10 w-8 h-8 rounded-full bg-brand-600 border-4 border-white ring-2 ring-blue-100 flex items-center justify-center shadow-sm">
                      <span className="text-[10px] font-bold text-white">{n}</span>
                    </div>
                    <div className="sm:mt-5">
                      {tag && (
                        <Link to={tagLink}
                          className="inline-flex items-center gap-1 text-[10px] font-bold text-brand-600 bg-brand-50 border border-brand-100 px-2 py-0.5 rounded-full mb-1.5 hover:bg-brand-100 transition-colors">
                          <svg viewBox="0 0 34 24" fill="none" className="w-5 h-3.5 shrink-0">
                            <rect x="1" y="5" width="20" height="14" rx="2.5" fill="#e0e7ff" transform="rotate(-11 11 12)" />
                            <rect x="5" y="3" width="20" height="14" rx="2.5" fill="#eef2ff" transform="rotate(-5 15 10)" />
                            <rect x="10" y="2" width="20" height="14" rx="2.5" fill="white" stroke="#c7d2fe" strokeWidth="1.2" />
                            <line x1="13.5" y1="8" x2="27" y2="8" stroke="#1e3a5f" strokeWidth="1.6" strokeLinecap="round" />
                            <line x1="13.5" y1="11.5" x2="25" y2="11.5" stroke="#c7d2fe" strokeWidth="1.3" strokeLinecap="round" />
                            <line x1="13.5" y1="14.5" x2="22" y2="14.5" stroke="#c7d2fe" strokeWidth="1.3" strokeLinecap="round" />
                          </svg>
                          {tag}
                        </Link>
                      )}
                      {badge && (
                        <div className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full mb-1.5 border ${badge.cls}`}>
                          {badge.icon}
                          {badge.label}
                        </div>
                      )}
                      <h3 className="text-sm font-bold text-gray-900 mb-1">{title}</h3>
                      <p className="text-xs text-gray-400 leading-relaxed">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── Active Aspirants ── */}
        <section className="border-t border-gray-100 bg-gray-50 py-10 sm:py-14 px-4 sm:px-6">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Active Aspirants</h2>
              <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full">On SSBCircle</span>
            </div>
            <p className="text-sm text-gray-400 mb-6">Students consistently practising and leading sessions on the platform.</p>
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide -mx-1 px-1">
              {(() => {
                const real = aspirants.map((a, i) => ({ ...a, color: AVATAR_COLORS[i % AVATAR_COLORS.length] }));
                const displayed = real.length >= 4 ? real : [...real, ...MOCK_ASPIRANTS.slice(real.length)];
                return displayed.map(a => {
                  const initials = a.display_name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?';
                  return (
                    <div key={a.id} className="shrink-0 flex flex-col items-center gap-2 p-3 bg-white border border-gray-100 rounded-xl w-[72px] hover:border-brand-200 hover:shadow-sm transition-all">
                      {a.avatar_url
                        ? <img src={a.avatar_url} alt={a.display_name} className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm" />
                        : <div className={`w-10 h-10 rounded-full ${a.color || 'bg-brand-600'} flex items-center justify-center text-xs font-bold text-white shadow-sm`}>{initials}</div>
                      }
                      <p className="text-[10px] font-semibold text-gray-700 text-center truncate w-full leading-tight">{a.display_name?.split(' ')[0]}</p>
                      <p className="text-[9px] text-gray-400 tabular-nums">{a.rooms_hosted} {a.rooms_hosted === 1 ? 'room' : 'rooms'}</p>
                    </div>
                  );
                });
              })()}
            </div>
          </div>
        </section>

        {/* ── Coming to SSBCircle ── */}
        <section className="border-t border-gray-100 bg-white py-10 sm:py-14 px-4 sm:px-6">
          <div className="max-w-5xl mx-auto">
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-1">
                <Lock className="w-4 h-4 text-brand-600" />
                <span className="text-xs font-bold uppercase tracking-widest text-brand-600">What's Ahead</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Coming to SSBCircle</h2>
              <p className="text-sm text-gray-400 mt-1">Built in the open — you shape what we build next.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="relative rounded-2xl border border-brand-100 bg-brand-50 p-5 overflow-hidden">
                <div className="absolute top-3 right-3 text-[10px] font-bold uppercase tracking-widest text-brand-600 bg-brand-100 px-2.5 py-0.5 rounded-full">Coming Soon</div>
                <div className="w-10 h-10 rounded-xl bg-brand-600 flex items-center justify-center mb-3">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-sm font-bold text-gray-900 mb-1">Sessions with Veterans & Ex-Servicemen</h3>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Live guided sessions hosted by SSB-recommended aspirants and ex-servicemen. Get real feedback on your GD performance, body language, and communication style from those who have cleared the board themselves.
                </p>
                <p className="text-[11px] text-brand-600 font-semibold mt-3">Invite-only · Limited seats per session</p>
              </div>
              <div className="relative rounded-2xl border border-gray-200 bg-gray-50 p-5 overflow-hidden">
                <div className="absolute top-3 right-3 text-[10px] font-bold uppercase tracking-widest text-gray-400 bg-gray-100 px-2.5 py-0.5 rounded-full">Planned</div>
                <div className="w-10 h-10 rounded-xl bg-gray-200 flex items-center justify-center mb-3">
                  <Star className="w-5 h-5 text-gray-500" />
                </div>
                <h3 className="text-sm font-bold text-gray-900 mb-1">Peer Assessment & Ratings</h3>
                <p className="text-xs text-gray-500 leading-relaxed">
                  After each session, rate your peers on communication, leadership, and participation. Build a performance profile that speaks louder than words on your SSB prep journey.
                </p>
                <p className="text-[11px] text-gray-400 font-semibold mt-3">Anonymous · Merit-based</p>
              </div>
            </div>
          </div>
        </section>

      </main>

      {/* ── SSB FAQ Section ── */}
      <FaqSection />

      <footer className="border-t border-gray-100 py-8 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Logo />
          <p className="text-xs text-gray-300">© {new Date().getFullYear()} SSBCircle</p>
        </div>
      </footer>
    </div>
  );
}
