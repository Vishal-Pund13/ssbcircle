import { useState, useEffect, useMemo, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getCommunityFeed, createCommunityPost, voteCommunityPost } from '../services/api';
import { MessageSquare, Pin, Lock, AlertCircle, Flame, Clock, TrendingUp, X, FileText, PenLine, Users } from 'lucide-react';
import CategoryChip, { CATEGORY_META, CategoryIcon, POST_TYPES, timeAgo } from './community/CategoryChip';
import { Avatar, VoteRail, ShareButton, CommunitySidebar, ModBadge } from './community/parts';
import SiteNav from './SiteNav';
import { CoverBand } from './PageCover';
import { trackEvent } from '../analytics';

// The community feed, laid out like Reddit and Facebook because most
// aspirants already know how to use those: a composer at the top, sort tabs,
// flair filters, posts with a vote rail, and the community's purpose and rules
// in a sidebar.
//
// Reading works signed out on purpose: a visitor arriving from search should
// see a live board rather than a sign-in wall.

const OPEN_CATEGORIES = POST_TYPES.map(t => t.value);
const FLAIRS = [
  { id: 'all', label: 'All' },
  { id: 'experience', label: 'Experiences' },
  { id: 'ssb_date', label: 'Upcoming SSB' },
  { id: 'doubt', label: 'Doubts' },
  { id: 'discussion', label: 'Discussion' },
  { id: 'announcement', label: 'Announcements' },
];
const SORTS = [
  { id: 'hot', label: 'Hot', icon: Flame },
  { id: 'new', label: 'New', icon: Clock },
  { id: 'top', label: 'Top', icon: TrendingUp },
];

// A post with only a title reads as an empty row. Showing the first few
// lines is most of what makes a board look like a board.
const excerpt = (body, max = 280) => {
  const flat = String(body || '').replace(/\s+/g, ' ').trim();
  return flat.length > max ? flat.slice(0, max).trimEnd() + '…' : flat;
};

// Reddit-style "hot": activity, decayed by age
const hotScore = p => {
  const hours = (Date.now() - new Date(p.created_at).getTime()) / 3600000;
  return (p.upvotes + p.comment_count * 2 + 1) / Math.pow(hours + 2, 1.5);
};

function PostCard({ post, onVote, busy }) {
  const navigate = useNavigate();
  const open = () => navigate(`/community/${post.id}`);
  return (
    <article onClick={open}
      className={`group flex bg-white border rounded-2xl overflow-hidden cursor-pointer hover:border-gray-300 transition-colors ${post.is_pinned ? 'border-amber-200' : 'border-gray-200'}`}>
      <div className="hidden sm:flex w-14 shrink-0 bg-gray-50/80 justify-center pt-3">
        <VoteRail voted={post.voted} count={post.upvotes} onVote={() => onVote(post)} busy={busy} />
      </div>

      <div className="flex-1 min-w-0 px-4 py-3.5">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-gray-500">
          <Avatar name={post.author_name} url={post.author_avatar} official={post.is_official} size="w-5 h-5" />
          <span className={`font-semibold ${post.is_official ? 'text-brand-700' : 'text-gray-800'}`}>{post.author_name || 'Someone'}</span>
          {post.author_is_mod && <ModBadge />}
          <span>· {timeAgo(post.created_at)}</span>
          <CategoryChip category={post.category} />
          {post.is_pinned && <span className="inline-flex items-center gap-1 text-amber-600 font-semibold"><Pin className="w-3 h-3" /> Pinned</span>}
          {post.is_locked && <Lock className="w-3 h-3 text-gray-400" />}
        </div>

        <h2 className="mt-2 text-[17px] font-bold text-gray-900 leading-snug group-hover:text-brand-700 transition-colors">{post.title}</h2>
        {post.body && <p className="mt-1.5 text-sm text-gray-600 leading-relaxed line-clamp-3">{excerpt(post.body)}</p>}

        <div className="mt-3 flex items-center gap-1 -ml-2.5">
          <span className="sm:hidden"><VoteRail voted={post.voted} count={post.upvotes} onVote={() => onVote(post)} busy={busy} vertical={false} /></span>
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:bg-gray-100 px-2.5 py-1.5 rounded-full">
            <MessageSquare className="w-4 h-4" />
            {post.comment_count} {post.comment_count === 1 ? 'comment' : 'comments'}
          </span>
          <ShareButton postId={post.id} title={post.title} />
          {post.comment_count === 0 && !post.is_locked && (
            <span className="ml-auto text-xs font-semibold text-emerald-700 hidden xs:inline">Be the first to reply</span>
          )}
        </div>
      </div>
    </article>
  );
}

