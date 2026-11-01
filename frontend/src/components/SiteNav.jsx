import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FileText, PenLine, CheckSquare, BookOpen, Users, Radio, ChevronDown, X, LogOut, User, Plus, LogIn, CalendarDays, Compass, ShieldCheck, MessageSquareWarning, Signpost } from 'lucide-react';
import PlatformFeedbackDialog from './PlatformFeedbackDialog';

// The site's main navigation, shared by the home page and the prep tools.
//
// Kept to three top-level items so it reads at a glance: the prep tools sit
// together under "Prepare" (one place to start), live practice and the
// community stand on their own. Account actions live in one menu instead of a
// row of buttons competing with the navigation.

export const PREP_TOOLS = [
  { to: '/how-it-works',    icon: Signpost,    title: 'How SSBCircle works', desc: 'What to do first, and every tool explained' },
  { to: '/become-an-officer', icon: Compass,   title: 'Become an officer', desc: 'Army, Navy, Air Force roles and how to join' },
  { to: '/piq',             icon: FileText,    title: 'PIQ Analyzer', desc: 'See what your IO is likely to ask' },
  { to: '/tat',             icon: PenLine,     title: 'TAT Practice', desc: 'Write a story, get feedback' },
  { to: '/prep',            icon: CheckSquare, title: 'Prep Sheet',   desc: 'Every topic and a daily plan' },
  { to: '/current-affairs', icon: BookOpen,    title: 'News Cards',   desc: 'Current affairs for GD and PI' },
  { to: '/exams',           icon: CalendarDays, title: 'Exam Calendar', desc: 'NDA, CDS, AFCAT dates and results' },
];

export function Logo() {
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
  if (avatarUrl && !broken) return <img src={avatarUrl} alt="" referrerPolicy="no-referrer" onError={() => setBroken(true)} className="w-7 h-7 rounded-full object-cover" />;
  return (
    <div className="w-7 h-7 rounded-full bg-brand-600 flex items-center justify-center text-[11px] font-bold text-white shrink-0">
      {initials}
    </div>
  );
}

// Closes a popover on outside click or Escape
function useDismiss(open, close) {
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return;
    const onDown = e => { if (ref.current && !ref.current.contains(e.target)) close(); };
    const onKey  = e => { if (e.key === 'Escape') close(); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey); };
  }, [open, close]);
  return ref;
}

