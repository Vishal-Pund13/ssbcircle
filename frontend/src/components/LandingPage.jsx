import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getActiveRooms, closeRoom } from '../services/api';
import { useAuth } from '../context/AuthContext';

function CircleIcon({ className = 'w-7 h-7' }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" className={className}>
      <circle cx="24" cy="24" r="22" stroke="#facc15" strokeWidth="3" />
      <circle cx="14" cy="20" r="3.5" fill="#facc15" />
      <circle cx="24" cy="14" r="3.5" fill="#facc15" />
      <circle cx="34" cy="20" r="3.5" fill="#facc15" />
      <circle cx="30" cy="31" r="3.5" fill="#facc15" />
      <circle cx="18" cy="31" r="3.5" fill="#facc15" />
      <path d="M14 20 L24 14 L34 20 L30 31 L18 31 Z" stroke="#facc15" strokeWidth="1.5" fill="none" />
    </svg>
  );
}

function Avatar({ name, avatarUrl }) {
  const initials = name?.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2) || '?';
  if (avatarUrl) return <img src={avatarUrl} alt={name} className="w-8 h-8 rounded-full object-cover" />;
  return (
    <div className="w-8 h-8 rounded-full bg-primary-400 flex items-center justify-center text-xs font-bold text-black shrink-0">
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

function TrashIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  );
}

