import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, LayoutGrid, Radio, Users, User, LogIn, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { PREP_TOOLS } from './SiteNav';
import { trackEvent } from '../analytics';

// Bottom tab bar for phones — most visitors arrive on mobile, and a thumb
// reaches the bottom of the screen far more easily than the menu at the top.
// Hidden from md up, where the top navigation has room for everything.
//
// Full-screen experiences (a live room, the swipe reader, sign-in, admin)
// keep the whole screen for themselves.

const HIDDEN = [/^\/room\//, /^\/read\//, /^\/sa/, /^\/welcome/, /^\/login/, /^\/register/];

export default function MobileTabBar() {
  const { user } = useAuth();
  const { pathname, search } = useLocation();
  const navigate = useNavigate();
  const [prepOpen, setPrepOpen] = useState(false);

  useEffect(() => { setPrepOpen(false); }, [pathname]);
  useEffect(() => {
    if (!prepOpen) return;
    const onKey = e => { if (e.key === 'Escape') setPrepOpen(false); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [prepOpen]);

  if (HIDDEN.some(r => r.test(pathname))) return null;

  const onPrep = PREP_TOOLS.some(t => pathname.startsWith(t.to)) || pathname.startsWith('/article');
  const onLive = pathname === '/' && search.includes('tab=');

  function goLive() {
    trackEvent('tabbar', { tab: 'live' });
    if (pathname === '/') document.getElementById('rooms')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    else navigate('/?tab=live');
  }

  const tabCls = active =>
    `flex-1 flex flex-col items-center justify-center gap-0.5 min-h-[56px] text-[11px] font-semibold cursor-pointer select-none ${active ? 'text-brand-600' : 'text-gray-500'}`;
  const iconCls = active => `w-[22px] h-[22px] ${active ? 'stroke-[2.4]' : ''}`;

  return (
    <>
      {/* Keeps the end of every page clear of the bar */}
      <div className="md:hidden h-16" style={{ marginBottom: 'env(safe-area-inset-bottom)' }} aria-hidden="true" />

      {prepOpen && (
        <div className="md:hidden fixed inset-0 z-[55] bg-black/40" onClick={() => setPrepOpen(false)}>
          <div role="dialog" aria-modal="true" aria-label="Prepare" onClick={e => e.stopPropagation()}
            className="absolute inset-x-0 bottom-0 bg-white rounded-t-3xl shadow-2xl px-4 pt-3"
            style={{ paddingBottom: 'calc(4.5rem + env(safe-area-inset-bottom))' }}>
            <div className="mx-auto w-10 h-1 rounded-full bg-gray-200" />
            <div className="flex items-center justify-between mt-3 mb-3 px-1">
              <p className="text-lg font-bold text-gray-900">Prepare</p>
              <button type="button" onClick={() => setPrepOpen(false)} aria-label="Close"
                className="w-10 h-10 -mr-2 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-100 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              {PREP_TOOLS.map(({ to, icon: Icon, title, desc }) => (
                <Link key={to} to={to} onClick={() => trackEvent('tabbar', { tab: to })}
                  className={`flex flex-col gap-2 p-3.5 rounded-2xl border min-h-[104px] ${pathname.startsWith(to) ? 'border-brand-600 bg-brand-50' : 'border-gray-200 bg-white active:bg-gray-50'}`}>
                  <span className="w-9 h-9 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center"><Icon className="w-5 h-5" /></span>
                  <span>
                    <span className="block text-sm font-bold text-gray-900 leading-tight">{title}</span>
                    <span className="block text-xs text-gray-500 leading-snug mt-0.5">{desc}</span>
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      <nav aria-label="Main"
        className="md:hidden fixed inset-x-0 bottom-0 z-[56] bg-white/95 backdrop-blur border-t border-gray-200 flex"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <Link to="/" className={tabCls(pathname === '/' && !onLive && !prepOpen)} aria-current={pathname === '/' ? 'page' : undefined}>
          <Home className={iconCls(pathname === '/')} /> Home
        </Link>
        <button type="button" onClick={() => setPrepOpen(v => !v)} aria-expanded={prepOpen} className={tabCls(onPrep || prepOpen)}>
          <LayoutGrid className={iconCls(onPrep || prepOpen)} /> Prepare
        </button>
        <button type="button" onClick={goLive} className={tabCls(onLive)}>
          <span className="relative">
            <Radio className={iconCls(onLive)} />
            <span className="absolute -top-0.5 -right-1 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white" />
          </span>
          Live
        </button>
        <Link to="/community" className={tabCls(pathname.startsWith('/community'))}>
          <Users className={iconCls(pathname.startsWith('/community'))} /> Community
        </Link>
        {user ? (
          <Link to="/profile" className={tabCls(pathname.startsWith('/profile'))}>
            <User className={iconCls(pathname.startsWith('/profile'))} /> Me
          </Link>
        ) : (
          <Link to="/login" className={tabCls(false)}>
            <LogIn className={iconCls(false)} /> Sign in
          </Link>
        )}
      </nav>
    </>
  );
}
