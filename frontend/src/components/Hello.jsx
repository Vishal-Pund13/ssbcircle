import { useAuth } from '../context/AuthContext';

// A signed-in aspirant's first name, capitalised ("sid kumar" -> "Sid"), and
// a greeting for the time of day in India. Used across the site so the pages
// speak to the person reading them; signed-out visitors see nothing extra.

export function firstName(user) {
  const n = (user?.display_name || '').trim().split(/\s+/)[0] || '';
  return n ? n[0].toUpperCase() + n.slice(1) : '';
}

export function greeting() {
  const h = Number(new Date().toLocaleString('en-IN', { hour: 'numeric', hour12: false, timeZone: 'Asia/Kolkata' }));
  if (h >= 5 && h < 12) return 'Good morning';
  if (h >= 12 && h < 17) return 'Good afternoon';
  if (h >= 17 && h < 22) return 'Good evening';
  return 'Burning the midnight oil';
}

function Avatar({ user, dark }) {
  if (user.avatar_url) return <img src={user.avatar_url} alt="" className="w-6 h-6 rounded-full object-cover ring-2 ring-white/70" />;
  return (
    <span className={`w-6 h-6 rounded-full text-[11px] font-bold flex items-center justify-center ${dark ? 'bg-white/20 text-white' : 'bg-brand-600 text-white'}`}>
      {firstName(user)[0]}
    </span>
  );
}

// "Good evening, Sid" with their photo, above a page's heading
export default function Hello({ dark = false, className = '' }) {
  const { user } = useAuth();
  if (!user) return null;
  return (
    <p className={`inline-flex items-center gap-2 text-sm ${dark ? 'text-white/90' : 'text-gray-600'} ${className}`}>
      <Avatar user={user} dark={dark} />
      <span>{greeting()}, <span className={`font-semibold ${dark ? 'text-white' : 'text-gray-900'}`}>{firstName(user)}</span></span>
    </p>
  );
}
