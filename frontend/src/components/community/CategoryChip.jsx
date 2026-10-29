// Shared between the feed, the post page and the home page so a category
// always looks the same.
//
// Announcement is deliberately the loudest: it means the post came from the
// team, and aspirants cannot give their own posts that label.

export const CATEGORY_META = {
  announcement: { label: 'Announcement',  emoji: '📣', cls: 'bg-amber-50  text-amber-700  border-amber-200' },
  session:      { label: 'Session',       emoji: '🎙️', cls: 'bg-brand-50  text-brand-700  border-brand-100' },
  experience:   { label: 'SSB Experience', emoji: '📝', cls: 'bg-violet-50 text-violet-700 border-violet-200' },
  ssb_date:     { label: 'Upcoming SSB',  emoji: '📅', cls: 'bg-sky-50    text-sky-700    border-sky-200' },
  doubt:        { label: 'Doubt',         emoji: '❓', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  discussion:   { label: 'Discussion',    emoji: '💬', cls: 'bg-gray-100  text-gray-600   border-gray-200' },
};

// What aspirants can post, with guidance and a fill-in template for each.
export const POST_TYPES = [
  {
    value: 'experience',
    title: 'Share your SSB experience',
    short: 'Experience',
    hint: 'Your board, entry, result and what you learnt. The most useful thing you can give the next batch.',
    titlePlaceholder: 'e.g. 18 SSB Bhopal, CDS (I) 2026 — Recommended in my 2nd attempt',
    template:
`Board and entry:
Dates:
Result (Recommended / Conference out / Screened out):

Day 1 — Screening (OIR, PPDT):

Psychology (TAT, WAT, SRT, SD):

GTO:

Interview:

What I would tell the next batch: `,
  },
  {
    value: 'ssb_date',
    title: 'Post your upcoming SSB',
    short: 'Upcoming SSB',
    hint: 'Your board, date and entry. Find batchmates reporting on the same dates and prepare together.',
    titlePlaceholder: 'e.g. Reporting at 11 SSB Allahabad on 12 Dec — AFCAT',
    template:
`Board:
Reporting date:
Entry:
Attempt (1st / 2nd / …):

Anyone else on these dates? Happy to practise GD or interview together.`,
  },
  {
    value: 'doubt',
    title: 'Ask a doubt',
    short: 'Doubt',
    hint: 'Anything about the SSB, your prep, eligibility, documents or entries. Be specific so people can help.',
    titlePlaceholder: 'e.g. How should I answer "Why the Army?" without sounding rehearsed?',
    template: '',
  },
  {
    value: 'discussion',
    title: 'Start a discussion',
    short: 'Discussion',
    hint: 'A topic, a news item or a GD subject you want views on.',
    titlePlaceholder: 'e.g. Should India bring back conscription? Views for a GD',
    template: '',
  },
];

export default function CategoryChip({ category, size = 'sm' }) {
  const m = CATEGORY_META[category] || CATEGORY_META.discussion;
  return (
    <span className={`inline-flex items-center gap-1 font-semibold rounded-full border whitespace-nowrap ${m.cls} ${
      size === 'sm' ? 'text-[11px] px-2 py-0.5' : 'text-xs px-2.5 py-1'}`}>
      <span aria-hidden="true">{m.emoji}</span>{m.label}
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
