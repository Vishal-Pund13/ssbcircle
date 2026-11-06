import { getPushPublicKey, savePushSubscription, deletePushSubscription } from '../services/api';

// Phone notifications through the browser's Push API.
//
// Android (Chrome, Edge, Samsung Internet) and desktop browsers support it
// directly. On iPhone, Safari allows it only for a site added to the Home
// Screen (iOS 16.4+), so `pushSupport()` tells the page which case it is in
// and the page can explain the extra step instead of showing a dead button.

export const isIOS = () => /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
const isStandalone = () => window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone === true;

// 'ok' | 'ios-needs-home-screen' | 'unsupported'
export function pushSupport() {
  const has = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
  if (has) return 'ok';
  if (isIOS() && !isStandalone()) return 'ios-needs-home-screen';
  return 'unsupported';
}

export const permission = () => ('Notification' in window ? Notification.permission : 'denied');

// Register once, on load; the worker only handles notifications
export function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return;
  window.addEventListener('load', () => { navigator.serviceWorker.register('/sw.js').catch(() => {}); });
}

function keyToBytes(base64) {
  const pad = '='.repeat((4 - (base64.length % 4)) % 4);
  const raw = atob((base64 + pad).replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from(raw, c => c.charCodeAt(0));
}

async function currentSubscription() {
  if (!('serviceWorker' in navigator)) return null;
  const reg = await navigator.serviceWorker.getRegistration();
  return reg ? reg.pushManager.getSubscription() : null;
}

// True when this browser is already set up to receive phone notifications
export async function isPushOn() {
  if (pushSupport() !== 'ok' || permission() !== 'granted') return false;
  return !!(await currentSubscription());
}

// Ask for permission and register this browser. Returns 'on' | 'denied' | 'unavailable'.
export async function turnOnPush() {
  if (pushSupport() !== 'ok') return 'unavailable';
  const key = await getPushPublicKey().catch(() => '');
  if (!key) return 'unavailable';
  const result = await Notification.requestPermission();
  if (result !== 'granted') return 'denied';
  const reg = await navigator.serviceWorker.register('/sw.js');
  await navigator.serviceWorker.ready;
  const sub = (await reg.pushManager.getSubscription())
    || await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyToBytes(key) });
  await savePushSubscription(sub.toJSON());
  return 'on';
}

export async function turnOffPush() {
  const sub = await currentSubscription();
  if (!sub) return;
  await deletePushSubscription(sub.endpoint).catch(() => {});
  await sub.unsubscribe().catch(() => {});
}
