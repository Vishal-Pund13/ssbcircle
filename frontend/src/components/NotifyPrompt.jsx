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

  return (
    <div className="fixed inset-x-3 sm:inset-x-auto sm:right-5 z-[60] sm:w-[380px] bottom-[calc(4.75rem+env(safe-area-inset-bottom))] md:bottom-5"
      role="dialog" aria-label="Phone notifications">
      <div className="rounded-2xl bg-white border border-gray-200 shadow-2xl p-4">
        <div className="flex items-start gap-3">
          <span className="w-10 h-10 rounded-xl bg-brand-600 text-white flex items-center justify-center shrink-0">
            {state === 'done' ? <Check className="w-5 h-5" /> : <Bell className="w-5 h-5" />}
          </span>
          <div className="min-w-0 flex-1">
            {state === 'done' ? (
              <p className="text-sm font-bold text-gray-900 pt-2">Done — you will get notifications on this device.</p>
            ) : state === 'blocked' ? (
              <>
                <p className="text-sm font-bold text-gray-900">Notifications are blocked</p>
                <p className="mt-1 text-[13px] text-gray-600 leading-snug">Allow them for ssbcircle.com in your browser settings. Meanwhile we will email you.</p>
              </>
            ) : support === 'ios-needs-home-screen' ? (
              <>
                <p className="text-sm font-bold text-gray-900">Want alerts on your iPhone?</p>
                <p className="mt-1 text-[13px] text-gray-600 leading-snug">
                  Tap <b>Share</b> <Smartphone className="inline w-3.5 h-3.5 -mt-0.5" /> → <b>Add to Home Screen</b>, then open SSBCircle from your home screen and allow notifications. Until then, we will email you.
                </p>
              </>
            ) : (
              <>
                <p className="text-sm font-bold text-gray-900">Don't miss the reply</p>
                <p className="mt-1 text-[13px] text-gray-600 leading-snug">{COPY[reason] || COPY.reply}</p>
                <div className="mt-3 flex items-center gap-3">
                  <button type="button" onClick={turnOn} disabled={state === 'working'}
                    className="btn-primary text-sm px-4 py-2">{state === 'working' ? 'Turning on…' : 'Turn on notifications'}</button>
                  <button type="button" onClick={() => close(true)} className="text-sm font-semibold text-gray-500 hover:text-gray-800 cursor-pointer">Not now</button>
                </div>
              </>
            )}
          </div>
          <button type="button" onClick={() => close(state !== 'done')} aria-label="Close" className="text-gray-300 hover:text-gray-500 cursor-pointer shrink-0">
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

