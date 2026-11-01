import { useEffect, useState } from 'react';
import { SECTION_LABEL } from './Insights';

// Who is on the site right now. A visible tab pings once a minute, so anyone
// seen in the last two minutes counts as online. Refreshes itself every 30s.

const API = import.meta.env.VITE_API_URL || 'http://localhost:4000';
const REFRESH_MS = 30_000;

export function useOnline(authHeaders, onAuthFail) {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => {
    let alive = true;
    async function load() {
      try {
        const res = await fetch(`${API}/api/admin/online`, { headers: authHeaders() });
        if (res.status === 401 || res.status === 403) return onAuthFail();
        if (!res.ok) throw new Error();
        const d = await res.json();
        if (alive) { setData(d); setError(''); }
      } catch {
        if (alive) setError('Could not load who is online.');
      }
    }
    load();
    const t = setInterval(load, REFRESH_MS);
    return () => { alive = false; clearInterval(t); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  return { data, error };
}

function ago(ts) {
  const s = Math.max(0, Math.floor((Date.now() - new Date(ts)) / 1000));
  return s < 60 ? 'just now' : `${Math.floor(s / 60)} min ago`;
}

function Photo({ u }) {
  const [broken, setBroken] = useState(false);
  if (u.avatar_url && !broken) return <img src={u.avatar_url} alt="" referrerPolicy="no-referrer" onError={() => setBroken(true)} className="w-8 h-8 rounded-full object-cover shrink-0" />;
  return (
    <span className="w-8 h-8 rounded-full bg-brand-600 text-white text-[11px] font-bold flex items-center justify-center shrink-0">
      {(u.display_name || '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
    </span>
  );
}

export default function OnlineNow({ online }) {
  const { data, error } = online;
  if (error && !data) return <p className="text-[14px] text-red-600 bg-red-50 border border-red-100 rounded-lg px-4 py-3">{error}</p>;
  if (!data) return <p className="text-[14px] text-gray-400">Loading…</p>;

  const sections = Object.entries(data.sections).sort((a, b) => b[1] - a[1]);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-3 gap-3">
        {[['Online now', data.total], ['Signed in', data.signed_in], ['Guests', data.guests]].map(([label, n], i) => (
          <div key={label} className="bg-white border border-gray-200 rounded-xl p-4">
            <p className="text-[12px] font-semibold text-gray-500 flex items-center gap-1.5">
              {i === 0 && <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />} {label}
            </p>
            <p className="mt-1 text-2xl font-bold text-gray-900 tabular-nums">{n}</p>
          </div>
        ))}
      </div>

      {sections.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-[12px] font-semibold text-gray-500 mb-2">Where they are</p>
          <div className="flex flex-wrap gap-2">
            {sections.map(([s, n]) => (
              <span key={s} className="text-[12px] font-semibold text-gray-700 bg-gray-50 border border-gray-200 rounded-full px-3 py-1">
                {SECTION_LABEL[s] || s} <span className="text-gray-400">· {n}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <p className="px-4 py-3 text-[12px] font-semibold text-gray-500 border-b border-gray-100">Signed-in members online</p>
        {data.users.length === 0 ? (
          <p className="px-4 py-6 text-[14px] text-gray-400">No signed-in members online right now.</p>
        ) : (
          <ul className="divide-y divide-gray-50">
            {data.users.map(u => (
              <li key={u.id} className="px-4 py-3 flex items-center gap-3">
                <Photo u={u} />
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-medium text-gray-900 truncate">
                    {u.display_name}
                    {u.exam_type && <span className="ml-2 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-brand-50 text-brand-700">{u.exam_type}</span>}
                  </p>
                  <p className="text-[12px] text-gray-500 truncate">{SECTION_LABEL[u.section] || u.section} · <span className="text-gray-400">{u.path}</span></p>
                </div>
                <span className="text-[11px] text-gray-400 whitespace-nowrap">{ago(u.last_seen)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <p className="text-[12px] text-gray-400">
        Online means a tab was open and in view in the last two minutes. Refreshes every 30 seconds. Guests are counted, not named.
      </p>
    </div>
  );
}
