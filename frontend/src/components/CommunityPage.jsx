import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getCommunityFeed, createCommunityPost, voteCommunityPost } from '../services/api';
import { ArrowBigUp, MessageSquare, Pin, Plus, AlertCircle, Lock, BadgeCheck } from 'lucide-react';
import CategoryChip, { timeAgo } from './community/CategoryChip';

// The community feed.
//
// Reading works signed out on purpose: a visitor arriving from search should
// see a live board rather than a sign-in wall, and an empty site is the thing
// we are trying to fix.

const OPEN_CATEGORIES = [
  { value: 'doubt',      label: 'Ask a doubt' },
  { value: 'discussion', label: 'Discussion' },
];

// A post with only a title reads as an empty row. Showing the first couple of
// lines is most of what makes a board look like a board.
const excerpt = (body, max = 180) => {
  const flat = String(body || '').replace(/\s+/g, ' ').trim();
  return flat.length > max ? flat.slice(0, max).trimEnd() + '…' : flat;
};

function Avatar({ name, url, official }) {
  if (official) {
    return (
      <div className="w-8 h-8 rounded-full bg-brand-600 flex items-center justify-center shrink-0">
        <BadgeCheck className="w-4 h-4 text-white" />
      </div>
    );
  }
  if (url) return <img src={url} alt="" className="w-8 h-8 rounded-full object-cover shrink-0" />;
  return (
    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-[11px] font-bold text-gray-500 shrink-0">
      {(name || '?').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)}
    </div>
  );
}

