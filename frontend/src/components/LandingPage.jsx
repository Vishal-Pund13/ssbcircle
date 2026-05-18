import { useEffect, useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { getActiveRooms, closeRoom, getSessions, toggleInterest, cancelSession, startSession, getFeatured } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Mic, Timer, FileText, CheckSquare, Radio, ArrowRight, Trash2, Zap, Lightbulb, Users, Presentation, Target, Headphones, RefreshCw, X, Calendar, Heart, PlayCircle, Share2, Check, Sparkles, ChevronDown, Shield, Star, Lock } from 'lucide-react';
import HeroMapAnimation from './HeroMapAnimation';

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
    try { await navigator.share({ title, text, url }); return true; } catch {}
  }
  try { await navigator.clipboard.writeText(url); return 'copied'; } catch {}
  return false;
}

function ShareButton({ title, text, url }) {
  const [done, setDone] = useState(false);
  async function handleShare() {
    const result = await share({ title, text, url });
    if (result) { setDone(true); setTimeout(() => setDone(false), 2000); }
  }
  return (
    <button onClick={handleShare}
      className="p-1.5 rounded-lg text-gray-300 hover:text-brand-600 hover:bg-brand-50 transition-colors cursor-pointer"
      title={done ? 'Link copied!' : 'Share'}>
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
            const isLive = !!s.room_code;
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
                        text={`Join "${s.topic}" (${s.category}) on SSBCircle — ${dt.toLocaleDateString('en-IN', { day:'numeric', month:'short' })} at ${dt.toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit' })}`}
                        url={isLive ? `${window.location.origin}/room/${s.room_code}` : `${window.location.origin}/?tab=upcoming`}
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

export default function LandingPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [searchParams] = useSearchParams();
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

    // Featured aspirants — load once
    getFeatured().then(d => setAspirants(d.aspirants || [])).catch(() => {});

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
      <header className="border-b border-gray-100 sticky top-0 z-50 bg-white/90 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-3">
          <Link to="/"><Logo /></Link>
          <nav className="flex items-center gap-1.5 sm:gap-2">
            {user ? (
              <>
                <Link to="/profile" className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg hover:bg-gray-50 transition-colors">
                  <Avatar name={user.display_name} avatarUrl={user.avatar_url} />
                  <span className="hidden sm:block text-sm text-gray-600 font-medium">{user.display_name}</span>
                </Link>
                <button onClick={() => navigate('/join')} className="hidden sm:flex btn-secondary py-1.5 px-3 text-xs">Join</button>
                <button onClick={() => navigate('/create')} className="btn-primary py-1.5 px-3 text-xs sm:px-4 sm:text-sm">Create Room</button>
                <button onClick={logout} className="text-xs text-gray-400 hover:text-gray-600 px-2 cursor-pointer transition-colors hidden sm:block">Sign out</button>
              </>
            ) : (
              <>
                <Link to="/login" className="text-sm text-gray-500 hover:text-gray-900 px-3 py-2 font-medium hidden sm:block">Sign in</Link>
                <Link to="/login" className="text-sm text-gray-500 hover:text-gray-900 px-2 py-2 font-medium sm:hidden">Sign in</Link>
                <Link to="/register" className="btn-primary py-1.5 px-3 text-xs sm:px-4 sm:text-sm">Get started</Link>
              </>
            )}
          </nav>
        </div>
      </header>

      <main>

        {/* ── Hero ── */}
        <section className="border-b border-gray-100 py-10 sm:py-20 px-4 sm:px-6">
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

              <h1 className="text-[2rem] sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-[1.1] tracking-tight mb-4 sm:mb-5">
                Practice GD with<br />
                <span className="text-brand-600">real aspirants.</span>
              </h1>
              <p className="text-gray-500 text-sm sm:text-lg leading-relaxed mb-6 sm:mb-8">
                Connecting defence aspirants from across India. Practice GD, PPDT, Lecturette and mock interviews — free, together.
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
              <HeroMapAnimation />
              <p className="text-xs text-gray-400 font-medium text-center">Connecting aspirants to learn and practice communication skills</p>
            </div>
          </div>
        </section>

        {/* ── Live / Upcoming tabs ── */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12">

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

        {/* ── India map — mobile only, below live rooms ── */}
        <div className="lg:hidden border-t border-gray-100 py-6 flex flex-col items-center gap-3 bg-white">
          <p className="text-xs text-gray-400 font-medium text-center px-4">Connecting aspirants to learn and practice communication skills</p>
          <HeroMapAnimation />
        </div>

        {/* ── How it works ── */}
        <section className="border-t border-gray-100 bg-white py-10 sm:py-14 px-4 sm:px-6">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-lg font-bold text-gray-900 mb-8">How it works</h2>
            <div className="relative">
              <div className="hidden sm:block absolute top-[15px] left-[3rem] right-[3rem]"
                style={{ height: '1px', background: 'repeating-linear-gradient(to right,#bfdbfe 0,#bfdbfe 6px,transparent 6px,transparent 14px)' }} />
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 sm:gap-6">
                {[
                  { n: '01', title: 'Sign in with Google',   desc: 'One tap with your Google account — no password, no forms, no friction.' },
                  { n: '02', title: 'Open or join a room',   desc: 'Host a session with a topic, or enter a 6-letter code to join one.' },
                  { n: '03', title: 'Practice and improve',  desc: 'Use the timer, transcript and checklist every session to track your growth.' },
                ].map(({ n, title, desc }) => (
                  <div key={n} className="flex sm:flex-col gap-4 sm:gap-0">
                    <div className="shrink-0 z-10 w-8 h-8 rounded-full bg-brand-600 border-4 border-white ring-2 ring-blue-100 flex items-center justify-center shadow-sm">
                      <span className="text-[9px] font-bold text-white">{n}</span>
                    </div>
                    <div className="sm:mt-5">
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

      <footer className="border-t border-gray-100 py-5 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Logo />
          <p className="text-xs text-gray-300">© {new Date().getFullYear()} SSBCircle</p>
        </div>
      </footer>
    </div>
  );
}