function RoomCard({ room, user, onJoin, onDelete }) {
  const [deleting, setDeleting] = useState(false);
  const isCreator = user && room.created_by === user.id;

  async function handleDelete(e) {
    e.stopPropagation();
    if (!window.confirm('Close this room? All participants will be disconnected.')) return;
    setDeleting(true);
    try { await onDelete(room.room_code); }
    finally { setDeleting(false); }
  }

  return (
    <div className="bg-[#1a1a1a] border border-white/8 rounded-2xl p-5 flex flex-col gap-4 hover:border-white/20 transition-colors">
      {/* Top row: live dot + code + time */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
          <span className="text-emerald-400 text-[11px] font-bold tracking-widest font-mono">{room.room_code}</span>
        </div>
        <span className="text-white/25 text-xs">{timeAgo(room.created_at)}</span>
      </div>

      {/* Topic */}
      <p className="text-white font-semibold text-sm leading-snug line-clamp-2 flex-1">
        {room.topic}
      </p>

      {/* Host */}
      {room.admin_display_name && (
        <p className="text-white/35 text-xs">
          {isCreator
            ? <span className="text-primary-400 font-semibold">You · Admin</span>
            : <>by <span className="text-white/60">{room.admin_display_name}</span></>}
        </p>
      )}

      {/* Actions */}
      <div className="flex gap-2 pt-1">
        <button
          onClick={() => onJoin(room.room_code)}
          className="flex-1 bg-primary-400 hover:bg-primary-300 active:bg-primary-500 text-black text-sm font-bold py-2.5 rounded-xl transition-colors cursor-pointer"
        >
          Join Room
        </button>
        {isCreator && (
          <button
            onClick={handleDelete}
            disabled={deleting}
            title="Close room"
            className="px-3 text-white/25 hover:text-red-400 hover:bg-red-500/10 rounded-xl border border-white/8 hover:border-red-500/20 transition-all disabled:opacity-40 cursor-pointer"
          >
            <TrashIcon />
          </button>
        )}
      </div>
    </div>
  );
}

function RoomCardSkeleton() {
  return (
    <div className="bg-[#1a1a1a] border border-white/8 rounded-2xl p-5 animate-pulse">
      <div className="flex items-center justify-between mb-4">
        <div className="h-3 bg-white/10 rounded w-20" />
        <div className="h-3 bg-white/10 rounded w-12" />
      </div>
      <div className="h-4 bg-white/10 rounded w-3/4 mb-2" />
      <div className="h-3 bg-white/10 rounded w-1/2 mb-5" />
      <div className="h-10 bg-white/10 rounded-xl" />
    </div>
  );
}

export default function LandingPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [rooms, setRooms] = useState([]);
  const [loadingRooms, setLoadingRooms] = useState(true);

  async function fetchRooms() {
    try {
      const data = await getActiveRooms();
      setRooms(data);
    } catch { /* non-critical */ }
    finally { setLoadingRooms(false); }
  }

  useEffect(() => {
    fetchRooms();
    const interval = setInterval(fetchRooms, 15000);
    return () => clearInterval(interval);
  }, []);

  function handleJoin(code) {
    if (!user) { navigate('/login'); return; }
    navigate(`/room/${code}`);
  }

  async function handleDelete(code) {
    try {
      await closeRoom(code);
      setRooms((prev) => prev.filter((r) => r.room_code !== code));
    } catch (err) {
      alert(err.message);
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#0f0f0f]">

      {/* ── Navbar ── */}
      <header className="sticky top-0 z-50 bg-[#0f0f0f]/90 backdrop-blur border-b border-white/8">
        <div className="max-w-5xl mx-auto px-5 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <CircleIcon />
            <span className="text-white font-extrabold text-base tracking-tight">SSBCircle</span>
          </Link>

          <nav className="flex items-center gap-2">
            {user ? (
              <>
                <Link
                  to="/profile"
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-white/5 transition-colors"
                >
                  <Avatar name={user.display_name} avatarUrl={user.avatar_url} />
                  <span className="text-sm text-white/70 hidden sm:block">{user.display_name}</span>
                </Link>
                <button
                  onClick={logout}
                  className="text-xs text-white/30 hover:text-white/60 px-3 py-1.5 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
                >
                  Sign out
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-sm text-white/60 hover:text-white px-4 py-2 rounded-lg hover:bg-white/5 transition-colors font-medium"
                >
                  Sign in
                </Link>
                <Link
                  to="/register"
                  className="text-sm bg-primary-400 hover:bg-primary-300 text-black font-bold px-4 py-2 rounded-lg transition-colors cursor-pointer"
                >
                  Join free
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      <main className="flex-1">

        {/* ── Hero ── */}
        <section className="max-w-5xl mx-auto px-5 pt-16 pb-14">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 text-white/50 text-xs font-medium px-3 py-1.5 rounded-full mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Free · No setup · Voice only
            </div>
            <h1 className="text-5xl sm:text-6xl font-black text-white leading-tight mb-5 tracking-tight">
              Practice GD<br />
              <span className="text-primary-400">Together.</span>
            </h1>
            <p className="text-white/45 text-lg mb-8 leading-relaxed max-w-md">
              Create a voice room, share the code, and practice SSB group discussions with timer, transcript and evaluation tools.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => navigate(user ? '/create' : '/register')}
                className="bg-primary-400 hover:bg-primary-300 active:scale-95 text-black font-bold text-sm px-6 py-3 rounded-xl transition-all cursor-pointer shadow-lg shadow-primary-400/15"
              >
                {user ? 'Create a Room' : 'Get Started Free'}
              </button>
              <button
                onClick={() => navigate(user ? '/join' : '/login')}
                className="bg-transparent hover:bg-white/5 active:scale-95 text-white font-semibold text-sm px-6 py-3 rounded-xl border border-white/20 hover:border-white/35 transition-all cursor-pointer"
              >
                Join a Room
              </button>
            </div>
          </div>
        </section>

        {/* ── Live Rooms ── */}
        <section className="border-t border-white/8 py-12 px-5">
          <div className="max-w-5xl mx-auto">
            {/* Section header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-bold text-white">Live Rooms</h2>
                {!loadingRooms && rooms.length > 0 && (
                  <span className="bg-emerald-400/10 text-emerald-400 text-xs font-bold px-2.5 py-1 rounded-full border border-emerald-400/20">
                    {rooms.length} live
                  </span>
                )}
              </div>
              <button
                onClick={() => { setLoadingRooms(true); fetchRooms(); }}
                className="flex items-center gap-1.5 text-xs text-white/35 hover:text-white/70 px-3 py-1.5 rounded-lg hover:bg-white/5 transition-all cursor-pointer font-medium"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh
              </button>
            </div>

            {/* Grid */}
            {loadingRooms ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <RoomCardSkeleton /><RoomCardSkeleton /><RoomCardSkeleton />
              </div>
            ) : rooms.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 bg-[#1a1a1a] border border-white/8 rounded-2xl text-center">
                <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-white/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                </div>
                <p className="text-white/60 font-semibold text-sm">No active rooms</p>
                <p className="text-white/25 text-xs mt-1 mb-5">Be the first to start a discussion</p>
                <button
                  onClick={() => navigate(user ? '/create' : '/register')}
                  className="bg-primary-400 hover:bg-primary-300 text-black font-bold text-sm px-5 py-2.5 rounded-xl transition-colors cursor-pointer"
                >
                  Create a Room
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {rooms.map((room) => (
                  <RoomCard
                    key={room.id}
                    room={room}
                    user={user}
                    onJoin={handleJoin}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            )}
          </div>
        </section>

        {/* ── How it works ── */}
        <section className="border-t border-white/8 py-14 px-5">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-lg font-bold text-white mb-8">How it works</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { n: '1', title: 'Create a room', desc: 'Enter a GD topic and get a 6-character room code instantly.' },
                { n: '2', title: 'Share the code', desc: 'Send the code to your peers — they join in one click.' },
                { n: '3', title: 'Discuss & improve', desc: 'Use the timer, transcript and SSB checklist to improve each session.' },
              ].map(({ n, title, desc }) => (
                <div key={n} className="flex gap-4 p-5 bg-[#1a1a1a] border border-white/8 rounded-2xl">
                  <span className="shrink-0 w-7 h-7 rounded-lg bg-primary-400/15 text-primary-400 text-sm font-black flex items-center justify-center border border-primary-400/20">
                    {n}
                  </span>
                  <div>
                    <h3 className="text-white font-semibold text-sm mb-1">{title}</h3>
                    <p className="text-white/35 text-xs leading-relaxed">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

      </main>

      <footer className="border-t border-white/8 py-5 px-5">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CircleIcon className="w-5 h-5" />
            <span className="text-white/30 text-sm font-semibold">SSBCircle</span>
          </div>
          <p className="text-white/20 text-xs">© {new Date().getFullYear()} · Built for SSB aspirants</p>
        </div>
      </footer>
    </div>
  );
}
