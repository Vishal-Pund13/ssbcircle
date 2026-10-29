import { useState, useEffect, useCallback } from 'react';
import { CheckCircle2, XCircle, Phone, Mail, ShieldCheck, Clock, UserPlus, AlertTriangle } from 'lucide-react';

// Admin: the moderator programme and platform feedback.
// Applicants are scored over their own 14-day trial; "rising contributors"
// are everyone else, scored over the last 14 days, so the officers can call
// people who are already doing the work without having applied.

const API = import.meta.env.VITE_API_URL || 'http://localhost:4000';
const fmtDate = d => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '—';
const STATUS = {
  trial:     'bg-brand-50 text-brand-700',
  invited:   'bg-sky-50 text-sky-700',
  review:    'bg-amber-50 text-amber-700',
  approved:  'bg-emerald-50 text-emerald-700',
  declined:  'bg-gray-100 text-gray-500',
  withdrawn: 'bg-gray-100 text-gray-500',
  removed:   'bg-gray-100 text-gray-500',
};

function Breakdown({ a }) {
  if (!a) return <span className="text-xs text-gray-400">No activity yet</span>;
  const items = [['Hosted', a.hosted], ['Posts', a.posts], ['Replies', a.replies], ['Upvotes', a.upvotes], ['Reports', a.reports], ['Feedback', a.feedback], ["I'm in", a.im_in], ['Days', a.active_days]];
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map(([k, v]) => (
        <span key={k} className={`text-[12px] px-2 py-0.5 rounded-md ${v ? 'bg-gray-100 text-gray-800' : 'bg-gray-50 text-gray-400'}`}>{k} <span className="font-bold">{v}</span></span>
      ))}
    </div>
  );
}

function Contact({ email, phone }) {
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1 text-[13px] text-gray-600">
      {email && <a href={`mailto:${email}`} className="inline-flex items-center gap-1 hover:text-brand-700"><Mail className="w-3.5 h-3.5" />{email}</a>}
      {phone && <a href={`tel:${phone}`} className="inline-flex items-center gap-1 hover:text-brand-700"><Phone className="w-3.5 h-3.5" />{phone}</a>}
    </div>
  );
}

