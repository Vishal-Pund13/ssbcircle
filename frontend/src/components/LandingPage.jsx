import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getActiveRooms, closeRoom } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Mic, Timer, FileText, CheckSquare, Radio, ArrowRight, Trash2, Zap } from 'lucide-react';
import HeroMapAnimation from './HeroMapAnimation';

const CATEGORIES = ['All', 'GD', 'PPDT', 'Lecturette', 'IO Practice'];
const GD_SUBCATEGORIES = ['Defence', 'International Relations', 'Society', 'Economy', 'Science & Tech', 'Environment', 'Sports & Awards'];
const PAGE_SIZE = 6;

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
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="text-[11px] font-mono font-semibold text-gray-400 tracking-widest">{room.room_code}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-gray-300">{timeAgo(room.created_at)}</span>
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

        {room.admin_display_name && (
          <p className="text-xs text-gray-400">
            {isCreator
              ? <span className="text-brand-600 font-medium">You · Host</span>
              : <>by <span className="text-gray-600 font-medium">{room.admin_display_name}</span></>}
          </p>
        )}

        <button
          onClick={() => onJoin(room.room_code)}
          className="w-full flex items-center justify-center gap-1.5 bg-white hover:bg-brand-50 text-brand-600 border border-brand-600 text-xs font-semibold py-2.5 rounded-lg transition-colors cursor-pointer"
        >
          <Mic className="w-3.5 h-3.5" />
          {user ? 'Join Room' : 'Sign in to Join'}
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

export default function LandingPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [rooms,       setRooms]       = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [catFilter,   setCatFilter]   = useState('All');
  const [subFilter,   setSubFilter]   = useState('');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  async function fetchRooms() {
    try { setRooms(await getActiveRooms()); }
    catch { /* non-critical */ }
    finally { setLoading(false); }
  }

  useEffect(() => {
    fetchRooms();
    const t = setInterval(fetchRooms, 15000);
    return () => clearInterval(t);
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
        <section className="border-b border-gray-100 py-12 sm:py-20 px-4 sm:px-6">
          <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
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

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-[1.1] tracking-tight mb-5">
                Practice GD with<br />
                <span className="text-brand-600">real aspirants.</span>
              </h1>
              <p className="text-gray-500 text-base sm:text-lg leading-relaxed mb-8">
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

            <div className="hidden lg:flex justify-center items-center">
              <HeroMapAnimation />
            </div>
          </div>
        </section>

        {/* ── Live Rooms ── */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
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
            <button onClick={() => { setLoading(true); fetchRooms(); }}
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
        </section>

        {/* ── India map — mobile only, below live rooms ── */}
        <div className="lg:hidden border-t border-gray-100 py-6 flex justify-center bg-white">
          <HeroMapAnimation />
        </div>

        {/* ── What SSBCircle gives you ── */}
        <section className="border-t border-gray-100 bg-gray-50 py-10 sm:py-14 px-4 sm:px-6">
          <div className="max-w-5xl mx-auto">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {[
                { Icon: Mic,         title: 'Real voice rooms',       desc: 'Live audio with everyone in the session. No bots, no recordings — just real practice with real aspirants.' },
                { Icon: Timer,       title: 'GD timer + transcript',  desc: 'Built-in timer mirrors actual SSB duration. Live transcript captures every word so you can review your performance.' },
                { Icon: CheckSquare, title: 'SSB self-evaluation',    desc: 'Post-session checklist covering initiation, group harmony and summarisation — the same parameters the board assesses.' },
              ].map(({ Icon, title, desc }) => (
                <div key={title} className="flex gap-4">
                  <div className="shrink-0 w-9 h-9 rounded-xl bg-white border border-gray-200 flex items-center justify-center shadow-sm mt-0.5">
                    <Icon className="w-4 h-4 text-brand-600" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-gray-900 mb-1">{title}</h3>
                    <p className="text-xs text-gray-400 leading-relaxed">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── 3 steps ── */}
        <section className="border-t border-gray-100 bg-white py-10 sm:py-14 px-4 sm:px-6">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-lg font-bold text-gray-900 mb-8">How it works</h2>
            <div className="relative">
              <div className="hidden sm:block absolute top-[15px] left-[3rem] right-[3rem]"
                style={{ height: '1px', background: 'repeating-linear-gradient(to right,#bfdbfe 0,#bfdbfe 6px,transparent 6px,transparent 14px)' }} />
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 sm:gap-6">
                {[
                  { n: '01', title: 'Create a free account', desc: 'Sign up in 30 seconds. No credit card required.' },
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
