import { useEffect, useState } from 'react';
import { MENTORS } from '../../data/mentors';

// Aspirants sent to mentors. Each WhatsApp introduction carries the code in
// the first column, so referrals can be matched with the mentor's chats.

const API = import.meta.env.VITE_API_URL || 'http://localhost:4000';

const SOURCE_LABEL = {
  mentor_page: 'Mentor profile', piq_report: 'After PIQ report', tat_report: 'After TAT feedback',
  prep_sheet: 'Prep Sheet', article: 'SSB tips article', how_it_works: 'How SSBCircle works', unknown: 'Other',
};
const mentorName = slug => MENTORS.find(m => m.slug === slug)?.name || slug;

export default function MentorReferrals({ authHeaders }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`${API}/api/admin/mentor-referrals`, { headers: authHeaders() })
      .then(r => (r.ok ? r.json() : Promise.reject()))
      .then(setData)
      .catch(() => setError('Could not load mentor referrals.'));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (error) return <p className="text-[14px] text-red-600 bg-red-50 border border-red-100 rounded-lg px-4 py-3">{error}</p>;
  if (!data) return <p className="text-[14px] text-gray-400">Loading…</p>;

  return (
    <div className="space-y-5">
      <div className="grid sm:grid-cols-2 gap-3">
        {data.by_mentor.length === 0 && (
          <div className="bg-white border border-gray-200 rounded-xl p-4 text-sm text-gray-500">No referrals yet.</div>
        )}
        {data.by_mentor.map(m => (
          <div key={m.mentor_slug} className="bg-white border border-gray-200 rounded-xl p-4">
            <p className="text-[12px] font-semibold text-gray-500">{mentorName(m.mentor_slug)}</p>
            <p className="mt-1 text-2xl font-bold text-gray-900 tabular-nums">{m.total}</p>
            <p className="text-xs text-gray-500">aspirants sent · {m.last_30_days} in the last 30 days</p>
          </div>
        ))}
      </div>

      {data.by_source.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-[12px] font-semibold text-gray-500 mb-2">Where they tapped from</p>
          <div className="flex flex-wrap gap-2">
            {data.by_source.map(s => (
              <span key={s.source} className="text-[12px] font-semibold text-gray-700 bg-gray-50 border border-gray-200 rounded-full px-3 py-1">
                {SOURCE_LABEL[s.source] || s.source} <span className="text-gray-400">· {s.n}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-xl overflow-x-auto">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
              <th className="px-4 py-3">Code</th><th className="px-4 py-3">Aspirant</th><th className="px-4 py-3">Entry</th>
              <th className="px-4 py-3">From</th><th className="px-4 py-3">Mentor</th><th className="px-4 py-3">When</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {data.referrals.map(r => (
              <tr key={r.code}>
                <td className="px-4 py-2.5 font-mono font-semibold text-gray-900 whitespace-nowrap">{r.code}</td>
                <td className="px-4 py-2.5 text-gray-700">{r.display_name || <span className="text-gray-400">Not signed in</span>}{r.phone && <span className="block text-xs text-gray-400">{r.phone}</span>}</td>
                <td className="px-4 py-2.5 text-gray-600">{r.entry || '—'}</td>
                <td className="px-4 py-2.5 text-gray-600 whitespace-nowrap">{SOURCE_LABEL[r.source] || r.source || '—'}</td>
                <td className="px-4 py-2.5 text-gray-600 whitespace-nowrap">{mentorName(r.mentor_slug)}</td>
                <td className="px-4 py-2.5 text-gray-500 whitespace-nowrap">{new Date(r.created_at).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {data.referrals.length === 0 && <p className="px-4 py-8 text-center text-sm text-gray-400">No referrals yet.</p>}
      </div>

      <p className="text-[12px] text-gray-400">
        A row is saved when an aspirant taps "Continue to WhatsApp". Whether they then press send happens in WhatsApp, so match the code with the mentor's chats.
      </p>
    </div>
  );
}
