// Every time a person reads — in an email, a notification, anywhere — is
// shown in Indian Standard Time. The database keeps exact moments (UTC); only
// the display is converted. The server's own clock zone is never used: Render
// runs in UTC, so a plain toLocaleTimeString() would show 2:30 PM for an
// 8:00 PM IST room.

const TZ = 'Asia/Kolkata';

// "Friday, 6 November 2026"
const dateIST = d => new Date(d).toLocaleDateString('en-IN', { timeZone: TZ, weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

// "8:00 pm IST"
const timeIST = d => `${new Date(d).toLocaleTimeString('en-IN', { timeZone: TZ, hour: 'numeric', minute: '2-digit', hour12: true })} IST`;

// "6 Nov, 8:00 pm IST"
const shortIST = d => `${new Date(d).toLocaleString('en-IN', { timeZone: TZ, day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', hour12: true })} IST`;

// The hour (0–23) right now in India, for quiet hours
const hourIST = (d = new Date()) => Number(new Date(d).toLocaleString('en-IN', { timeZone: TZ, hour: 'numeric', hour12: false }));

module.exports = { TZ, dateIST, timeIST, shortIST, hourIST };
