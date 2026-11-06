import { useEffect, useState } from 'react';
import { Bell, X, Smartphone, Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { isPushOn, pushSupport, permission, turnOnPush } from '../lib/push';
import { trackEvent } from '../analytics';

// "Get notified when someone replies?" — asked at the moment it matters
// (right after posting, commenting or tapping "I'm in"), never on page load.
// Anywhere in the app: askForNotifications('reply' | 'room').
//
// Mounted once in App. "Not now" waits a week before asking again.

const EVENT = 'ssbc:ask-notify';
const SNOOZE_KEY = 'ssbc:notify-prompt';
const SNOOZE_MS = 7 * 86400000;

export function askForNotifications(reason) {
  window.dispatchEvent(new CustomEvent(EVENT, { detail: reason }));
}

function snoozed() {
  try { return Date.now() - Number(localStorage.getItem(SNOOZE_KEY) || 0) < SNOOZE_MS; } catch { return false; }
}

const COPY = {
  reply: 'Get a notification on your phone when someone replies.',
  room: 'Get a notification when this room is about to start and when it goes live.',
};

export default function NotifyPrompt() {
  const { user } = useAuth();
  const [reason, setReason] = useState(null);
  const [state, setState] = useState('ask');   // ask | working | done | blocked

  useEffect(() => {
    const on = async e => {
      if (!user || snoozed()) return;
      const support = pushSupport();
      if (support === 'unsupported') return;               // email still covers them
      if (support === 'ok' && (await isPushOn())) return;  // already on
      if (support === 'ok' && permission() === 'denied') return;
      setState('ask');
      setReason(e.detail || 'reply');
      trackEvent('push_prompt_view', { reason: e.detail });
    };
    window.addEventListener(EVENT, on);
    return () => window.removeEventListener(EVENT, on);
  }, [user]);

  if (!reason) return null;
  const support = pushSupport();

  function close(snooze) {
    if (snooze) { try { localStorage.setItem(SNOOZE_KEY, String(Date.now())); } catch { /* private mode */ } }
    setReason(null);
  }

  async function turnOn() {
    setState('working');
    const r = await turnOnPush().catch(() => 'unavailable');
    trackEvent('push_enable', { from: 'prompt', reason, result: r });
    setState(r === 'on' ? 'done' : 'blocked');
    if (r === 'on') setTimeout(() => setReason(null), 2500);
  }

  // A centred dialog over a dimmed page: a corner card is easy to ignore
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-[2px]"
      onClick={e => { if (e.target === e.currentTarget) close(state !== 'done'); }}>
      <div role="dialog" aria-modal="true" aria-label="Phone notifications"
        className="relative w-full max-w-sm rounded-3xl bg-white shadow-2xl px-6 pt-8 pb-6 text-center">
        <button type="button" onClick={() => close(state !== 'done')} aria-label="Close"
          className="absolute top-3 right-3 p-1 text-gray-300 hover:text-gray-500 cursor-pointer">
          <X className="w-5 h-5" />
        </button>
        <span className={`mx-auto w-16 h-16 rounded-2xl text-white flex items-center justify-center shadow-lg ${state === 'done' ? 'bg-emerald-500' : 'bg-brand-600'}`}>
          {state === 'done' ? <Check className="w-8 h-8" /> : <Bell className="w-8 h-8" />}
        </span>
        {state === 'done' ? (
          <p className="mt-5 text-lg font-bold text-gray-900">Done! You will get notifications on this device.</p>
        ) : state === 'blocked' ? (
          <>
            <p className="mt-5 text-lg font-bold text-gray-900">Notifications are blocked</p>
            <p className="mt-2 text-sm text-gray-600 leading-relaxed">Allow them for ssbcircle.com in your browser settings. Meanwhile we will email you.</p>
            <button type="button" onClick={() => close(false)} className="btn-primary w-full mt-5 py-3">OK</button>
          </>
        ) : support === 'ios-needs-home-screen' ? (
          <>
            <p className="mt-5 text-lg font-bold text-gray-900">Want alerts on your iPhone?</p>
            <p className="mt-2 text-sm text-gray-600 leading-relaxed">
              Tap <b>Share</b> <Smartphone className="inline w-4 h-4 -mt-0.5" /> → <b>Add to Home Screen</b>, then open SSBCircle from your home screen and allow notifications. Until then, we will email you.
            </p>
            <button type="button" onClick={() => close(true)} className="btn-primary w-full mt-5 py-3">Got it</button>
          </>
        ) : (
          <>
            <p className="mt-5 text-xl font-bold text-gray-900">Don't miss the reply</p>
            <p className="mt-2 text-sm text-gray-600 leading-relaxed">{COPY[reason] || COPY.reply}</p>
            <button type="button" onClick={turnOn} disabled={state === 'working'}
              className="btn-primary w-full mt-6 py-3 text-base">{state === 'working' ? 'Turning on…' : 'Turn on notifications'}</button>
            <button type="button" onClick={() => close(true)}
              className="mt-3 w-full py-2 text-sm font-semibold text-gray-500 hover:text-gray-800 cursor-pointer">Not now</button>
          </>
        )}
      </div>
    </div>
  );
}