function PostCard({ post, onVote, busy }) {
  const navigate = useNavigate();
  const open = () => navigate(`/community/${post.id}`);

  return (
    <article
      onClick={open}
      className="group bg-white border border-gray-200 rounded-xl px-4 sm:px-5 py-4 cursor-pointer hover:border-brand-300 hover:shadow-sm transition-all">

      {/* Who and when */}
      <div className="flex items-center gap-2.5">
        <Avatar name={post.author_name} url={post.author_avatar} official={post.is_official} />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold text-gray-700 truncate">
            {post.is_official
              ? <span className="text-brand-700">{post.author_name}</span>
              : (post.author_name || 'Someone')}
            <span className="font-normal text-gray-400"> · {timeAgo(post.created_at)}</span>
          </p>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {post.is_pinned && <Pin className="w-3.5 h-3.5 text-amber-500" />}
          {post.is_locked && <Lock className="w-3 h-3 text-gray-300" />}
          <CategoryChip category={post.category} />
        </div>
      </div>

      {/* What */}
      <h2 className="mt-3 text-[15px] sm:text-base font-bold text-gray-900 leading-snug group-hover:text-brand-700 transition-colors">
        {post.title}
      </h2>
      {post.body && (
        <p className="mt-1.5 text-sm text-gray-500 leading-relaxed line-clamp-2">
          {excerpt(post.body)}
        </p>
      )}

      {/* Actions — stopPropagation so voting does not open the post */}
      <div className="mt-3.5 flex items-center gap-2 border-t border-gray-100 pt-3">
        <button
          onClick={e => { e.stopPropagation(); onVote(post); }}
          disabled={busy}
          title={post.voted ? 'Remove your upvote' : 'Upvote'}
          className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1.5 rounded-lg cursor-pointer transition-colors ${
            post.voted
              ? 'text-brand-700 bg-brand-50'
              : 'text-gray-400 hover:text-brand-600 hover:bg-gray-50'
          }`}>
          <ArrowBigUp className={`w-4 h-4 ${post.voted ? 'fill-brand-700' : ''}`} />
          <span className="tabular-nums">{post.upvotes}</span>
        </button>

        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-400 px-2.5 py-1.5">
          <MessageSquare className="w-3.5 h-3.5" />
          {post.comment_count} {post.comment_count === 1 ? 'reply' : 'replies'}
        </span>
      </div>
    </article>
  );
}

export default function CommunityPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [posts,   setPosts]   = useState([]);
  const [canPost, setCanPost] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');
  const [busy,    setBusy]    = useState(false);

  const [composing, setComposing] = useState(false);
  const [title,     setTitle]     = useState('');
  const [body,      setBody]      = useState('');
  const [category,  setCategory]  = useState('doubt');
  const [posting,   setPosting]   = useState(false);

  useEffect(() => {
    let cancelled = false;
    getCommunityFeed()
      .then(({ posts: list, can_post }) => {
        if (cancelled) return;
        setPosts(list);
        setCanPost(can_post);
      })
      .catch(() => { if (!cancelled) setError('Could not load the community.'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

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

  async function publish(e) {
    e.preventDefault();
    setPosting(true); setError('');
    try {
      const post = await createCommunityPost({ title: title.trim(), body: body.trim(), category });
      setPosts(list => [post, ...list]);
      setTitle(''); setBody(''); setComposing(false);
    } catch (err) {
      setError(err.message || 'Could not publish your post.');
    } finally {
      setPosting(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 px-4 sm:px-6 py-3.5 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link to="/" className="text-brand-600 font-bold">SSBCircle</Link>
          {user
            ? <Link to="/profile" className="text-sm text-gray-500 hover:text-gray-900">{user.display_name}</Link>
            : <Link to="/register" className="btn-primary text-xs px-4 py-2">Get started</Link>}
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-7">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Community</h1>
            <p className="mt-1.5 text-sm text-gray-500">
              Sessions, announcements and doubts from other aspirants.
            </p>
          </div>

          {canPost && user && !composing && (
            <button onClick={() => setComposing(true)}
              className="btn-primary text-xs px-4 py-2.5 shrink-0 inline-flex items-center gap-1.5">
              <Plus className="w-3.5 h-3.5" /> New post
            </button>
          )}
        </div>

        {canPost && !user && (
          <p className="mt-4 text-sm text-gray-500">
            <Link to="/register" className="font-semibold text-brand-600 hover:underline">Create a free account</Link>
            {' '}to post a doubt or join a discussion.
          </p>
        )}

        {composing && (
          <form onSubmit={publish} className="mt-5 bg-white border border-gray-200 rounded-xl p-4 space-y-3">
            <div className="flex flex-wrap gap-2">
              {OPEN_CATEGORIES.map(c => (
                <button key={c.value} type="button" onClick={() => setCategory(c.value)}
                  className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors cursor-pointer ${
                    category === c.value
                      ? 'bg-brand-600 border-brand-600 text-white'
                      : 'bg-white border-gray-200 text-gray-600 hover:border-brand-300'
                  }`}>
                  {c.label}
                </button>
              ))}
            </div>
            <input className="input-base text-sm w-full" placeholder="What is your question?"
              value={title} onChange={e => setTitle(e.target.value)} maxLength={200} />
            <textarea className="input-base text-sm w-full min-h-[120px]" placeholder="Give enough detail that someone can actually help."
              value={body} onChange={e => setBody(e.target.value)} maxLength={8000} />
            <div className="flex items-center gap-3">
              <button type="submit" disabled={posting} className="btn-primary text-sm px-5 py-2">
                {posting ? 'Posting…' : 'Post'}
              </button>
              <button type="button" onClick={() => setComposing(false)}
                className="text-xs font-semibold text-gray-400 hover:text-gray-600 cursor-pointer">
                Cancel
              </button>
            </div>
          </form>
        )}

        {error && (
          <p className="mt-4 text-xs text-red-600 flex items-start gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" /> {error}
          </p>
        )}

        <div className="mt-6 space-y-3">
          {loading && [0, 1, 2].map(i => (
            <div key={i} className="bg-white border border-gray-200 rounded-xl px-5 py-4 animate-pulse">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-gray-100" />
                <div className="h-3 bg-gray-100 rounded w-28" />
              </div>
              <div className="h-4 bg-gray-100 rounded w-2/3 mt-3.5" />
              <div className="h-3 bg-gray-100 rounded w-full mt-2.5" />
            </div>
          ))}

          {!loading && posts.length === 0 && (
            <div className="border border-dashed border-gray-200 rounded-xl py-14 text-center px-6">
              <MessageSquare className="w-7 h-7 text-gray-300 mx-auto mb-3" />
              <p className="text-sm font-medium text-gray-700">Nothing here yet</p>
              <p className="text-xs text-gray-400 mt-1">
                Announcements and upcoming sessions will appear here.
              </p>
            </div>
          )}

          {!loading && posts.map(post => (
            <PostCard key={post.id} post={post} onVote={vote} busy={busy} />
          ))}
        </div>
      </div>
    </div>
  );
}