function Composer({ user, initialType, initialTitle, onCancel, onPublished }) {
  const [type, setType] = useState(initialType || 'experience');
  const [title, setTitle] = useState(initialTitle || '');
  const [body, setBody] = useState('');
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState('');
  const t = POST_TYPES.find(x => x.value === type);

  async function publish(e) {
    e.preventDefault();
    setPosting(true); setError('');
    try {
      const post = await createCommunityPost({ title: title.trim(), body: body.trim(), category: type });
      trackEvent('community_post', { type });
      onPublished(post);
    } catch (err) {
      setError(err.message || 'Could not publish your post.');
    } finally {
      setPosting(false);
    }
  }

  return (
    <form onSubmit={publish} className="bg-white border border-gray-200 rounded-2xl p-4 sm:p-5 space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-base font-bold text-gray-900">Create a post</p>
        <button type="button" onClick={onCancel} className="p-1.5 rounded-full hover:bg-gray-100 cursor-pointer" aria-label="Close">
          <X className="w-4 h-4 text-gray-500" />
        </button>
      </div>

      <div>
        <p className="text-xs font-semibold text-gray-600 mb-2">What are you posting?</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {POST_TYPES.map(pt => (
            <button key={pt.value} type="button" onClick={() => setType(pt.value)}
              className={`text-left px-3 py-2.5 rounded-xl border cursor-pointer transition-colors ${type === pt.value
                ? 'border-brand-600 bg-brand-50 ring-2 ring-brand-100' : 'border-gray-200 hover:border-gray-300'}`}>
              <CategoryIcon category={pt.value} size="sm" />
              <span className="block text-sm font-semibold text-gray-900 mt-0.5">{pt.short}</span>
            </button>
          ))}
        </div>
        <p className="mt-2 text-xs text-gray-500 leading-relaxed">{t.hint}</p>
      </div>

      <div className="flex items-center gap-2.5">
        <Avatar name={user.display_name} url={user.avatar_url} />
        <input className="flex-1 text-[15px] font-semibold border border-gray-200 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-brand-400"
          placeholder={t.titlePlaceholder} value={title} onChange={e => setTitle(e.target.value)} maxLength={200} autoFocus />
      </div>

      <div>
        <textarea className="w-full text-sm border border-gray-200 rounded-xl px-3.5 py-3 min-h-[160px] leading-relaxed focus:outline-none focus:border-brand-400"
          placeholder={type === 'doubt' ? 'Give enough detail that someone can actually help.' : 'Write it in your own words.'}
          value={body} onChange={e => setBody(e.target.value)} maxLength={8000} />
        {t.template && !body && (
          <button type="button" onClick={() => setBody(t.template)}
            className="mt-1.5 inline-flex items-center gap-1.5 text-xs font-semibold text-brand-600 hover:text-brand-800 cursor-pointer">
            <FileText className="w-3.5 h-3.5" /> Use a template to fill in
          </button>
        )}
      </div>

      {error && <p className="text-xs text-red-600 flex items-start gap-1.5"><AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" /> {error}</p>}

      <div className="flex items-center justify-between gap-3 pt-1 border-t border-gray-100">
        <p className="text-[12px] text-gray-400 pt-3">Be respectful and keep it real. No phone numbers or ads.</p>
        <div className="flex gap-2 pt-3">
          <button type="button" onClick={onCancel} className="btn-secondary text-sm px-4 py-2">Cancel</button>
          <button type="submit" disabled={posting || title.trim().length < 5 || !body.trim()} className="btn-primary text-sm px-5 py-2">
            {posting ? 'Posting…' : 'Post'}
          </button>
        </div>
      </div>
    </form>
  );
}

export default function CommunityPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  // The home page links here with ?compose=1&category=&title= to open a
  // half-written post, so asking takes one tap instead of a blank form.
  const [params, setParams] = useSearchParams();
  const wantsCompose = params.get('compose') === '1';
  const topRef = useRef(null);

  const [posts,   setPosts]   = useState([]);
  const [canPost, setCanPost] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');
  const [busy,    setBusy]    = useState(false);
  const [sort,    setSort]    = useState('hot');
  const [flair,   setFlair]   = useState('all');

  const [composer, setComposer] = useState(null);   // null | { type, title }
  const prefill = useRef({
    type: OPEN_CATEGORIES.includes(params.get('category')) ? params.get('category') : 'doubt',
    title: (params.get('title') || '').slice(0, 200),
  });

  useEffect(() => {
    let cancelled = false;
    getCommunityFeed({ limit: 50 })
      .then(({ posts: list, can_post }) => {
        if (cancelled) return;
        setPosts(list);
        setCanPost(can_post);
      })
      .catch(() => { if (!cancelled) setError('Could not load the community.'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  // Open the composer only once we know this person may post
  useEffect(() => {
    if (!wantsCompose || loading) return;
    if (canPost && user) setComposer(prefill.current);
    setParams({}, { replace: true });
  }, [wantsCompose, loading, canPost, user]); // eslint-disable-line react-hooks/exhaustive-deps

  function compose(type) {
    if (!user) { navigate('/login', { state: { from: { pathname: '/community' } } }); return; }
    setComposer({ type: type || 'experience', title: '' });
    setTimeout(() => topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
  }

  // Optimistic: the count moves immediately and is corrected by the response.
  async function vote(post) {
    if (!user) { navigate('/login'); return; }
    setBusy(true);
    setPosts(list => list.map(p => p.id === post.id
      ? { ...p, voted: !p.voted, upvotes: p.upvotes + (p.voted ? -1 : 1) }
      : p));
    try {
      const { voted, upvotes } = await voteCommunityPost(post.id);
      setPosts(list => list.map(p => p.id === post.id ? { ...p, voted, upvotes } : p));
    } catch {
      setPosts(list => list.map(p => p.id === post.id
        ? { ...p, voted: post.voted, upvotes: post.upvotes }
        : p));
    } finally {
      setBusy(false);
    }
  }

  const shown = useMemo(() => {
    const list = posts.filter(p => flair === 'all' || p.category === flair);
    const pinned = list.filter(p => p.is_pinned);
    const rest = list.filter(p => !p.is_pinned);
    if (sort === 'new') rest.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    if (sort === 'top') rest.sort((a, b) => (b.upvotes - a.upvotes) || (b.comment_count - a.comment_count));
    if (sort === 'hot') rest.sort((a, b) => hotScore(b) - hotScore(a));
    return [...pinned, ...rest];
  }, [posts, sort, flair]);

  return (
    <div className="min-h-screen bg-gray-100/70">
      <SiteNav />

      {/* Community banner */}
      <div className="bg-white border-b border-gray-200">
        <CoverBand scene="community" />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-4">
          {/* Only the badge overlaps the cover; the title stays on white */}
          <div className="flex items-end gap-4">
            <div className="-mt-8 shrink-0 w-16 h-16 sm:w-[72px] sm:h-[72px] rounded-2xl bg-white border-4 border-white shadow-md flex items-center justify-center text-brand-600"><Users className="w-8 h-8" /></div>
            <div className="pt-3 min-w-0 flex-1">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">SSBCircle Community</h1>
              <p className="text-sm text-gray-500 truncate">Experiences, upcoming SSBs and doubts — from aspirants, for aspirants</p>
            </div>
            {canPost && (
              <button type="button" onClick={() => compose()} className="hidden sm:inline-flex btn-primary text-sm px-5 py-2.5 mb-1 items-center gap-1.5">
                <PenLine className="w-4 h-4" /> Create post
              </button>
            )}
          </div>
        </div>
      </div>

      <div ref={topRef} className="max-w-6xl mx-auto px-4 sm:px-6 py-5 grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-5 scroll-mt-16">
        <div className="min-w-0 space-y-3">
          {/* Composer: Facebook-style prompt, then the full form */}
          {composer && user ? (
            <Composer user={user} initialType={composer.type} initialTitle={composer.title}
              onCancel={() => setComposer(null)}
              onPublished={post => { setPosts(list => [post, ...list]); setComposer(null); setSort('new'); setFlair('all'); }} />
          ) : canPost && (
            <div className="bg-white border border-gray-200 rounded-2xl p-3 sm:p-4">
              <div className="flex items-center gap-3">
                {user ? <Avatar name={user.display_name} url={user.avatar_url} size="w-10 h-10" />
                      : <div className="w-10 h-10 rounded-full bg-gray-100 shrink-0" />}
                <button type="button" onClick={() => compose()}
                  className="flex-1 text-left text-[15px] text-gray-500 bg-gray-100 hover:bg-gray-200/70 rounded-full px-4 py-2.5 cursor-pointer transition-colors">
                  {user ? `Share your SSB experience, date or doubt, ${user.display_name.split(' ')[0]}…` : 'Sign in to share your SSB experience, date or doubt…'}
                </button>
              </div>
              <div className="mt-3 pt-3 border-t border-gray-100 grid grid-cols-3 gap-1">
                {POST_TYPES.slice(0, 3).map(t => (
                  <button key={t.value} type="button" onClick={() => compose(t.value)}
                    className="flex items-center justify-center gap-1.5 text-xs sm:text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-xl py-2 cursor-pointer">
                    <CategoryIcon category={t.value} size="sm" />
                    <span className="truncate">{t.short}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Sort + flairs */}
          <div className="bg-white border border-gray-200 rounded-2xl px-3 py-2.5 space-y-2.5">
            <div className="flex items-center gap-1">
              {SORTS.map(({ id, label, icon: Icon }) => (
                <button key={id} type="button" onClick={() => setSort(id)}
                  className={`inline-flex items-center gap-1.5 text-sm font-semibold px-3 py-1.5 rounded-full cursor-pointer ${sort === id
                    ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>
                  <Icon className="w-4 h-4" /> {label}
                </button>
              ))}
            </div>
            <div className="flex gap-1.5 overflow-x-auto pb-0.5">
              {FLAIRS.map(f => (
                <button key={f.id} type="button" onClick={() => setFlair(f.id)}
                  className={`shrink-0 text-xs font-semibold px-3 py-1.5 rounded-full border cursor-pointer ${flair === f.id
                    ? 'bg-brand-50 border-brand-200 text-brand-700' : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-600 flex items-start gap-1.5 px-1"><AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /> {error}</p>
          )}

          {loading && [0, 1, 2].map(i => (
            <div key={i} className="bg-white border border-gray-200 rounded-2xl px-5 py-4 animate-pulse">
              <div className="h-3 bg-gray-100 rounded w-40" />
              <div className="h-4 bg-gray-100 rounded w-2/3 mt-3.5" />
              <div className="h-3 bg-gray-100 rounded w-full mt-2.5" />
            </div>
          ))}

          {!loading && shown.length === 0 && (
            <div className="bg-white border border-dashed border-gray-300 rounded-2xl py-12 text-center px-6">
              <div className="flex justify-center">{flair === 'all'
                ? <span className="w-12 h-12 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center" aria-hidden="true"><Users className="w-6 h-6" /></span>
                : <CategoryIcon category={flair} size="lg" />}</div>
              <p className="text-base font-semibold text-gray-800 mt-2">
                {flair === 'all' ? 'Nothing here yet' : `No ${FLAIRS.find(f => f.id === flair).label.toLowerCase()} yet`}
              </p>
              <p className="text-sm text-gray-500 mt-1">Be the first. Your post helps the next batch.</p>
              {canPost && <button type="button" onClick={() => compose(OPEN_CATEGORIES.includes(flair) ? flair : undefined)} className="btn-primary text-sm px-5 py-2.5 mt-4">Create a post</button>}
            </div>
          )}

          {!loading && shown.map(post => <PostCard key={post.id} post={post} onVote={vote} busy={busy} />)}

          {!canPost && !loading && (
            <p className="text-xs text-gray-500 text-center py-2">Posting is open to the SSBCircle team at the moment. You can still upvote and reply.</p>
          )}
          {canPost && !user && !loading && (
            <p className="text-sm text-gray-500 text-center py-2">
              <Link to="/register" className="font-semibold text-brand-600 hover:underline">Create an account</Link> to post, reply and upvote.
            </p>
          )}
        </div>

        <aside className="hidden lg:block lg:sticky lg:top-20 lg:self-start">
          <CommunitySidebar postCount={posts.length} onCompose={compose} canPost={canPost} />
        </aside>

        {/* Phones: the sidebar would stack four long boxes under the feed, so it folds away */}
        <details className="lg:hidden group bg-white border border-gray-200 rounded-2xl">
          <summary className="list-none flex items-center justify-between gap-3 px-4 min-h-[56px] cursor-pointer">
            <span className="text-base font-semibold text-gray-900">About this community and the rules</span>
            <span className="text-gray-400 text-xl leading-none transition-transform group-open:rotate-45" aria-hidden="true">+</span>
          </summary>
          <div className="px-3 pb-3">
            <CommunitySidebar postCount={posts.length} onCompose={compose} canPost={canPost} />
          </div>
        </details>
      </div>
    </div>
  );
}
