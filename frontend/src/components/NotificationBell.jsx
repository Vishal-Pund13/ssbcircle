import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Bell, MessageCircle, Radio, Users, Smartphone, Settings, FileText } from 'lucide-react';
import { getNotifications, getUnreadCount, markNotificationsRead } from '../services/api';
import { isPushOn, pushSupport, turnOnPush } from '../lib/push';
import { trackEvent } from '../analytics';

// The bell in the site nav: unread count, the last 30 notifications, and a
// one-tap way to turn on phone alerts. The count is polled every minute and
// whenever the tab comes back into view.

const POLL_MS = 60_000;
const ICON = { reply: MessageCircle, room_live: Radio, room_soon: Radio, room_interest: Users, new_room: Radio, new_post: FileText };

function ago(ts) {
  const s = Math.max(0, (Date.now() - new Date(ts)) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return new Date(ts).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', day: 'numeric', month: 'short' });
}

// The nav has a desktop and a phone layout; `only` keeps a single bell (and
// a single poller) mounted for the current screen size.
const DESKTOP = '(min-width: 768px)';
function useMatches(query) {
  const [m, setM] = useState(() => window.matchMedia(query).matches);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const on = () => setM(mq.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, [query]);
  return m;
}

export default function NotificationBell({ only }) {
  const isDesktop = useMatches(DESKTOP);
  if ((only === 'desktop' && !isDesktop) || (only === 'phone' && isDesktop)) return null;
  return <BellMenu />;
}

function BellMenu() {
  const navigate = useNavigate();
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState(null);
  const [pushOn, setPushOn] = useState(true);
  const ref = useRef(null);

  const refreshCount = useCallback(() => {
    if (document.visibilityState !== 'visible') return;
    getUnreadCount().then(setUnread).catch(() => {});
  }, []);

  useEffect(() => {
    refreshCount();
    const t = setInterval(refreshCount, POLL_MS);
    document.addEventListener('visibilitychange', refreshCount);
    return () => { clearInterval(t); document.removeEventListener('visibilitychange', refreshCount); };
  }, [refreshCount]);

  useEffect(() => {
    if (!open) return;
    const onDown = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    const onKey = e => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey); };
  }, [open]);

  async function toggle() {
    const next = !open;
    setOpen(next);
    if (!next) return;
    trackEvent('bell_open', { unread });
    isPushOn().then(setPushOn).catch(() => {});
    try {
      const { notifications } = await getNotifications();
      setItems(notifications);
      if (notifications.some(n => !n.read_at)) {
        // Seen now; the dots stay for this view so the person can tell what is new
        markNotificationsRead().catch(() => {});
        setUnread(0);
      }
    } catch {
      setItems([]);
    }
  }

  async function enablePush() {
    const r = await turnOnPush().catch(() => 'unavailable');
    trackEvent('push_enable', { from: 'bell', result: r });
    if (r === 'on') setPushOn(true);
  }

  const support = pushSupport();

  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={toggle} aria-label={unread ? `Notifications, ${unread} unread` : 'Notifications'} aria-expanded={open}
        className="relative flex items-center justify-center w-9 h-9 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 transition-colors cursor-pointer">
        <Bell className="w-4 h-4 text-gray-600" />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="fixed md:absolute inset-x-3 md:inset-x-auto md:right-0 top-16 md:top-full md:mt-2 md:w-96 bg-white border border-gray-200 rounded-2xl shadow-xl overflow-hidden z-50">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <p className="text-sm font-bold text-gray-900">Notifications</p>
            <Link to="/profile#notifications" onClick={() => setOpen(false)} className="flex items-center gap-1 text-xs font-semibold text-gray-500 hover:text-gray-800">
              <Settings className="w-3.5 h-3.5" /> Settings
            </Link>
          </div>

          {!pushOn && support !== 'unsupported' && (
            <div className="px-4 py-3 bg-emerald-50 border-b border-emerald-100 flex items-start gap-3">
              <Smartphone className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div className="text-[13px] text-emerald-900 leading-snug">
                {support === 'ok' ? (
                  <>Get replies on your phone, the moment they happen.{' '}
                    <button type="button" onClick={enablePush} className="font-bold underline cursor-pointer">Turn on</button></>
                ) : (
                  <>On iPhone: tap <b>Share</b> → <b>Add to Home Screen</b>, open SSBCircle from there, and turn on alerts.</>
                )}
              </div>
            </div>
          )}

          <div className="max-h-[60vh] overflow-y-auto">
            {items === null ? (
              <p className="px-4 py-8 text-center text-sm text-gray-400">Loading…</p>
            ) : items.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-gray-500">No notifications yet. Replies to your posts and updates on your rooms will show here.</p>
            ) : items.map(n => {
              const Icon = ICON[n.kind] || Bell;
              return (
                <button key={n.id} type="button" onClick={() => { setOpen(false); trackEvent('bell_item', { kind: n.kind }); navigate(n.link); }}
                  className={`w-full text-left flex gap-3 px-4 py-3 border-b border-gray-50 hover:bg-gray-50 cursor-pointer ${n.read_at ? '' : 'bg-brand-50/50'}`}>
                  {n.actor_avatar
                    ? <img src={n.actor_avatar} alt="" referrerPolicy="no-referrer" className="w-9 h-9 rounded-full object-cover shrink-0" />
                    : <span className="w-9 h-9 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center shrink-0"><Icon className="w-4 h-4" /></span>}
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold text-gray-900 leading-snug">{n.title}</span>
                    {n.body && <span className="block text-[13px] text-gray-600 leading-snug mt-0.5 line-clamp-2">{n.body}</span>}
                    <span className="block text-[11px] text-gray-400 mt-1">{ago(n.updated_at)}</span>
                  </span>
                  {!n.read_at && <span className="w-2 h-2 rounded-full bg-brand-600 shrink-0 mt-2" aria-label="New" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
