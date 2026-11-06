import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BellRing, Check, Smartphone } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getNotifyPrefs, saveNotifyPrefs } from '../services/api';
import { isPushOn, pushSupport, permission, turnOnPush } from '../lib/push';
import { trackEvent } from '../analytics';

// Home page: "Stay in the loop". The person ticks what they want to hear
// about, then one button turns on phone alerts and saves the choice. Once
// alerts are on, each tick saves by itself.

const CHOICES = [
  { key: 'new_rooms_push', label: 'New rooms', desc: 'When someone starts or schedules a GD or interview room', start: true },
  { key: 'new_posts_push', label: 'New community posts', desc: 'Experiences, SSB dates and doubts as they are posted', start: true },
  { key: 'replies_push',   label: 'Replies to me', desc: 'When someone replies to your post or comment', start: true },
  { key: 'rooms_push',     label: 'My rooms', desc: 'Someone joins your room; rooms you joined are starting', start: true },
];

function Tick({ on }) {
  return (
    <span className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors ${on ? 'bg-brand-600 border-brand-600' : 'bg-white border-gray-300'}`}>
      {on && <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
    </span>
  );
}

export default function StayNotified() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [picked, setPicked] = useState(() => Object.fromEntries(CHOICES.map(c => [c.key, c.start])));
  const [pushOn, setPushOn] = useState(false);
  const [state, setState] = useState('idle');   // idle | working | done | blocked | unavailable
  const support = pushSupport();

  useEffect(() => {
    if (!user) return;
    isPushOn().then(on => {
      setPushOn(on);
      // Already on: show what they chose before, not our suggestion
      if (on) getNotifyPrefs().then(p => setPicked(Object.fromEntries(CHOICES.map(c => [c.key, !!p[c.key]])))).catch(() => {});
    }).catch(() => {});
  }, [user]);

  function toggle(key) {
    const value = !picked[key];
    setPicked(p => ({ ...p, [key]: value }));
    if (pushOn) saveNotifyPrefs({ [key]: value }).catch(() => setPicked(p => ({ ...p, [key]: !value })));
  }

  async function turnOn() {
    if (!user) {
      navigate('/login', { state: { from: { pathname: '/', search: '', hash: '#community' } } });
      return;
    }
    setState('working');
    // Save the choice either way: the bell (and email) follow it even without phone alerts
    await saveNotifyPrefs(picked).catch(() => {});
    if (support !== 'ok') { setState('unavailable'); return; }
    const r = await turnOnPush().catch(() => 'unavailable');
    trackEvent('push_enable', { from: 'home', result: r, ...picked });
    if (r === 'on') { setPushOn(true); setState('done'); } else setState(r === 'denied' ? 'blocked' : 'unavailable');
  }

  return (
    <div className="bg-gradient-to-br from-brand-700 to-brand-800 text-white rounded-2xl p-5 sm:p-6 h-full flex flex-col">
      <div className="flex items-start gap-3">
        <span className="w-11 h-11 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
          <BellRing className="w-5 h-5" />
        </span>
        <div>
          <p className="text-lg font-bold leading-tight">{pushOn ? 'You are getting notifications' : 'Never miss a room or a reply'}</p>
          <p className="mt-1 text-sm text-white/75 leading-snug">
            {pushOn ? 'Choose what reaches this phone. Changes save by themselves.' : 'Pick what you want. We send it to your phone the moment it happens.'}
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-2 content-start">
        {CHOICES.map(c => (
          <button key={c.key} type="button" role="checkbox" aria-checked={picked[c.key]} onClick={() => toggle(c.key)}
            className={`w-full flex items-start gap-3 text-left rounded-xl px-3.5 py-2.5 transition-colors cursor-pointer ${picked[c.key] ? 'bg-white text-gray-900' : 'bg-white/10 text-white hover:bg-white/15'}`}>
            <span className="mt-0.5"><Tick on={picked[c.key]} /></span>
            <span className="min-w-0">
              <span className="block text-sm font-bold">{c.label}</span>
              <span className={`block text-xs leading-snug ${picked[c.key] ? 'text-gray-500' : 'text-white/60'}`}>{c.desc}</span>
            </span>
          </button>
        ))}
      </div>

      {!pushOn && (
        <div className="mt-4">
          {state === 'blocked' ? (
            <p className="text-sm text-amber-200">Notifications are blocked. Allow them for ssbcircle.com in your browser settings, then try again.</p>
          ) : state === 'unavailable' || (user && support === 'ios-needs-home-screen') ? (
            <p className="text-sm text-white/85 leading-snug">
              {support === 'ios-needs-home-screen'
                ? <>Saved. On iPhone: tap <b>Share</b> <Smartphone className="inline w-4 h-4 -mt-0.5" /> → <b>Add to Home Screen</b>, open SSBCircle from there, and turn on alerts. Until then they show in your bell.</>
                : 'Saved. This browser cannot show phone alerts, so they will show in your bell.'}
            </p>
          ) : (
            <button type="button" onClick={turnOn} disabled={state === 'working' || (user && permission() === 'denied')}
              className="w-full bg-white text-brand-800 font-bold rounded-xl py-3 hover:bg-brand-50 transition-colors cursor-pointer disabled:opacity-60">
              {state === 'working' ? 'Turning on…' : user ? 'Turn on notifications' : 'Sign in to get notified'}
            </button>
          )}
          {permission() === 'denied' && state !== 'blocked' && user && (
            <p className="mt-2 text-xs text-amber-200">Notifications are blocked for this site in your browser settings.</p>
          )}
        </div>
      )}
      {state === 'done' && <p className="mt-3 text-sm font-semibold text-emerald-200 flex items-center gap-1.5"><Check className="w-4 h-4" /> Done. You will hear from us on this device.</p>}
    </div>
  );
}
