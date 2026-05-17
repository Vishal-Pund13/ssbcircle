const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM   = 'SSBCircle <noreply@ssbcircle.com>';
const BASE   = 'https://www.ssbcircle.com';

function formatDt(dateStr) {
  const d = new Date(dateStr);
  return {
    date: d.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }),
    time: d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }),
  };
}

// Email-safe HTML — all styles inline, table-based layout (Gmail compatible)
function baseTemplate({ label, body }) {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f9fafb;padding:32px 16px;">
  <tr><td align="center">
    <table width="520" cellpadding="0" cellspacing="0" border="0" style="max-width:520px;width:100%;">

      <!-- Header -->
      <tr>
        <td style="background:#1e3a5f;padding:20px 32px;border-radius:16px 16px 0 0;">
          <table cellpadding="0" cellspacing="0" border="0" width="100%">
            <tr>
              <td style="vertical-align:middle;">
                <table cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td style="vertical-align:middle;padding-right:12px;">
                      <img src="${BASE}/favicon.svg" width="36" height="36" alt="SSBCircle" style="display:block;border:0;"/>
                    </td>
                    <td style="vertical-align:middle;">
                      <div style="font-size:20px;font-weight:700;color:#ffffff;letter-spacing:-0.3px;">SSBCircle</div>
                      <div style="font-size:11px;font-weight:600;color:#93c5fd;text-transform:uppercase;letter-spacing:0.08em;margin-top:2px;">${label}</div>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>

      <!-- Body -->
      <tr>
        <td style="background:#ffffff;border:1px solid #e5e7eb;border-top:none;padding:32px;border-radius:0 0 16px 16px;">
          ${body}
        </td>
      </tr>

      <!-- Footer -->
      <tr>
        <td style="padding:20px 0;text-align:center;font-size:12px;color:#9ca3af;">
          SSBCircle &mdash; Connecting defence aspirants across India<br/>
          <a href="${BASE}" style="color:#9ca3af;text-decoration:none;">ssbcircle.com</a>
        </td>
      </tr>

    </table>
  </td></tr>
</table>
</body></html>`;
}

function infoRow(label, value) {
  return `<tr>
    <td style="padding:8px 0;font-size:13px;color:#374151;font-weight:700;width:80px;border-bottom:1px solid #f3f4f6;">${label}</td>
    <td style="padding:8px 0;font-size:13px;color:#111827;font-weight:600;border-bottom:1px solid #f3f4f6;">${value}</td>
  </tr>`;
}

function prepTips() {
  const tips = [
    'Keep a pen and paper ready — note down points others make that you can build on',
    'Write the topic and the 3 leads given by the assessor before the discussion begins',
    'After the session, review your notes and mark what you said vs what you planned to say',
    'Note down strong points made by others — it helps you learn vocabulary and structuring',
  ];
  return `
    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-top:24px;border-radius:10px;overflow:hidden;">
      <tr>
        <td style="background:#eef2ff;border:1px solid #e0e7ff;border-radius:10px;padding:16px 20px;">
          <p style="font-size:12px;font-weight:700;color:#1e3a5f;text-transform:uppercase;letter-spacing:0.06em;margin:0 0 10px;">Prepare for your session</p>
          ${tips.map(t => `
            <table cellpadding="0" cellspacing="0" border="0" style="margin-bottom:8px;">
              <tr>
                <td style="width:16px;vertical-align:top;padding-top:1px;">
                  <div style="width:6px;height:6px;background:#1e3a5f;border-radius:50%;margin-top:4px;"></div>
                </td>
                <td style="font-size:13px;color:#374151;line-height:1.6;padding-left:8px;">${t}</td>
              </tr>
            </table>`).join('')}
        </td>
      </tr>
    </table>`;
}

function gcalLink(topic, scheduled_at) {
  const start = new Date(scheduled_at);
  const end   = new Date(start.getTime() + 60 * 60 * 1000); // 1 hour session
  const fmt   = d => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  const url   = `https://calendar.google.com/calendar/r/eventedit?text=${encodeURIComponent('[SSBCircle] ' + topic)}&dates=${fmt(start)}/${fmt(end)}&details=${encodeURIComponent('SSB Group Discussion practice on SSBCircle.\n\nJoin at: https://www.ssbcircle.com')}&location=${encodeURIComponent('https://www.ssbcircle.com')}`;
  return `
    <table cellpadding="0" cellspacing="0" border="0" style="margin-top:12px;">
      <tr>
        <td style="border:1px solid #e5e7eb;border-radius:8px;">
          <a href="${url}" style="display:inline-block;padding:10px 20px;color:#374151;font-weight:600;font-size:13px;text-decoration:none;font-family:Arial,sans-serif;">
            + Add to Google Calendar
          </a>
        </td>
      </tr>
    </table>`;
}