export default function SiteNav() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [prepOpen, setPrepOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const prepRef = useDismiss(prepOpen, () => setPrepOpen(false));
  const userRef = useDismiss(userOpen, () => setUserOpen(false));

  // Close everything when the route changes
  useEffect(() => { setPrepOpen(false); setUserOpen(false); setMenuOpen(false); }, [pathname]);

  const onPrepTool = PREP_TOOLS.some(t => pathname.startsWith(t.to) || (t.to === '/current-affairs' && pathname.startsWith('/article')));

  // On the home page the rooms are a section, so scroll rather than reload
  function goRooms(e) {
    if (pathname === '/') {
      e.preventDefault();
      setMenuOpen(false);
      document.getElementById('rooms')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  const linkCls = active =>
    `text-sm font-medium px-3 py-2 rounded-lg transition-colors ${active ? 'text-gray-900 bg-gray-100' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'}`;

  return (
    <header className="border-b border-gray-100 sticky top-0 z-50 bg-white/95 backdrop-blur-md">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-3">
        <Link to="/" aria-label="SSBCircle home"><Logo /></Link>

        {/* ── Desktop ── */}
        <nav className="hidden md:flex items-center gap-1">
          <div ref={prepRef} className="relative">
            <button onClick={() => setPrepOpen(v => !v)} aria-expanded={prepOpen}
              className={`${linkCls(onPrepTool || prepOpen)} inline-flex items-center gap-1 cursor-pointer`}>
              Prepare <ChevronDown className={`w-3.5 h-3.5 transition-transform ${prepOpen ? 'rotate-180' : ''}`} />
            </button>
            {prepOpen && (
              <div className="absolute left-0 top-full mt-2 w-80 bg-white border border-gray-200 rounded-2xl shadow-xl p-2">
                {PREP_TOOLS.map(({ to, icon: Icon, title, desc }) => (
                  <Link key={to} to={to}
                    className={`flex items-start gap-3 px-3 py-2.5 rounded-xl hover:bg-brand-50 transition-colors group ${pathname.startsWith(to) ? 'bg-gray-50' : ''}`}>
                    <div className="w-8 h-8 rounded-lg bg-brand-50 border border-brand-100 flex items-center justify-center shrink-0 group-hover:bg-white">
                      <Icon className="w-4 h-4 text-brand-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{title}</p>
                      <p className="text-xs text-gray-500">{desc}</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
          <Link to="/?tab=live" onClick={goRooms} className={linkCls(false)}>Live Rooms</Link>
          <Link to="/community" className={linkCls(pathname.startsWith('/community'))}>Community</Link>
        </nav>

        <div className="hidden md:flex items-center gap-2">
          {user ? (
            <div ref={userRef} className="relative">
              <button onClick={() => setUserOpen(v => !v)} aria-expanded={userOpen}
                className="flex items-center gap-2 pl-1.5 pr-2.5 py-1 rounded-full border border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer">
                <Avatar name={user.display_name} avatarUrl={user.avatar_url} />
                <span className="text-sm text-gray-700 font-medium max-w-[120px] truncate">{user.display_name}</span>
                <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
              </button>
              {userOpen && (
                <div className="absolute right-0 top-full mt-2 w-52 bg-white border border-gray-200 rounded-2xl shadow-xl p-1.5 text-sm">
                  <Link to="/profile" className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-gray-50 text-gray-700"><User className="w-4 h-4 text-gray-400" /> Profile</Link>
                  <Link to="/create"  className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-gray-50 text-gray-700"><Plus className="w-4 h-4 text-gray-400" /> Create a room</Link>
                  <Link to="/join"    className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-gray-50 text-gray-700"><LogIn className="w-4 h-4 text-gray-400" /> Join with a code</Link>
                  <div className="h-px bg-gray-100 my-1" />
                  <Link to="/moderators" className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-gray-50 text-gray-700"><ShieldCheck className="w-4 h-4 text-emerald-600" /> Become a moderator</Link>
                  <button onClick={() => { setUserOpen(false); setFeedbackOpen(true); }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-gray-50 text-gray-700 cursor-pointer"><MessageSquareWarning className="w-4 h-4 text-gray-400" /> Report a problem or idea</button>
                  <div className="h-px bg-gray-100 my-1" />
                  <button onClick={() => { logout(); setUserOpen(false); }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-gray-50 text-gray-500 cursor-pointer"><LogOut className="w-4 h-4" /> Sign out</button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link to="/login" className="text-sm text-gray-500 hover:text-gray-900 px-3 py-2 font-medium">Sign in</Link>
              <Link to="/register" className="btn-primary py-1.5 px-4 text-sm">Get started</Link>
            </>
          )}
        </div>

        {/* ── Mobile ── */}
        <div className="md:hidden flex items-center gap-2">
          {!user && <Link to="/register" className="btn-primary py-1.5 px-3 text-xs">Get started</Link>}
          <button onClick={() => setMenuOpen(v => !v)} aria-label="Menu" aria-expanded={menuOpen}
            className="flex items-center justify-center w-9 h-9 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 transition-colors cursor-pointer">
            {menuOpen ? <X className="w-4 h-4 text-gray-600" /> : (
              <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h9" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 shadow-xl max-h-[calc(100vh-3.5rem)] overflow-y-auto">
          <div className="px-4 py-3">
            <p className="px-3 pt-1 pb-1.5 text-[11px] font-bold uppercase tracking-widest text-gray-400">Prepare</p>
            {PREP_TOOLS.map(({ to, icon: Icon, title, desc }) => (
              <Link key={to} to={to} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-brand-50 transition-colors">
                <div className="w-8 h-8 rounded-lg bg-brand-50 border border-brand-100 flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4 text-brand-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-800">{title}</p>
                  <p className="text-[12px] text-gray-400">{desc}</p>
                </div>
              </Link>
            ))}

            <p className="px-3 pt-3 pb-1.5 text-[11px] font-bold uppercase tracking-widest text-gray-400">Practise together</p>
            <Link to="/?tab=live" onClick={goRooms} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-brand-50 transition-colors">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0"><Radio className="w-4 h-4 text-emerald-600" /></div>
              <div><p className="text-sm font-semibold text-gray-800">Live Rooms</p><p className="text-[12px] text-gray-400">GD, PPDT, Lecturette, mock interviews</p></div>
            </Link>
            <Link to="/community" className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-brand-50 transition-colors">
              <div className="w-8 h-8 rounded-lg bg-brand-50 border border-brand-100 flex items-center justify-center shrink-0"><Users className="w-4 h-4 text-brand-600" /></div>
              <div><p className="text-sm font-semibold text-gray-800">Community</p><p className="text-[12px] text-gray-400">Ask doubts, help others</p></div>
            </Link>

            <div className="h-px bg-gray-100 my-3" />
            {user ? (
              <>
                <Link to="/profile" className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50">
                  <Avatar name={user.display_name} avatarUrl={user.avatar_url} />
                  <div><p className="text-sm font-semibold text-gray-800">{user.display_name}</p><p className="text-[12px] text-gray-400">View profile</p></div>
                </Link>
                <div className="grid grid-cols-2 gap-2 px-1 mt-2">
                  <button onClick={() => navigate('/join')} className="btn-secondary text-sm py-2.5 w-full">Join Room</button>
                  <button onClick={() => navigate('/create')} className="btn-primary text-sm py-2.5 w-full">Create Room</button>
                </div>
                <Link to="/moderators" className="mt-2 flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-emerald-50">
                  <ShieldCheck className="w-5 h-5 text-emerald-600" />
                  <div><p className="text-sm font-semibold text-gray-800">Become a moderator</p><p className="text-[12px] text-gray-400">Lead the community, earn a stipend</p></div>
                </Link>
                <button onClick={() => { setMenuOpen(false); setFeedbackOpen(true); }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 text-left cursor-pointer">
                  <MessageSquareWarning className="w-5 h-5 text-gray-400" />
                  <span className="text-sm font-semibold text-gray-800">Report a problem or idea</span>
                </button>
                <button onClick={() => { logout(); setMenuOpen(false); }}
                  className="text-sm text-gray-400 hover:text-gray-600 text-left px-3 py-2.5 mt-1 cursor-pointer">Sign out</button>
              </>
            ) : (
              <div className="grid grid-cols-2 gap-2 px-1">
                <Link to="/login" className="btn-secondary text-sm py-2.5 text-center">Sign in</Link>
                <Link to="/register" className="btn-primary text-sm py-2.5 text-center">Get started</Link>
              </div>
            )}
          </div>
        </div>
      )}
      {feedbackOpen && <PlatformFeedbackDialog onClose={() => setFeedbackOpen(false)} />}
    </header>
  );
}
