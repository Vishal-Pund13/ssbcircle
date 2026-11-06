import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getCommunityFeed, getCommunityPulse } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { MessageSquare, ArrowBigUp, ArrowRight, PenLine, BadgeCheck, Users, UserPlus, Radio } from 'lucide-react';
import CategoryChip, { CategoryIcon, timeAgo } from './community/CategoryChip';
import StayNotified from './StayNotified';

// The community block on the home page: a place to ask, next to what others
// are asking.
//
// Two things drive the layout. Asking is the hard first step on any board, so
// the composer sits on the home page itself with ready-made questions — a
// narrow prompt gets typed into, an empty box gets scrolled past. And posts are
// a plain list rather than a moving strip, because a list can be read, and an
// unanswered post says "be the first to reply", which is the easiest way in.
//
// It sits near the top of the home page, led by what real aspirants did in
// the last hours (the pulse), because that tells a first-time visitor the site
// is alive and worth joining. Every name and number is real.
//
// Renders nothing when there is nothing to show and nothing anyone may post:
// an empty block advertises an empty site.

const PROMPTS = [
  // label is the button text; title (doubts only) is pre-filled as the post title
  { category: 'experience', label: 'Share how your last SSB went' },
  { category: 'ssb_date',   label: 'Post your SSB date and find batchmates' },
  { category: 'doubt',      label: 'How should I prepare for the OIR test?', title: 'How should I prepare for the OIR test?' },
  { category: 'doubt',      label: 'What do I write in PPDT if the picture is unclear?', title: 'What do I write in PPDT if the picture is unclear?' },
];

const MAX_POSTS = 4;
const AVATAR_BG = ['bg-blue-600', 'bg-emerald-600', 'bg-purple-600', 'bg-rose-600', 'bg-teal-600', 'bg-amber-600'];

// A number is only shown once it is big enough to impress rather than worry
const STATS = [
  { key: 'members',      min: 50, icon: Users,         text: n => `${n} aspirants on SSBCircle` },
  { key: 'joined_week',  min: 5,  icon: UserPlus,      text: n => `${n} joined this week` },
  { key: 'replies_week', min: 5,  icon: MessageSquare, text: n => `${n} replies this week` },
  { key: 'active_week',  min: 10, icon: Radio,         text: n => `${n} active this week` },
];

const short = t => (t && t.length > 48 ? t.slice(0, 46) + '…' : t);
const Topic = ({ t }) => <span className="font-semibold text-gray-800">“{short(t)}”</span>;
const ACTION = {
  reply: e => <>replied on <Topic t={e.topic} /></>,
  post:  e => <>posted <Topic t={e.topic} /></>,
  going: e => <>is in for <Topic t={e.topic} /></>,
  room:  e => <>started a room: <Topic t={e.topic} /></>,
  join:  () => <>joined SSBCircle</>,
};

function Face({ name, avatar }) {
  if (avatar) return <img src={avatar} alt="" referrerPolicy="no-referrer" className="w-8 h-8 rounded-full object-cover shrink-0" />;
  const bg = AVATAR_BG[(name || '?').charCodeAt(0) % AVATAR_BG.length];
  return <span className={`w-8 h-8 rounded-full ${bg} text-white text-xs font-bold flex items-center justify-center shrink-0`}>{(name || '?')[0].toUpperCase()}</span>;
}

