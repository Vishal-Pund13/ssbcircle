import { useEffect, useState } from 'react';
import { Bell, Smartphone, Mail } from 'lucide-react';
import { getNotifyPrefs, saveNotifyPrefs, sendTestNotification } from '../services/api';
import { isPushOn, pushSupport, turnOnPush, turnOffPush, permission } from '../lib/push';
import { trackEvent } from '../analytics';

// Profile → Notifications: this device's phone alerts, and email on/off for
// replies and rooms. Lives at /profile#notifications (the bell links here).

function Toggle({ on, onChange, label, disabled }) {
  return (
    <button type="button" role="switch" aria-checked={on} aria-label={label} disabled={disabled} onClick={() => onChange(!on)}
      className={`relative w-11 h-6 rounded-full transition-colors shrink-0 cursor-pointer disabled:opacity-40 disabled:cursor-default ${on ? 'bg-brand-600' : 'bg-gray-300'}`}>
      <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${on ? 'left-[22px]' : 'left-0.5'}`} />
    </button>
  );
}

export default function NotificationSettings() {
  const [prefs, setPrefs] = useState(null);
  const [push, setPush] = useState(false);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState('');
  const support = pushSupport();

  useEffect(() => {
    getNotifyPrefs().then(setPrefs).catch(() => setPrefs({ replies_push: true, replies_email: true, rooms_push: true, rooms_email: true, new_rooms_push: false, new_posts_push: false }));
    isPushOn().then(setPush).catch(() => {});
    if (new URLSearchParams(window.location.search).get('notifications') === 'email-off') setNote('Email notifications are now off.');
    if (window.location.hash === '#notifications') document.getElementById('notifications')?.scrollIntoView();
  }, []);

  async function setDevicePush(on) {
    setBusy(true); setNote('');
    if (on) {
      const r = await turnOnPush().catch(() => 'unavailable');
      trackEvent('push_enable', { from: 'profile', result: r });
      setPush(r === 'on');
      if (r === 'denied') setNote('Notifications are blocked. Allow them for ssbcircle.com in your browser settings.');
      if (r === 'unavailable') setNote('Phone notifications are not available in this browser.');
    } else {
      await turnOffPush();
      setPush(false);
    }
    setBusy(false);
  }

  async function sendTest() {
    setNote('');
    try {
      const r = await sendTestNotification();
      setNote(r.push ? 'Sent. It should arrive on this device in a few seconds.' : 'Sent to your bell. Phone alerts are not switched on on our side yet.');
    } catch {
      setNote('Could not send a test right now. Try again in a minute.');
    }
  }

  function setPref(key, value) {
    setPrefs(p => ({ ...p, [key]: value }));
    saveNotifyPrefs({ [key]: value }).catch(() => setPrefs(p => ({ ...p, [key]: !value })));
  }

  const rows = [
    { key: 'replies', title: 'Replies', desc: 'Someone replies to your post, or to a post you commented on' },
    { key: 'rooms', title: 'Rooms', desc: 'Someone joins your room, and rooms you are in start or go live' },
    // Site-wide news: phone and bell only, never email
    { key: 'new_rooms', title: 'New rooms', desc: 'Someone starts or schedules a room', noEmail: true },
    { key: 'new_posts', title: 'New community posts', desc: 'Experiences, SSB dates and doubts as they are posted', noEmail: true },
  ];

  return (
    <section id="notifications" className="bg-white border border-gray-200 rounded-2xl p-5 scroll-mt-20">
      <h2 className="flex items-center gap-2 text-base font-bold text-gray-900"><Bell className="w-4 h-4 text-brand-600" /> Notifications</h2>

      <div className="mt-4 flex items-start justify-between gap-4 rounded-xl bg-gray-50 border border-gray-100 p-3.5">
        <div className="flex items-start gap-3 min-w-0">
          <Smartphone className="w-5 h-5 text-gray-500 shrink-0 mt-0.5" />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900">Phone notifications on this device</p>
            <p className="text-[13px] text-gray-500 leading-snug mt-0.5">
              {support === 'ios-needs-home-screen'
                ? 'On iPhone: tap Share → Add to Home Screen, open SSBCircle from there, then turn this on.'
                : support === 'unsupported'
                  ? 'This browser does not support them. You will still get emails.'
                  : permission() === 'denied'
                    ? 'Blocked in your browser settings. Allow notifications for ssbcircle.com to turn this on.'
                    : 'No alerts between 11 pm and 7 am IST.'}
            </p>
          </div>
        </div>
        <Toggle on={push} onChange={setDevicePush} label="Phone notifications on this device" disabled={busy || support !== 'ok'} />
      </div>
      {push && (
        <button type="button" onClick={sendTest} className="mt-2 text-[13px] font-semibold text-brand-600 hover:text-brand-800 cursor-pointer">
          Send me a test notification
        </button>
      )}

      {prefs && (
        <div className="mt-3 divide-y divide-gray-100">
          {rows.map(r => (
            <div key={r.key} className="py-3">
              <p className="text-sm font-semibold text-gray-900">{r.title}</p>
              <p className="text-[13px] text-gray-500 leading-snug">{r.desc}</p>
              <div className="mt-2 flex flex-wrap gap-x-6 gap-y-2">
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <Toggle on={prefs[`${r.key}_push`]} onChange={v => setPref(`${r.key}_push`, v)} label={`${r.title}: phone`} /> <Smartphone className="w-4 h-4 text-gray-400" /> Phone
                </label>
                {!r.noEmail && <label className="flex items-center gap-2 text-sm text-gray-700">
                  <Toggle on={prefs[`${r.key}_email`]} onChange={v => setPref(`${r.key}_email`, v)} label={`${r.title}: email`} /> <Mail className="w-4 h-4 text-gray-400" /> Email
                </label>}
              </div>
            </div>
          ))}
        </div>
      )}
      {note && <p className="mt-2 text-[13px] text-brand-700">{note}</p>}
    </section>
  );
}
