import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getActiveRooms, closeRoom } from '../services/api';
import { useAuth } from '../context/AuthContext';

function CircleIcon({ className = 'w-7 h-7' }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" className={className}>
      <circle cx="24" cy="24" r="22" stroke="#4f46e5" strokeWidth="3" />
      <circle cx="14" cy="20" r="3.5" fill="#4f46e5" />
      <circle cx="24" cy="14" r="3.5" fill="#4f46e5" />
      <circle cx="34" cy="20" r="3.5" fill="#4f46e5" />
      <circle cx="30" cy="31" r="3.5" fill="#4f46e5" />
      <circle cx="18" cy="31" r="3.5" fill="#4f46e5" />
      <path d="M14 20 L24 14 L34 20 L30 31 L18 31 Z" stroke="#4f46e5" strokeWidth="1.5" fill="none" />
    </svg>
  );
}

function Avatar({ name, avatarUrl }) {
  const initials = name?.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2) || '?';
  if (avatarUrl) return <img src={avatarUrl} alt={name} className="w-7 h-7 rounded-full object-cover" />;
  return (
    <div className="w-7 h-7 rounded-full bg-primary-600 flex items-center justify-center text-[10px] font-bold text-white shrink-0">
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
    <div className="bg-white rounded-2xl border border-slate-200 hover:border-primary-300 hover:shadow-md transition-all duration-200 flex flex-col overflow-hidden">
      {/* Blue top bar */}
      <div className="h-1 bg-primary-600" />

      <div className="p-4 flex flex-col gap-3 flex-1">
        {/* Code + time */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            <span className="text-[11px] font-bold tracking-widest text-slate-400 font-mono">{room.room_code}</span>
          </div>
          <span className="text-[11px] text-slate-300">{timeAgo(room.created_at)}</span>
        </div>

        {/* Topic */}
        <p className="text-slate-800 font-semibold text-sm leading-snug line-clamp-2 flex-1">
          {room.topic}
        </p>

        {/* Host */}
        {room.admin_display_name && (
          <div className="flex items-center gap-1.5">
            <Avatar name={room.admin_display_name} />
            <span className="text-xs text-slate-400">
              {isCreator
                ? <span className="text-primary-600 font-semibold">You · Host</span>
                : <><span className="text-slate-500 font-medium">{room.admin_display_name}</span></>}
            </span>
          </div>
        )}

        {/* Join */}
        <div className="flex gap-2 pt-1">
          <button
            onClick={() => onJoin(room.room_code)}
            className="flex-1 bg-primary-600 hover:bg-primary-700 active:bg-primary-800 text-white text-xs font-semibold py-2.5 rounded-xl transition-colors cursor-pointer shadow-sm"
          >
            Join Room →
          </button>
          {isCreator && (
            <button
              onClick={handleDelete}
              disabled={deleting}
              title="Close room"
              className="px-3 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl border border-slate-200 hover:border-red-100 transition-all cursor-pointer disabled:opacity-40"
            >
              <TrashIcon />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function RoomCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden animate-pulse">
      <div className="h-1 bg-slate-200" />
      <div className="p-4 space-y-3">
        <div className="h-3 bg-slate-100 rounded w-20" />
        <div className="h-4 bg-slate-100 rounded w-3/4" />
        <div className="h-3 bg-slate-100 rounded w-1/2" />
        <div className="h-9 bg-slate-100 rounded-xl" />
      </div>
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
    <div className="min-h-screen flex flex-col bg-slate-50">

      {/* ── Navbar ── */}
      <header className="bg-white border-b border-slate-100 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-5 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <CircleIcon />
            <span className="text-primary-600 font-extrabold text-base">SSBCircle</span>
          </Link>
          <nav className="flex items-center gap-2">
            {user ? (
              <>
                <Link to="/profile" className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-slate-50 transition-colors">
                  <Avatar name={user.display_name} avatarUrl={user.avatar_url} />
                  <span className="text-sm text-slate-600 font-medium hidden sm:block">{user.display_name}</span>
                </Link>
                <button onClick={logout} className="text-xs text-slate-400 hover:text-red-500 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors cursor-pointer">
                  Sign out
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="text-sm text-slate-500 hover:text-primary-600 px-4 py-2 rounded-lg transition-colors font-medium">
                  Sign in
                </Link>
                <Link to="/register" className="text-sm bg-primary-600 hover:bg-primary-700 text-white font-semibold px-4 py-2 rounded-xl transition-colors shadow-sm cursor-pointer">
                  Join free
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      <main className="flex-1">

        {/* ── Hero ── */}
        <section className="bg-white border-b border-slate-100">
          <div className="max-w-5xl mx-auto px-5 py-14">
            <div className="max-w-xl">
              <p className="text-primary-600 text-xs font-bold tracking-widest uppercase mb-4">SSB Group Discussion Practice</p>
              <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 leading-tight mb-4 tracking-tight">
                Practice GD<br />with real voice
              </h1>
              <p className="text-slate-500 text-base mb-8 leading-relaxed">
                Create a voice room, invite your peers with a 6-letter code, and practice SSB-style group discussions — with a timer, live transcript, and self-evaluation checklist.
              </p>

              {/* Primary CTA */}
              {user ? (
                <div className="flex gap-3">
                  <button
                    onClick={() => navigate('/create')}
                    className="btn-primary text-sm px-6 py-2.5"
                  >
                    Create a Room
                  </button>
                  <button
                    onClick={() => navigate('/join')}
                    className="btn-secondary text-sm px-6 py-2.5"
                  >
                    Join a Room
                  </button>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => navigate('/register')}
                    className="btn-primary text-sm px-6 py-2.5"
                  >
                    Get started — it's free
                  </button>
                  <button
                    onClick={() => navigate('/login')}
                    className="btn-secondary text-sm px-6 py-2.5"
                  >
                    Sign in
                  </button>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ── How it works (guest guide) ── */}
        {!user && (
          <section className="bg-slate-50 border-b border-slate-100 py-10 px-5">
            <div className="max-w-5xl mx-auto">
              <p className="text-xs font-bold text-slate-400 tracking-widest uppercase mb-5">How it works</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  {
                    n: '1',
                    title: 'Create a free account',
                    desc: 'Sign up in 30 seconds — no email verification, no credit card.',
                    action: 'Register →',
                    to: '/register',
                  },
                  {
                    n: '2',
                    title: 'Create or join a room',
                    desc: 'Enter a GD topic to create a room, or enter a 6-letter code to join one.',
                    action: null,
                  },
                  {
                    n: '3',
                    title: 'Discuss, get scored',
                    desc: 'Use the built-in timer, live transcript and SSB evaluation checklist.',
                    action: null,
                  },
                ].map(({ n, title, desc, action, to }) => (
                  <div key={n} className="bg-white border border-slate-100 rounded-2xl p-5 flex gap-4">
                    <span className="shrink-0 w-7 h-7 rounded-lg bg-primary-50 text-primary-600 text-sm font-extrabold flex items-center justify-center border border-primary-100">
                      {n}
                    </span>
                    <div>
                      <h3 className="text-slate-800 font-semibold text-sm mb-1">{title}</h3>
                      <p className="text-slate-400 text-xs leading-relaxed mb-2">{desc}</p>
                      {action && (
                        <Link to={to} className="text-primary-600 hover:text-primary-700 text-xs font-semibold">
                          {action}
                        </Link>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ── Live Rooms ── */}
        <section className="max-w-5xl mx-auto px-5 py-10">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <h2 className="text-base font-bold text-slate-900">Live Rooms</h2>
              {!loadingRooms && rooms.length > 0 && (
                <span className="bg-emerald-50 text-emerald-600 text-xs font-bold px-2.5 py-1 rounded-full border border-emerald-100">
                  {rooms.length} active
                </span>
              )}
            </div>
            <button
              onClick={() => { setLoadingRooms(true); fetchRooms(); }}
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-primary-600 px-3 py-1.5 rounded-lg hover:bg-primary-50 transition-colors cursor-pointer font-medium"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
          </div>

          {loadingRooms ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <RoomCardSkeleton /><RoomCardSkeleton /><RoomCardSkeleton />
            </div>
          ) : rooms.length === 0 ? (
            <div className="bg-white border border-slate-100 rounded-2xl p-12 text-center">
              <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              </div>
              <p className="text-slate-600 font-semibold text-sm">No active rooms right now</p>
              <p className="text-slate-400 text-xs mt-1 mb-5">Start a discussion and others can join using your room code.</p>
              <button
                onClick={() => navigate(user ? '/create' : '/register')}
                className="btn-primary text-sm px-5 py-2.5"
              >
                {user ? 'Create a Room' : 'Get started free'}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {rooms.map((room) => (
                <RoomCard key={room.id} room={room} user={user} onJoin={handleJoin} onDelete={handleDelete} />
              ))}
            </div>
          )}

          {/* Prompt to create if logged in and rooms exist */}
          {!loadingRooms && rooms.length > 0 && user && (
            <div className="mt-5 flex items-center justify-between bg-primary-50 border border-primary-100 rounded-2xl px-5 py-4">
              <p className="text-sm text-primary-700 font-medium">Want to start your own discussion?</p>
              <button onClick={() => navigate('/create')} className="btn-primary text-sm px-4 py-2">
                Create a Room
              </button>
            </div>
          )}

          {/* Prompt for guests */}
          {!loadingRooms && rooms.length > 0 && !user && (
            <div className="mt-5 flex items-center justify-between bg-slate-100 border border-slate-200 rounded-2xl px-5 py-4">
              <p className="text-sm text-slate-600 font-medium">Sign in to join or create a room.</p>
              <Link to="/register" className="btn-primary text-sm px-4 py-2">
                Get started free
              </Link>
            </div>
          )}
        </section>

      </main>

      <footer className="bg-white border-t border-slate-100 py-5 px-5">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CircleIcon className="w-5 h-5" />
            <span className="text-slate-400 text-sm font-semibold">SSBCircle</span>
          </div>
          <p className="text-slate-300 text-xs">© {new Date().getFullYear()} · Built for SSB aspirants</p>
        </div>
      </footer>
    </div>
  );
}