function ctaButton(text, url) {
  return `<table cellpadding="0" cellspacing="0" border="0" style="margin-top:24px;">
    <tr>
      <td style="background:#1e3a5f;border-radius:10px;">
        <a href="${url}" style="display:inline-block;padding:13px 28px;color:#ffffff;font-weight:700;font-size:14px;text-decoration:none;font-family:Arial,sans-serif;">${text}</a>
      </td>
    </tr>
  </table>`;
}

// 1. Interest confirmation
async function sendInterestConfirmation({ to, name, topic, category, scheduled_at }) {
  const { date, time } = formatDt(scheduled_at);
  const body = `
    <p style="font-size:20px;font-weight:700;color:#111827;margin:0 0 8px;">${topic}</p>
    <span style="display:inline-block;background:#e0e7ff;color:#1e3a5f;font-size:11px;font-weight:700;padding:3px 12px;border-radius:999px;margin-bottom:20px;">${category}</span>
    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom:24px;">
      ${infoRow('Date', date)}
      ${infoRow('Time', time)}
    </table>
    <p style="font-size:14px;color:#374151;line-height:1.7;margin:0;">
      Hi ${name || 'Aspirant'},<br/><br/>
      You are now registered for this session. You will receive a reminder 30 minutes before it starts, and another notification when the host opens the room.
    </p>
    ${prepTips()}
    ${ctaButton('View on SSBCircle', BASE)}
    ${gcalLink(topic, scheduled_at)}
  `;
  return resend.emails.send({ from: FROM, to, subject: `Registered: ${topic}`, html: baseTemplate({ label: 'Session Registered', body }) });
}

// 2. 30-min reminder
async function sendReminder({ to, name, topic, category, scheduled_at }) {
  const { date, time } = formatDt(scheduled_at);
  const body = `
    <p style="font-size:20px;font-weight:700;color:#111827;margin:0 0 8px;">${topic}</p>
    <span style="display:inline-block;background:#e0e7ff;color:#1e3a5f;font-size:11px;font-weight:700;padding:3px 12px;border-radius:999px;margin-bottom:20px;">${category}</span>
    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom:24px;">
      ${infoRow('Date', date)}
      ${infoRow('Time', time)}
    </table>
    <p style="font-size:14px;color:#374151;line-height:1.7;margin:0;">
      Hi ${name || 'Aspirant'},<br/><br/>
      Your session starts in 30 minutes. The host will open the room shortly — you will receive another email with the room code the moment it goes live.
    </p>
    ${prepTips()}
    ${ctaButton('Go to SSBCircle', BASE)}
    ${gcalLink(topic, scheduled_at)}
  `;
  return resend.emails.send({ from: FROM, to, subject: `Starting soon: ${topic}`, html: baseTemplate({ label: 'Starting in 30 Minutes', body }) });
}

// 3. Room is live
async function sendRoomLive({ to, name, topic, category, room_code }) {
  const joinUrl = `${BASE}/room/${room_code}`;
  const body = `
    <p style="font-size:20px;font-weight:700;color:#111827;margin:0 0 8px;">${topic}</p>
    <span style="display:inline-block;background:#e0e7ff;color:#1e3a5f;font-size:11px;font-weight:700;padding:3px 12px;border-radius:999px;margin-bottom:20px;">${category}</span>
    <p style="font-size:14px;color:#374151;line-height:1.7;margin:0 0 20px;">
      Hi ${name || 'Aspirant'},<br/><br/>
      The session you registered for is now live. Use the code below to join.
    </p>
    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom:24px;">
      <tr>
        <td style="background:#f3f4f6;border:1px solid #e5e7eb;border-radius:12px;padding:20px;text-align:center;">
          <div style="font-size:32px;font-weight:800;letter-spacing:0.3em;color:#1e3a5f;font-family:'Courier New',monospace;">${room_code}</div>
          <div style="font-size:12px;color:#9ca3af;margin-top:8px;">Enter this code on SSBCircle to join the room</div>
        </td>
      </tr>
    </table>
    ${ctaButton('Join Room Now', joinUrl)}
  `;
  return resend.emails.send({ from: FROM, to, subject: `Live now: ${topic}`, html: baseTemplate({ label: 'Room is Live', body }) });
}

module.exports = { sendInterestConfirmation, sendReminder, sendRoomLive };
