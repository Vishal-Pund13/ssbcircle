import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Avatar({ name, size = 'lg' }) {
  const initials = name?.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2) || '?';
  const dim = size === 'lg' ? 'w-20 h-20 text-2xl' : 'w-10 h-10 text-sm';
  return (
    <div className={`${dim} rounded-full bg-primary-600 flex items-center justify-center font-bold text-white shrink-0`}>
      {initials}
    </div>
  );
}

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/');
  }

  if (!user) return null;

  const memberSince = new Date(user.created_at).toLocaleDateString('en-IN', {
    year: 'numeric', month: 'long', day: 'numeric',
  });

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Navbar */}
      <header className="bg-white border-b border-slate-100 px-6 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <Link to="/" className="text-primary-600 font-bold text-lg">SSBCircle</Link>
          <button
            onClick={handleLogout}
            className="text-sm text-slate-500 hover:text-red-500 transition-colors"
          >
            Sign out
          </button>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-10">
        {/* Profile card */}
        <div className="card flex flex-col sm:flex-row items-center sm:items-start gap-6 mb-6">
          <Avatar name={user.display_name} />
          <div className="text-center sm:text-left flex-1">
            <h1 className="text-2xl font-bold text-slate-900">{user.display_name}</h1>
            <p className="text-slate-400 text-sm mt-0.5">@{user.username}</p>
            <p className="text-slate-400 text-xs mt-2">Member since {memberSince}</p>
          </div>
          <button
            onClick={handleLogout}
            className="hidden sm:flex items-center gap-1.5 text-sm text-red-400 hover:text-red-600 border border-red-200 hover:border-red-400 px-4 py-2 rounded-xl transition-colors"
          >
            Sign out
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="card text-center py-5">
            <p className="text-3xl font-extrabold text-primary-600">{user.rooms_created ?? 0}</p>
            <p className="text-sm text-slate-500 mt-1">Rooms Created</p>
          </div>
          <div className="card text-center py-5">
            <p className="text-3xl font-extrabold text-slate-400">—</p>
            <p className="text-sm text-slate-500 mt-1">Followers <span className="text-xs">(soon)</span></p>
          </div>
        </div>

        {/* Quick actions */}
        <div className="flex gap-3">
          <button
            onClick={() => navigate('/create')}
            className="btn-primary flex-1"
          >
            Create a Room
          </button>
          <button
            onClick={() => navigate('/')}
            className="btn-secondary flex-1"
          >
            Browse Rooms
          </button>
        </div>
      </div>
    </div>
  );
}
