import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Radio, FolderOpen, CalendarDays, Trash2, LogOut, RefreshCw, Calendar, Bell, PlayCircle, Ban, ShieldCheck } from 'lucide-react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:4000';

function authHeaders() {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${sessionStorage.getItem('sa_token')}`,
  };
}

function timeAgo(dateStr) {
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function fmtDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    + ' · ' + d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

const CATEGORY_COLORS = {
  GD:            'bg-blue-50 text-blue-700',
  PPDT:          'bg-purple-50 text-purple-700',
  Lecturette:    'bg-orange-50 text-orange-700',
  'IO Practice': 'bg-emerald-50 text-emerald-700',
};

function sessionStatus(s) {
  if (!s.is_active)  return { label: 'Cancelled', cls: 'bg-red-50 text-red-500' };
  if (s.room_code)   return { label: 'Live',       cls: 'bg-emerald-50 text-emerald-700' };
  if (new Date(s.scheduled_at) < new Date()) return { label: 'Expired', cls: 'bg-gray-100 text-gray-400' };
  return { label: 'Upcoming', cls: 'bg-blue-50 text-blue-700' };
}

export default function SuperAdminDashboard() {
  const navigate = useNavigate();
  const [stats,    setStats]    = useState(null);
  const [rooms,    setRooms]    = useState([]);
  const [users,    setUsers]    = useState([]);
  const [sessions, setSessions] = useState([]);
  const [tab,      setTab]      = useState('rooms');
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState('');

  async function fetchAll() {
    setLoading(true); setError('');
    try {
      const [sRes, rRes, uRes, ssRes] = await Promise.all([
        fetch(`${API}/api/admin/stats`,    { headers: authHeaders() }),
        fetch(`${API}/api/admin/rooms`,    { headers: authHeaders() }),
        fetch(`${API}/api/admin/users`,    { headers: authHeaders() }),
        fetch(`${API}/api/admin/sessions`, { headers: authHeaders() }),
      ]);
      if (sRes.status === 401 || sRes.status === 403) {
        sessionStorage.removeItem('sa_token'); navigate('/sa'); return;
      }
      const [s, r, u, ss] = await Promise.all([sRes.json(), rRes.json(), uRes.json(), ssRes.json()]);
      setStats(s);
      setRooms(r.rooms || []);
      setUsers(u.users || []);
      setSessions(ss.sessions || []);
    } catch {
      setError('Failed to load data. Check your connection.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!sessionStorage.getItem('sa_token')) { navigate('/sa'); return; }
    fetchAll();
  }, []);

  async function handleCloseRoom(code) {
    if (!window.confirm(`Close room ${code}?`)) return;
    await fetch(`${API}/api/admin/rooms/${code}`, { method: 'DELETE', headers: authHeaders() });
    setRooms(p => p.map(r => r.room_code === code ? { ...r, is_active: false } : r));
  }

  async function handleCancelSession(id, topic) {
    if (!window.confirm(`Cancel session "${topic}"?`)) return;
    await fetch(`${API}/api/admin/sessions/${id}`, { method: 'DELETE', headers: authHeaders() });
    setSessions(p => p.map(s => s.id === id ? { ...s, is_active: false } : s));
  }

  async function handleBan(id, name, banned) {
    const action = banned ? 'unban' : 'ban';
    if (!window.confirm(`${banned ? 'Unban' : 'Ban'} ${name}?`)) return;
    await fetch(`${API}/api/admin/users/${id}/${action}`, { method: 'POST', headers: authHeaders() });
    setUsers(p => p.map(u => u.id === id ? { ...u, is_banned: !banned } : u));
    if (!banned) setRooms(p => p.map(r => r.created_by === id ? { ...r, is_active: false } : r));
  }

  function handleLogout() {
    sessionStorage.removeItem('sa_token');
    navigate('/sa');
  }

  const TABS = [
    { id: 'rooms',    label: 'Rooms',    count: rooms.length },
    { id: 'sessions', label: 'Sessions', count: sessions.length },
    { id: 'users',    label: 'Users',    count: users.length },
  ];

  const STAT_CARDS = [
    { label: 'Total Users',       value: stats?.totalUsers,       icon: Users,       color: 'text-blue-600 bg-blue-50' },
    { label: 'Active Rooms',      value: stats?.activeRooms,      icon: Radio,       color: 'text-emerald-600 bg-emerald-50' },
    { label: 'Upcoming Sessions', value: stats?.upcomingSessions, icon: Calendar,    color: 'text-brand-600 bg-brand-50' },
    { label: 'Rooms Today',       value: stats?.todayRooms,       icon: CalendarDays, color: 'text-orange-600 bg-orange-50' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 sm:px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <svg viewBox="0 0 48 48" fill="none" className="w-6 h-6 shrink-0">
            <circle cx="24" cy="24" r="22" stroke="#1e3a5f" strokeWidth="3"/>
            <circle cx="14" cy="20" r="3.5" fill="#1e3a5f"/>
            <circle cx="24" cy="14" r="3.5" fill="#1e3a5f"/>
            <circle cx="34" cy="20" r="3.5" fill="#1e3a5f"/>
            <circle cx="30" cy="31" r="3.5" fill="#1e3a5f"/>
            <circle cx="18" cy="31" r="3.5" fill="#1e3a5f"/>
            <path d="M14 20 L24 14 L34 20 L30 31 L18 31 Z" stroke="#1e3a5f" strokeWidth="1.5" fill="none"/>
          </svg>
          <span className="font-bold text-gray-900 text-sm">SSBCircle</span>
          <span className="text-[10px] font-semibold text-brand-600 bg-brand-50 border border-brand-100 px-2 py-0.5 rounded-full uppercase tracking-widest">Super Admin</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchAll} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer">
            <RefreshCw className="w-4 h-4"/>
          </button>
          <button onClick={handleLogout} className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-red-500 transition-colors cursor-pointer px-2 py-1.5">
            <LogOut className="w-3.5 h-3.5"/> Sign out
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {error && (
          <div className="mb-6 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-4 py-3">{error}</div>
        )}

        {/* Stat cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-8">
          {STAT_CARDS.map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="bg-white border border-gray-200 rounded-xl p-4">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-3 ${color}`}>
                <Icon className="w-4 h-4"/>
              </div>
              <p className="text-2xl font-bold text-gray-900 tabular-nums">
                {loading ? '—' : (value ?? 0)}
              </p>
              <p className="text-xs text-gray-400 mt-0.5 font-medium">{label}</p>
            </div>
          ))}
        </div>

        {/* Tab nav */}
        <div className="flex gap-1 mb-4 border-b border-gray-200">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`px-4 py-2 text-sm font-semibold border-b-2 transition-all cursor-pointer -mb-px ${
                tab === t.id ? 'text-brand-600 border-brand-600' : 'text-gray-400 border-transparent hover:text-gray-600'
              }`}>
              {t.label}
              <span className="ml-1.5 text-[10px] font-medium text-gray-400">{t.count}</span>
            </button>
          ))}
        </div>

        {/* ── Rooms ── */}
        {tab === 'rooms' && (
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50 text-left">
                    <th className="px-4 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Room</th>
                    <th className="px-4 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wide hidden sm:table-cell">Category</th>
                    <th className="px-4 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wide hidden sm:table-cell">Host</th>
                    <th className="px-4 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                    <th className="px-4 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wide hidden sm:table-cell">Created</th>
                    <th className="px-4 py-3"/>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {loading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i} className="animate-pulse">
                        <td className="px-4 py-3"><div className="h-4 bg-gray-100 rounded w-40"/></td>
                        <td className="px-4 py-3 hidden sm:table-cell"><div className="h-4 bg-gray-100 rounded w-20"/></td>
                        <td className="px-4 py-3 hidden sm:table-cell"><div className="h-4 bg-gray-100 rounded w-24"/></td>
                        <td className="px-4 py-3"><div className="h-4 bg-gray-100 rounded w-16"/></td>
                        <td className="px-4 py-3 hidden sm:table-cell"><div className="h-4 bg-gray-100 rounded w-16"/></td>
                        <td className="px-4 py-3"/>
                      </tr>
                    ))
                  ) : rooms.map(r => (
                    <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900 truncate max-w-[180px]">{r.topic}</p>
                        <p className="text-[11px] font-mono text-gray-400 mt-0.5">{r.room_code}</p>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        {r.category && (
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${CATEGORY_COLORS[r.category] || 'bg-gray-100 text-gray-500'}`}>
                            {r.category}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <p className="text-xs text-gray-700">{r.host || '—'}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                          r.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-400'
                        }`}>
                          {r.is_active && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"/>}
                          {r.is_active ? 'Active' : 'Closed'}
                        </span>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell text-xs text-gray-400">{timeAgo(r.created_at)}</td>
                      <td className="px-4 py-3 text-right">
                        {r.is_active && (
                          <button onClick={() => handleCloseRoom(r.room_code)}
                            className="p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors cursor-pointer">
                            <Trash2 className="w-3.5 h-3.5"/>
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!loading && rooms.length === 0 && (
                <p className="text-sm text-gray-400 text-center py-10">No rooms yet</p>
              )}
            </div>
          </div>
        )}

        {/* ── Sessions ── */}
        {tab === 'sessions' && (
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50 text-left">
                    <th className="px-4 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Session</th>
                    <th className="px-4 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wide hidden sm:table-cell">Category</th>
                    <th className="px-4 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Host</th>
                    <th className="px-4 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wide hidden sm:table-cell">Scheduled</th>
                    <th className="px-4 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                    <th className="px-4 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wide hidden sm:table-cell">Interested</th>
                    <th className="px-4 py-3"/>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {loading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i} className="animate-pulse">
                        <td className="px-4 py-3"><div className="h-4 bg-gray-100 rounded w-40"/></td>
                        <td className="px-4 py-3 hidden sm:table-cell"><div className="h-4 bg-gray-100 rounded w-16"/></td>
                        <td className="px-4 py-3 hidden md:table-cell"><div className="h-4 bg-gray-100 rounded w-24"/></td>
                        <td className="px-4 py-3 hidden sm:table-cell"><div className="h-4 bg-gray-100 rounded w-28"/></td>
                        <td className="px-4 py-3"><div className="h-4 bg-gray-100 rounded w-16"/></td>
                        <td className="px-4 py-3 hidden sm:table-cell"><div className="h-4 bg-gray-100 rounded w-8"/></td>
                        <td className="px-4 py-3"/>
                      </tr>
                    ))
                  ) : sessions.map(s => {
                    const { label, cls } = sessionStatus(s);
                    const canCancel = s.is_active && !s.room_code;
                    return (
                      <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3">
                          <p className="font-medium text-gray-900 truncate max-w-[180px]">{s.topic}</p>
                          {s.room_code && (
                            <p className="text-[11px] font-mono text-emerald-600 mt-0.5 flex items-center gap-1">
                              <PlayCircle className="w-3 h-3"/> {s.room_code}
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-3 hidden sm:table-cell">
                          {s.category && (
                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${CATEGORY_COLORS[s.category] || 'bg-gray-100 text-gray-500'}`}>
                              {s.category}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          <p className="text-xs text-gray-700">{s.host_display_name || '—'}</p>
                          {s.host_email && <p className="text-[10px] text-gray-400">{s.host_email}</p>}
                        </td>
                        <td className="px-4 py-3 hidden sm:table-cell text-xs text-gray-600">{fmtDate(s.scheduled_at)}</td>
                        <td className="px-4 py-3">
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${cls}`}>
                            {label}
                          </span>
                          {s.reminder_sent && (
                            <Bell className="w-3 h-3 text-gray-300 inline ml-1.5" title="Reminder sent"/>
                          )}
                        </td>
                        <td className="px-4 py-3 hidden sm:table-cell text-xs text-gray-500 tabular-nums">
                          {s.interest_count}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {canCancel && (
                            <button onClick={() => handleCancelSession(s.id, s.topic)}
                              className="p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors cursor-pointer">
                              <Trash2 className="w-3.5 h-3.5"/>
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {!loading && sessions.length === 0 && (
                <p className="text-sm text-gray-400 text-center py-10">No sessions yet</p>
              )}
            </div>
          </div>
        )}

        {/* ── Users ── */}
        {tab === 'users' && (
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50 text-left">
                    <th className="px-4 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wide">User</th>
                    <th className="px-4 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wide hidden sm:table-cell">Email</th>
                    <th className="px-4 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wide hidden sm:table-cell">Joined</th>
                    <th className="px-4 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                    <th className="px-4 py-3"/>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {loading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i} className="animate-pulse">
                        <td className="px-4 py-3"><div className="h-4 bg-gray-100 rounded w-32"/></td>
                        <td className="px-4 py-3 hidden sm:table-cell"><div className="h-4 bg-gray-100 rounded w-40"/></td>
                        <td className="px-4 py-3 hidden sm:table-cell"><div className="h-4 bg-gray-100 rounded w-16"/></td>
                        <td className="px-4 py-3"><div className="h-4 bg-gray-100 rounded w-14"/></td>
                        <td className="px-4 py-3"/>
                      </tr>
                    ))
                  ) : users.map(u => (
                    <tr key={u.id} className={`hover:bg-gray-50 transition-colors ${u.is_banned ? 'opacity-60' : ''}`}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          {u.avatar_url ? (
                            <img src={u.avatar_url} alt={u.display_name} className="w-7 h-7 rounded-full object-cover shrink-0"/>
                          ) : (
                            <div className="w-7 h-7 rounded-full bg-brand-600 flex items-center justify-center text-[10px] font-bold text-white shrink-0">
                              {u.display_name?.split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase() || '?'}
                            </div>
                          )}
                          <div>
                            <p className="font-medium text-gray-900 text-sm">{u.display_name}</p>
                            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-700">Google</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell text-xs text-gray-500">{u.email || '—'}</td>
                      <td className="px-4 py-3 hidden sm:table-cell text-xs text-gray-400">{timeAgo(u.created_at)}</td>
                      <td className="px-4 py-3">
                        {u.is_banned
                          ? <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-red-50 text-red-500">Banned</span>
                          : <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">Active</span>
                        }
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button onClick={() => handleBan(u.id, u.display_name, u.is_banned)}
                          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${u.is_banned ? 'text-gray-300 hover:text-emerald-600 hover:bg-emerald-50' : 'text-gray-300 hover:text-red-500 hover:bg-red-50'}`}
                          title={u.is_banned ? 'Unban user' : 'Ban user'}>
                          {u.is_banned ? <ShieldCheck className="w-3.5 h-3.5"/> : <Ban className="w-3.5 h-3.5"/>}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!loading && users.length === 0 && (
                <p className="text-sm text-gray-400 text-center py-10">No users yet</p>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