export function ModeratorsAdmin({ authHeaders }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    fetch(`${API}/api/admin/moderators`, { headers: authHeaders() })
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(setData).catch(() => setError('Could not load the programme.'));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(load, [load]);

  async function decide(userId, status, name) {
    const verb = { approved: 'Approve', declined: 'Decline', review: 'Move to review', invited: 'Invite' }[status];
    if (!window.confirm(`${verb} ${name}?`)) return;
    const note = status === 'declined' ? window.prompt('Optional note (only you see this):') || '' : '';
    const res = await fetch(`${API}/api/admin/moderators/${userId}/decision`, { method: 'POST', headers: authHeaders(), body: JSON.stringify({ status, note }) });
    if (res.ok) setData(await res.json()); else setError('Could not save.');
  }

  async function remove(userId, name) {
    if (!window.confirm(`Remove ${name} as a moderator?`)) return;
    const res = await fetch(`${API}/api/admin/moderators/${userId}`, { method: 'DELETE', headers: authHeaders() });
    if (res.ok) setData(await res.json());
  }

  if (error) return <p className="text-sm text-red-600">{error}</p>;
  if (!data) return <div className="h-48 bg-white border border-gray-200 rounded-2xl animate-pulse" />;

  const t = data.targets;
  const active = data.applications.filter(a => ['trial', 'invited', 'review'].includes(a.status));
  const past = data.applications.filter(a => !['trial', 'invited', 'review'].includes(a.status));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[['In trial / review', active.length], ['Moderators', data.moderators.length], ['Rising contributors', data.rising.length], ['Decided', past.length]].map(([l, n]) => (
          <div key={l} className="bg-white border border-gray-200 rounded-2xl p-4"><p className="text-2xl font-bold text-gray-900">{n}</p><p className="text-[13px] text-gray-500">{l}</p></div>
        ))}
      </div>

      <section className="bg-white border border-gray-200 rounded-2xl p-5">
        <p className="text-[15px] font-bold text-gray-900">Applicants</p>
        <p className="text-[13px] text-gray-500 mt-0.5">Scored over their own trial. Targets: {t.hosted}+ hosted · {t.replies}+ replies · {t.active_days}+ active days · {t.score}+ score.</p>
        <div className="mt-4 space-y-3">
          {active.length === 0 && <p className="text-[14px] text-gray-400 py-3">No one in a trial right now.</p>}
          {active.map(a => {
            const left = Math.ceil((new Date(a.trial_ends_at) - Date.now()) / 86400000);
            const act = a.activity;
            return (
              <div key={a.user_id} className={`border rounded-xl p-4 ${act?.on_track ? 'border-emerald-200 bg-emerald-50/30' : 'border-gray-200'}`}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[15px] font-bold text-gray-900 flex items-center gap-2">
                      {a.display_name}
                      <span className={`text-[11px] font-bold uppercase px-2 py-0.5 rounded-full ${STATUS[a.status]}`}>{a.status}</span>
                      {act?.on_track && <span className="inline-flex items-center gap-1 text-[12px] font-semibold text-emerald-700"><CheckCircle2 className="w-3.5 h-3.5" /> All targets met</span>}
                    </p>
                    <Contact email={a.email} phone={a.phone} />
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold tabular-nums text-gray-900">{act?.score ?? 0}</p>
                    <p className="text-[12px] text-gray-500 flex items-center gap-1 justify-end"><Clock className="w-3 h-3" />{left > 0 ? `${left}d left` : `ended ${fmtDate(a.trial_ends_at)}`}</p>
                  </div>
                </div>
                <div className="mt-3"><Breakdown a={act} /></div>
                {a.motivation && <p className="mt-3 text-[14px] text-gray-700 bg-gray-50 rounded-lg px-3 py-2 leading-relaxed">"{a.motivation}"</p>}
                {a.availability && <p className="mt-1.5 text-[13px] text-gray-500">Free: {a.availability}</p>}
                <div className="mt-3 flex flex-wrap gap-2">
                  <button onClick={() => decide(a.user_id, 'approved', a.display_name)} className="text-[13px] font-semibold px-3 py-1.5 rounded-lg bg-emerald-600 text-white cursor-pointer">Approve</button>
                  {a.status !== 'review' && <button onClick={() => decide(a.user_id, 'review', a.display_name)} className="text-[13px] font-semibold px-3 py-1.5 rounded-lg border border-gray-200 cursor-pointer">Under review</button>}
                  <button onClick={() => decide(a.user_id, 'declined', a.display_name)} className="text-[13px] font-semibold px-3 py-1.5 rounded-lg border border-gray-200 text-gray-500 cursor-pointer">Decline</button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="bg-white border border-gray-200 rounded-2xl p-5">
        <p className="text-[15px] font-bold text-gray-900 flex items-center gap-2"><UserPlus className="w-4 h-4 text-brand-600" /> Rising contributors</p>
        <p className="text-[13px] text-gray-500 mt-0.5">Most active in the last 14 days who have not applied. Call them, then press Invite to start a tracked trial for them.</p>
        <div className="mt-4 divide-y divide-gray-100">
          {data.rising.length === 0 && <p className="text-[14px] text-gray-400 py-3">No activity in the last 14 days yet.</p>}
          {data.rising.map((r, i) => (
            <div key={r.user_id} className="py-3 flex flex-wrap items-center gap-3">
              <span className="w-6 text-[13px] font-bold text-gray-400">{i + 1}</span>
              <div className="flex-1 min-w-[220px]">
                <p className="text-[14px] font-semibold text-gray-900">{r.display_name} <span className="text-[12px] font-normal text-gray-400">joined {fmtDate(r.joined_at)}</span></p>
                <Contact email={r.email} phone={r.phone} />
                <div className="mt-1.5"><Breakdown a={r} /></div>
              </div>
              <p className="text-xl font-bold tabular-nums text-gray-900 w-14 text-right">{r.score}</p>
              <button onClick={() => decide(r.user_id, 'invited', r.display_name)} className="text-[13px] font-semibold px-3 py-1.5 rounded-lg bg-brand-600 text-white cursor-pointer">Invite</button>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-white border border-gray-200 rounded-2xl p-5">
        <p className="text-[15px] font-bold text-gray-900 flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-emerald-600" /> Moderators</p>
        <div className="mt-3 divide-y divide-gray-100">
          {data.moderators.length === 0 && <p className="text-[14px] text-gray-400 py-3">No moderators yet.</p>}
          {data.moderators.map(m => (
            <div key={m.user_id} className="py-3 flex flex-wrap items-center justify-between gap-3">
              <div><p className="text-[14px] font-semibold text-gray-900">{m.display_name} <span className="text-[12px] font-normal text-gray-400">since {fmtDate(m.moderator_since)}</span></p><Contact email={m.email} phone={m.phone} /></div>
              <button onClick={() => remove(m.user_id, m.display_name)} className="text-[13px] font-semibold text-gray-400 hover:text-red-600 cursor-pointer">Remove</button>
            </div>
          ))}
        </div>
      </section>

      {past.length > 0 && (
        <section className="bg-white border border-gray-200 rounded-2xl p-5">
          <p className="text-[15px] font-bold text-gray-900">Past decisions</p>
          <div className="mt-3 divide-y divide-gray-100">
            {past.map(a => (
              <div key={a.user_id} className="py-2.5 flex items-center justify-between gap-3 text-[14px]">
                <span className="text-gray-800">{a.display_name}</span>
                <span className="flex items-center gap-3">
                  {a.admin_note && <span className="text-[12px] text-gray-400 truncate max-w-[220px]">{a.admin_note}</span>}
                  <span className={`text-[11px] font-bold uppercase px-2 py-0.5 rounded-full ${STATUS[a.status] || ''}`}>{a.status}</span>
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

const KIND_LABEL = { bug: '🐞 Bug', idea: '💡 Idea', content: '📄 Content', other: '💬 Other' };

export function PlatformFeedbackAdmin({ authHeaders }) {
  const [rows, setRows] = useState(null);
  const [show, setShow] = useState('new');

  useEffect(() => {
    fetch(`${API}/api/admin/platform-feedback`, { headers: authHeaders() })
      .then(r => r.json()).then(d => setRows(d.feedback || [])).catch(() => setRows([]));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function mark(id, status) {
    await fetch(`${API}/api/admin/platform-feedback/${id}`, { method: 'PATCH', headers: authHeaders(), body: JSON.stringify({ status }) });
    setRows(list => list.map(r => r.id === id ? { ...r, status } : r));
  }

  if (!rows) return <div className="h-48 bg-white border border-gray-200 rounded-2xl animate-pulse" />;
  const shown = rows.filter(r => show === 'all' || r.status === show);

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-[15px] font-bold text-gray-900">Problems and ideas from members</p>
        <div className="flex gap-1.5">
          {[['new', 'New'], ['seen', 'Seen'], ['done', 'Done'], ['all', 'All']].map(([id, l]) => (
            <button key={id} onClick={() => setShow(id)} className={`text-[13px] font-semibold px-3 py-1 rounded-full border cursor-pointer ${show === id ? 'bg-gray-900 text-white border-gray-900' : 'border-gray-200 text-gray-600'}`}>
              {l} {id !== 'all' && <span className="opacity-60">{rows.filter(r => r.status === id).length}</span>}
            </button>
          ))}
        </div>
      </div>
      <div className="mt-4 space-y-3">
        {shown.length === 0 && <p className="text-[14px] text-gray-400 py-3">Nothing here.</p>}
        {shown.map(r => (
          <div key={r.id} className="border border-gray-200 rounded-xl p-4">
            <div className="flex flex-wrap items-center justify-between gap-2 text-[13px]">
              <span className="font-semibold text-gray-800">{KIND_LABEL[r.kind] || r.kind} <span className="font-normal text-gray-400">· {r.display_name || 'Unknown'} · {r.page || '—'}</span></span>
              <span className="text-gray-400">{new Date(r.created_at).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
            </div>
            <p className="mt-2 text-[14px] text-gray-800 leading-relaxed whitespace-pre-wrap">{r.message}</p>
            <div className="mt-2.5 flex gap-2">
              {r.status !== 'seen' && <button onClick={() => mark(r.id, 'seen')} className="text-[12px] font-semibold px-2.5 py-1 rounded-lg border border-gray-200 cursor-pointer">Mark seen</button>}
              {r.status !== 'done' && <button onClick={() => mark(r.id, 'done')} className="text-[12px] font-semibold px-2.5 py-1 rounded-lg bg-emerald-600 text-white cursor-pointer inline-flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Done</button>}
              {r.status === 'done' && <span className="text-[12px] text-emerald-700 inline-flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Done</span>}
            </div>
          </div>
        ))}
      </div>
      <p className="mt-4 text-[12px] text-gray-400 flex items-center gap-1.5"><AlertTriangle className="w-3.5 h-3.5" /> Each message also adds to the sender's moderator activity score.</p>
    </div>
  );
}
