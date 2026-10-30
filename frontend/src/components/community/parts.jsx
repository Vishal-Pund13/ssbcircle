import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowBigUp, BadgeCheck, Share2, Check, Users, ShieldCheck, CalendarDays, ArrowRight } from 'lucide-react';
import { POST_TYPES, CategoryIcon } from './CategoryChip';

// Pieces shared by the community feed and the post page.

export function Avatar({ name, url, official, size = 'w-8 h-8' }) {
  const [broken, setBroken] = useState(false);
  if (official) {
    return (
      <div className={`${size} rounded-full bg-brand-600 flex items-center justify-center shrink-0`}>
        <BadgeCheck className="w-1/2 h-1/2 text-white" />
      </div>
    );
  }
  if (url && !broken) return <img src={url} alt="" referrerPolicy="no-referrer" onError={() => setBroken(true)} className={`${size} rounded-full object-cover shrink-0`} />;
  return (
    <div className={`${size} rounded-full bg-gradient-to-br from-brand-600 to-indigo-500 flex items-center justify-center text-[11px] font-bold text-white shrink-0`}>
      {(name || '?').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)}
    </div>
  );
}

export function ModBadge() {
  return (
    <span title="Community moderator" className="inline-flex items-center gap-0.5 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">
      <ShieldCheck className="w-3 h-3" /> MOD
    </span>
  );
}

// Reddit-style vote column
export function VoteRail({ voted, count, onVote, busy, vertical = true }) {
  return (
    <button type="button" onClick={e => { e.stopPropagation(); onVote(); }} disabled={busy}
      title={voted ? 'Remove your upvote' : 'Upvote'}
      className={`flex ${vertical ? 'flex-col' : 'flex-row gap-1.5 px-2.5 py-1.5 rounded-full'} items-center cursor-pointer transition-colors ${
        voted ? 'text-orange-600' : 'text-gray-400 hover:text-orange-600'}`}>
      <ArrowBigUp className={`w-6 h-6 ${voted ? 'fill-orange-500' : ''}`} />
      <span className={`text-sm font-bold tabular-nums ${voted ? 'text-orange-600' : 'text-gray-700'}`}>{count}</span>
    </button>
  );
}

export function ShareButton({ postId, title }) {
  const [copied, setCopied] = useState(false);
  async function share(e) {
    e.stopPropagation();
    const url = `${window.location.origin}/community/${postId}`;
    try {
      if (navigator.share) { await navigator.share({ title, url }); return; }
      await navigator.clipboard.writeText(url);
      setCopied(true); setTimeout(() => setCopied(false), 2000);
    } catch { /* cancelled */ }
  }
  return (
    <button type="button" onClick={share}
      className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:bg-gray-100 px-2.5 py-1.5 rounded-full cursor-pointer">
      {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Share2 className="w-4 h-4" />} {copied ? 'Link copied' : 'Share'}
    </button>
  );
}

const RULES = [
  'Be respectful. Everyone here is preparing, just like you.',
  'Share real experiences only. No made-up results or questions.',
  'No coaching ads, paid groups or selling.',
  'Do not post phone numbers or personal details in public.',
  'Keep it about the SSB, defence entries and preparation.',
];

export function CommunitySidebar({ postCount, onCompose, canPost }) {
  return (
    <div className="space-y-4">
      <section className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
        <div className="h-14 bg-gradient-to-r from-brand-600 to-indigo-500" />
        <div className="px-4 pb-4 -mt-6">
          <div className="w-12 h-12 rounded-xl bg-white border-4 border-white shadow flex items-center justify-center">
            <Users className="w-6 h-6 text-brand-600" />
          </div>
          <p className="mt-2 text-base font-bold text-gray-900">SSBCircle Community</p>
          <p className="text-sm text-gray-600 mt-1 leading-relaxed">
            Aspirants helping aspirants. Share how your SSB went, find batchmates for your dates, and ask what you are stuck on.
          </p>
          {postCount > 0 && <p className="text-xs text-gray-500 mt-2"><span className="font-bold text-gray-800">{postCount}</span> posts so far</p>}
          {canPost && (
            <button type="button" onClick={() => onCompose()} className="btn-primary text-sm w-full py-2.5 mt-3">Create a post</button>
          )}
        </div>
      </section>

      <section className="bg-white border border-gray-200 rounded-2xl p-4">
        <p className="text-sm font-bold text-gray-900">What you can post</p>
        <div className="mt-3 space-y-3">
          {POST_TYPES.slice(0, 3).map(t => (
            <button key={t.value} type="button" onClick={() => canPost && onCompose(t.value)}
              className={`w-full text-left flex items-start gap-3 ${canPost ? 'cursor-pointer group' : 'cursor-default'}`}>
              <CategoryIcon category={t.value} />
              <span>
                <span className="block text-sm font-semibold text-gray-900 group-hover:text-brand-700">{t.title}</span>
                <span className="block text-xs text-gray-500 leading-relaxed mt-0.5">{t.hint}</span>
              </span>
            </button>
          ))}
        </div>
      </section>

      <section className="bg-white border border-gray-200 rounded-2xl p-4">
        <p className="text-sm font-bold text-gray-900 flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-brand-600" /> Community rules</p>
        <ol className="mt-3 space-y-2">
          {RULES.map((r, i) => (
            <li key={i} className="flex gap-2.5 text-xs text-gray-600 leading-relaxed">
              <span className="font-bold text-gray-400 w-3 shrink-0">{i + 1}</span>{r}
            </li>
          ))}
        </ol>
      </section>

      <Link to="/moderators" className="block relative overflow-hidden rounded-2xl p-4 bg-gradient-to-br from-emerald-600 to-teal-500 text-white">
        <ShieldCheck className="absolute -right-3 -bottom-3 w-20 h-20 opacity-20" aria-hidden="true" />
        <p className="relative text-sm font-bold">Become a moderator</p>
        <p className="relative text-xs text-white/90 mt-1 leading-relaxed">Host sessions, help others and keep the community safe. Earn a stipend and a MOD badge.</p>
        <span className="relative mt-2.5 inline-flex items-center gap-1 text-xs font-bold">Learn more <ArrowRight className="w-3.5 h-3.5" /></span>
      </Link>

      <Link to="/exams?tab=upcoming" className="flex items-center gap-3 bg-white border border-gray-200 rounded-2xl p-4 hover:border-brand-200 transition-colors">
        <CalendarDays className="w-5 h-5 text-brand-600 shrink-0" />
        <span>
          <span className="block text-sm font-semibold text-gray-900">Exam calendar</span>
          <span className="block text-xs text-gray-500">NDA, CDS, AFCAT dates and results</span>
        </span>
      </Link>
    </div>
  );
}