function ActivityFeed({ events }) {
  // Two replies in a row from one person on one post read as one thing
  const list = events.filter((e, i) => {
    const p = events[i - 1];
    return !p || p.kind !== e.kind || p.name !== e.name || p.topic !== e.topic;
  }).slice(0, 6);
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-4 sm:p-5 h-full">
      <p className="flex items-center gap-2 text-sm font-bold text-gray-900">
        <span className="relative flex w-2.5 h-2.5">
          <span className="absolute inline-flex w-full h-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
          <span className="relative inline-flex w-2.5 h-2.5 rounded-full bg-emerald-500" />
        </span>
        Happening now
      </p>
      <ul className="mt-3 flex flex-col gap-2">
        {list.map((e, i) => {
          const row = (
            <>
              <Face name={e.name} avatar={e.avatar} />
              <span className="min-w-0 flex-1 text-[13px] text-gray-600 leading-snug">
                <span className="font-bold text-gray-900">{e.name}</span> {ACTION[e.kind]?.(e)}
                <span className="block text-[11px] text-gray-400 mt-0.5">{timeAgo(e.at)}</span>
              </span>
            </>
          );
          return (
            <li key={i}>
              {e.link
                ? <Link to={e.link} className="flex items-start gap-2.5 rounded-lg -mx-1.5 px-1.5 py-1 hover:bg-gray-50">{row}</Link>
                : <div className="flex items-start gap-2.5 py-1">{row}</div>}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function composeHref({ category, title } = {}) {
  const q = new URLSearchParams({ compose: '1' });
  if (category) q.set('category', category);
  if (title)    q.set('title', title);
  return `/community?${q}`;
}

function PostRow({ post }) {
  const unanswered = post.comment_count === 0;
  return (
    <Link
      to={`/community/${post.id}`}
      className="group block bg-white border border-gray-200 rounded-xl px-4 py-3.5 hover:border-brand-300 hover:shadow-sm transition-all">
      <div className="flex items-center justify-between gap-2">
        <CategoryChip category={post.category} />
        <span className="text-[11px] text-gray-400 shrink-0">{timeAgo(post.created_at)}</span>
      </div>

      <p className="mt-2 text-sm font-bold text-gray-900 leading-snug line-clamp-2 group-hover:text-brand-700 transition-colors">
        {post.title}
      </p>

      <div className="mt-2.5 flex items-center gap-3 text-[12px] text-gray-400">
        <span className="inline-flex items-center gap-1 truncate max-w-[140px]">
          {post.is_official && <BadgeCheck className="w-3 h-3 text-brand-600 shrink-0" />}
          <span className={post.is_official ? 'font-semibold text-brand-600 truncate' : 'truncate'}>
            {post.author_name || 'Someone'}
          </span>
        </span>
        <span className="inline-flex items-center gap-1 shrink-0"><ArrowBigUp className="w-3 h-3" />{post.upvotes}</span>
        {unanswered ? (
          <span className="ml-auto shrink-0 font-semibold text-emerald-700">Be the first to reply</span>
        ) : (
          <span className="ml-auto inline-flex items-center gap-1 shrink-0">
            <MessageSquare className="w-3 h-3" />
            {post.comment_count} {post.comment_count === 1 ? 'reply' : 'replies'}
          </span>
        )}
      </div>
    </Link>
  );
}

function AskBox({ user }) {
  const navigate = useNavigate();

  // Signed out: send them through sign-in and straight back to the composer
  function go(prompt) {
    const href = composeHref(prompt);
    if (user) { navigate(href); return; }
    const [pathname, search] = href.split('?');
    navigate('/login', { state: { from: { pathname, search: `?${search}` } } });
  }

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-4 sm:p-5 flex flex-col gap-3.5 h-full">
      <div>
        <p className="text-sm font-bold text-gray-900">Share, find batchmates, or ask.</p>
        <p className="mt-0.5 text-xs text-gray-500">Post how your SSB went, your upcoming SSB date, or any doubt. Anyone can reply.</p>
      </div>

      {/* Looks like an input, opens the real composer */}
      <button type="button" onClick={() => go()}
        className="w-full flex items-center gap-2.5 text-left text-sm text-gray-400 bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-3 hover:border-brand-300 hover:bg-white transition-colors cursor-pointer">
        <PenLine className="w-4 h-4 text-brand-600 shrink-0" />
        Share your SSB experience, date or doubt…
      </button>

      <div>
        <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-2">Or start with one of these</p>
        <div className="flex flex-col gap-1.5">
          {PROMPTS.map(p => (
            <button key={p.label} type="button" onClick={() => go(p)}
              className="group w-full flex items-center justify-between gap-2 text-left text-xs font-medium text-gray-700 border border-gray-100 rounded-lg px-3 py-2 hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700 transition-colors cursor-pointer">
              <span className="flex items-center gap-2 min-w-0"><CategoryIcon category={p.category} size="sm" /><span className="line-clamp-1">{p.label}</span></span>
              <ArrowRight className="w-3 h-3 shrink-0 text-gray-300 group-hover:text-brand-600" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function CommunityHighlights() {
  const { user } = useAuth();
  const [posts,   setPosts]   = useState([]);
  const [canPost, setCanPost] = useState(false);
  const [pulse,   setPulse]   = useState(null);

  useEffect(() => {
    let cancelled = false;
    getCommunityFeed({ limit: 12 })
      .then(({ posts: list, can_post }) => {
        if (cancelled) return;
        setPosts(list || []);
        setCanPost(!!can_post);
      })
      .catch(() => {});       // the home page should never break over this
    getCommunityPulse().then(p => { if (!cancelled) setPulse(p); }).catch(() => {});
    return () => { cancelled = true; };
  }, []);

  if (posts.length === 0 && !canPost) return null;

  // Pinned first, then posts still waiting for a reply — those are where a
  // visitor's one comment matters most.
  const rank  = p => (p.is_pinned ? 2 : 0) + (p.comment_count === 0 ? 1 : 0);
  const shown = [...posts]
    .sort((a, b) => (rank(b) - rank(a)) || (new Date(b.created_at) - new Date(a.created_at)))
    .slice(0, MAX_POSTS);

  const events = pulse?.events || [];
  const stats  = STATS.filter(st => (pulse?.stats?.[st.key] || 0) >= st.min);

  return (
    <section className="border-t border-gray-100 bg-gray-50 px-4 sm:px-6 py-10 sm:py-14">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.25em] text-brand-600">
              <span className="w-2 h-2 rounded-full bg-emerald-500" /> Community is active
            </p>
            <h2 className="mt-1.5 text-xl sm:text-2xl font-bold text-gray-900 leading-tight">
              Real aspirants, preparing together
            </h2>
          </div>
          <Link to="/community"
            className="shrink-0 inline-flex items-center gap-1.5 text-xs font-bold text-brand-600 hover:text-brand-700">
            See all <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {stats.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {stats.map(({ key, icon: Icon, text }) => (
              <span key={key} className="inline-flex items-center gap-1.5 bg-white border border-gray-200 rounded-full px-3 py-1.5 text-xs font-semibold text-gray-700">
                <Icon className="w-3.5 h-3.5 text-brand-600" /> {text(pulse.stats[key])}
              </span>
            ))}
          </div>
        )}

        {/* Desktop: what is happening | the posts and a way to join in | stay notified */}
        <div className="mt-5 grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
          {events.length > 0 && <ActivityFeed events={events} />}
          {(shown.length > 0 || canPost) && (
            <div className="flex flex-col gap-3">
              {shown.map(post => <PostRow key={post.id} post={post} />)}
              {canPost && <AskBox user={user} />}
            </div>
          )}
          <StayNotified />
        </div>
      </div>
    </section>
  );
}
