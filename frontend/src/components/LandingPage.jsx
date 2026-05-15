import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getActiveRooms, closeRoom } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Mic, Timer, FileText, CheckSquare, Lock, Radio } from 'lucide-react';

function Logo() {
  return (
    <div className="flex items-center gap-2.5">
      <svg viewBox="0 0 48 48" fill="none" className="w-7 h-7">
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
    <div className="w-7 h-7 rounded-full bg-brand-600 flex items-center justify-center text-[10px] font-semibold text-white">
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

  async function handleDelete(e) {
    e.stopPropagation();
    if (!window.confirm('Close this room?')) return;
    setDeleting(true);
    try { await onDelete(room.room_code); }
    finally { setDeleting(false); }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 flex flex-col gap-3 hover:border-gray-300 hover:shadow-sm transition-all">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[11px] font-mono font-medium text-gray-400 tracking-widest">{room.room_code}</span>
        </div>
        <span className="text-xs text-gray-300">{timeAgo(room.created_at)}</span>
      </div>

      <p className="text-sm font-medium text-gray-800 leading-snug line-clamp-2">
        {room.topic}
      </p>

      {room.admin_display_name && (
        <p className="text-xs text-gray-400">
          {isCreator
            ? <span className="text-brand-600 font-medium">You · Host</span>
            : <>by <span className="text-gray-600">{room.admin_display_name}</span></>}
        </p>
      )}

      <div className="flex gap-2 pt-1">
        <button
          onClick={() => onJoin(room.room_code)}
          className="btn-primary flex-1 py-2 text-xs"
        >
          Join Room
        </button>
        {isCreator && (
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="px-3 text-gray-300 hover:text-red-400 border border-gray-200 rounded-lg hover:border-red-200 transition-colors cursor-pointer disabled:opacity-40 text-sm"
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
}

function Skeleton() {
  return (
    <div className="border border-gray-100 rounded-xl p-5 animate-pulse">
      <div className="h-3 bg-gray-100 rounded w-16 mb-3" />
      <div className="h-4 bg-gray-100 rounded w-3/4 mb-2" />
      <div className="h-3 bg-gray-100 rounded w-1/3 mb-4" />
      <div className="h-8 bg-gray-100 rounded-lg" />
    </div>
  );
}

export default function LandingPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);

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

      {/* Nav */}
      <nav className="border-b border-gray-100 sticky top-0 z-50 bg-white/90 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-5 h-14 flex items-center justify-between">
          <Link to="/"><Logo /></Link>
          <div className="flex items-center gap-2">
            {user ? (
              <>
                <Link to="/profile" className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-gray-50 transition-colors text-sm text-gray-600">
                  <Avatar name={user.display_name} avatarUrl={user.avatar_url} />
                  <span className="hidden sm:block font-medium">{user.display_name}</span>
                </Link>
                <button onClick={() => navigate('/join')} className="btn-secondary py-2 px-3.5 text-xs">Join</button>
                <button onClick={() => navigate('/create')} className="btn-primary py-2 px-3.5 text-xs">Create Room</button>
                <button onClick={logout} className="text-xs text-gray-400 hover:text-gray-600 px-2 cursor-pointer transition-colors">Sign out</button>
              </>
            ) : (
              <>
                <Link to="/login" className="text-sm text-gray-500 hover:text-gray-900 px-3 py-2 transition-colors font-medium">Sign in</Link>
                <Link to="/register" className="btn-primary py-2 px-4 text-sm">Get started</Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-5xl mx-auto px-5 pt-20 pb-16">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 bg-brand-50 text-brand-600 text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-600" />
            Free · Voice only · No downloads
          </div>
          <h1 className="text-5xl sm:text-6xl font-bold text-gray-900 leading-[1.08] tracking-tight mb-5">
            Practice GD with<br />
            <span className="text-brand-600">real aspirants.</span>
          </h1>
          <p className="text-gray-500 text-lg leading-relaxed mb-8 max-w-lg">
            Create a voice room, share the code, and practice SSB group discussions — with a live timer, transcript and self-evaluation tools.
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => navigate(user ? '/create' : '/register')}
              className="btn-primary text-sm px-5 py-3"
            >
              {user ? 'Create a Room' : 'Get started free'}
            </button>
            <button
              onClick={() => navigate(user ? '/join' : '/login')}
              className="btn-secondary text-sm px-5 py-3"
            >
              Join a Room
            </button>
          </div>
        </div>
      </section>

      {/* Feature pills */}
      <section className="border-y border-gray-100 bg-gray-50">
        <div className="max-w-5xl mx-auto px-5 py-5 flex flex-wrap gap-4">
          {[
            { icon: Mic,          text: 'Real-time voice rooms' },
            { icon: Timer,        text: 'Built-in GD timer' },
            { icon: FileText,     text: 'Live transcript' },
            { icon: CheckSquare,  text: 'SSB self-evaluation checklist' },
            { icon: Lock,         text: 'Private room codes' },
          ].map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-center gap-2 text-sm text-gray-600 font-medium">
              <Icon className="w-4 h-4 text-brand-600 shrink-0" />
              <span>{text}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Live Rooms */}
      <section className="max-w-5xl mx-auto px-5 py-12">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Live rooms</h2>
            <p className="text-sm text-gray-400 mt-0.5">Jump into an active discussion right now</p>
          </div>
          <div className="flex items-center gap-3">
            {!loading && rooms.length > 0 && (
              <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
                {rooms.length} active
              </span>
            )}
            <button
              onClick={() => { setLoading(true); fetchRooms(); }}
              className="text-xs text-gray-400 hover:text-gray-600 cursor-pointer transition-colors font-medium"
            >
              Refresh
            </button>
          </div>
        </div>

        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Skeleton /><Skeleton /><Skeleton />
          </div>
        ) : rooms.length === 0 ? (
          <div className="border border-dashed border-gray-200 rounded-xl py-16 text-center">
            <Radio className="w-8 h-8 text-gray-300 mx-auto mb-3" />
            <p className="text-sm font-medium text-gray-700 mb-1">No active rooms</p>
            <p className="text-xs text-gray-400 mb-5">Start a discussion and invite your peers with a room code.</p>
            <button
              onClick={() => navigate(user ? '/create' : '/register')}
              className="btn-primary text-xs py-2 px-4"
            >
              Create a Room
            </button>
          </div>
        ) : (
          <>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {rooms.map(r => (
                <RoomCard key={r.id} room={r} user={user} onJoin={handleJoin} onDelete={handleDelete} />
              ))}
            </div>
            <div className="mt-5 flex items-center justify-between bg-brand-50 border border-brand-100 rounded-xl px-5 py-3.5">
              <p className="text-sm text-brand-600 font-medium">
                {user ? 'Start your own discussion?' : 'Sign in to join or create a room.'}
              </p>
              <button
                onClick={() => navigate(user ? '/create' : '/register')}
                className="btn-primary text-xs py-2 px-4"
              >
                {user ? 'Create a Room' : 'Get started free'}
              </button>
            </div>
          </>
        )}
      </section>

      {/* How it works */}
      <section className="border-t border-gray-100 bg-gray-50 py-14 px-5">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-xl font-semibold text-gray-900 mb-8">How it works</h2>
          <div className="grid sm:grid-cols-3 gap-6">
            {[
              { n: '1', title: 'Create a free account', desc: 'Sign up in under 30 seconds. No credit card, no email verification.' },
              { n: '2', title: 'Open or join a room', desc: 'Enter a GD topic to host, or enter a 6-letter code to join someone\'s room.' },
              { n: '3', title: 'Discuss and evaluate', desc: 'Use the timer, live transcript, and SSB checklist to improve every session.' },
            ].map(({ n, title, desc }) => (
              <div key={n} className="flex gap-4">
                <div className="shrink-0 w-7 h-7 rounded-lg bg-brand-600 text-white text-sm font-bold flex items-center justify-center">
                  {n}
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-1">{title}</h3>
                  <p className="text-sm text-gray-400 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-6 px-5">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Logo />
          <p className="text-xs text-gray-300">© {new Date().getFullYear()} SSBCircle · Built for SSB aspirants</p>
        </div>
      </footer>
    </div>
  );
}
