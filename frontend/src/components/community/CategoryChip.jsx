// Shared between the feed and the post page so a category always looks the same.
//
// Announcement is deliberately the loudest: it means the post came from the
// team, and aspirants cannot give their own posts that label.
const STYLES = {
  announcement: 'bg-amber-50  text-amber-700  border-amber-200',
  session:      'bg-brand-50  text-brand-700  border-brand-100',
  doubt:        'bg-emerald-50 text-emerald-700 border-emerald-200',
  discussion:   'bg-gray-100  text-gray-600   border-gray-200',
};

const LABELS = {
  announcement: 'Announcement',
  session:      'Session',
  doubt:        'Doubt',
  discussion:   'Discussion',
};

export default function CategoryChip({ category }) {
  const key = STYLES[category] ? category : 'discussion';
  return (
    <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full border ${STYLES[key]}`}>
      {LABELS[key]}
    </span>
  );
}

export function timeAgo(iso) {
  const secs = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (secs < 60)    return 'just now';
  if (secs < 3600)  return Math.floor(secs / 60) + 'm ago';
  if (secs < 86400) return Math.floor(secs / 3600) + 'h ago';
  if (secs < 604800) return Math.floor(secs / 86400) + 'd ago';
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}
