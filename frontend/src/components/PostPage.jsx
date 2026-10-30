import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  getCommunityPost, addCommunityComment, voteCommunityPost,
  deleteCommunityPost, deleteCommunityComment,
} from '../services/api';
import { ArrowLeft, Trash2, Lock, AlertCircle, MessageSquare, Pin } from 'lucide-react';
import CategoryChip, { timeAgo } from './community/CategoryChip';
import { Avatar, VoteRail, ShareButton, CommunitySidebar, ModBadge } from './community/parts';
import SiteNav from './SiteNav';
import { trackEvent } from '../analytics';

// One community post with its replies, in the same Reddit-like style as the
// feed. The reply box says what kind of reply helps for each kind of post.

const REPLY_PROMPT = {
  experience: 'Thank them, or ask about a part of their SSB…',
  ssb_date:   'Going on the same dates? Say hi and plan practice together…',
  doubt:      'Answer from what you know or have been through…',
};

export default function PostPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [post,     setPost]     = useState(null);
  const [comments, setComments] = useState([]);
  const [state,    setState]    = useState('loading');
  const [body,     setBody]     = useState('');
  const [sending,  setSending]  = useState(false);
  const [error,    setError]    = useState('');

  useEffect(() => {
    let cancelled = false;
    getCommunityPost(id)
      .then(({ post: p, comments: c }) => {
        if (cancelled) return;
        setPost(p); setComments(c); setState('done');
      })
      .catch(() => { if (!cancelled) setState('missing'); });
    return () => { cancelled = true; };
  }, [id]);

  async function vote() {
    if (!user) { navigate('/login'); return; }
    const before = { voted: post.voted, upvotes: post.upvotes };
    setPost(p => ({ ...p, voted: !p.voted, upvotes: p.upvotes + (p.voted ? -1 : 1) }));
    try {
      const { voted, upvotes } = await voteCommunityPost(post.id);
      setPost(p => ({ ...p, voted, upvotes }));
    } catch {
      setPost(p => ({ ...p, ...before }));
    }
  }

  async function comment(e) {
    e.preventDefault();
    if (!body.trim()) return;
    setSending(true); setError('');
    try {
      setComments(await addCommunityComment(post.id, body.trim()));
      setBody('');
      trackEvent('community_comment', { type: post.category });
    } catch (err) {
      setError(err.message || 'Could not post your comment.');
    } finally {
      setSending(false);
    }
  }

  async function removePost() {
    if (!window.confirm('Delete this post?')) return;
    try {
      await deleteCommunityPost(post.id);
      navigate('/community');
    } catch (err) {
      setError(err.message || 'Could not delete that post.');
    }
  }

  async function removeComment(commentId) {
    try {
      await deleteCommunityComment(commentId);
      setComments(list => list.filter(c => c.id !== commentId));
    } catch (err) {
      setError(err.message || 'Could not delete that comment.');
    }
  }

  if (state === 'loading') {
    return (
      <div className="min-h-screen bg-gray-100/70">
        <SiteNav />
        <div className="flex items-center justify-center py-24">
          <div className="w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (state === 'missing') {
    return (
      <div className="min-h-screen bg-gray-100/70">
        <SiteNav />
        <div className="flex items-center justify-center px-4 py-24">
          <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center max-w-sm">
            <p className="text-base font-semibold text-gray-800 mb-1">That post is not available</p>
            <p className="text-sm text-gray-500 mb-5">It may have been removed.</p>
            <Link to="/community" className="btn-primary text-sm py-2 px-5">Back to the community</Link>
          </div>
        </div>
      </div>
    );
  }

  const mine = user && post.author_id === user.id;

  return (
    <div className="min-h-screen bg-gray-100/70">
      <SiteNav />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-5 grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-5">
        <div className="min-w-0 space-y-4">
          <Link to="/community" className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-500 hover:text-gray-900">
            <ArrowLeft className="w-4 h-4" /> Community
          </Link>

          <article className="flex bg-white border border-gray-200 rounded-2xl overflow-hidden">
            <div className="hidden sm:flex w-14 shrink-0 bg-gray-50/80 justify-center pt-4">
              <VoteRail voted={post.voted} count={post.upvotes} onVote={vote} />
            </div>
            <div className="flex-1 min-w-0 px-4 sm:px-5 py-4">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-gray-500">
                <Avatar name={post.author_name} url={post.author_avatar} official={post.is_official} size="w-6 h-6" />
                <span className={`font-semibold ${post.is_official ? 'text-brand-700' : 'text-gray-800'}`}>{post.author_name || 'Someone'}</span>
                {post.author_is_mod && <ModBadge />}
                <span>· {timeAgo(post.created_at)}</span>
                <CategoryChip category={post.category} />
                {post.is_pinned && <span className="inline-flex items-center gap-1 text-amber-600 font-semibold"><Pin className="w-3 h-3" /> Pinned</span>}
              </div>

              <h1 className="mt-3 text-xl sm:text-2xl font-bold text-gray-900 leading-snug">{post.title}</h1>
              <div className="mt-3 text-base text-gray-800 leading-relaxed whitespace-pre-wrap break-words">{post.body}</div>

              <div className="mt-4 flex items-center gap-1 -ml-2.5">
                <span className="sm:hidden"><VoteRail voted={post.voted} count={post.upvotes} onVote={vote} vertical={false} /></span>
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 px-2.5 py-1.5">
                  <MessageSquare className="w-4 h-4" /> {comments.length} {comments.length === 1 ? 'comment' : 'comments'}
                </span>
                <ShareButton postId={post.id} title={post.title} />
                {mine && (
                  <button onClick={removePost}
                    className="ml-auto inline-flex items-center gap-1.5 text-xs font-semibold text-gray-400 hover:text-red-500 hover:bg-red-50 px-2.5 py-1.5 rounded-full cursor-pointer">
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </button>
                )}
              </div>
            </div>
          </article>

          {error && (
            <p className="text-sm text-red-600 flex items-start gap-1.5 px-1"><AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /> {error}</p>
          )}

          <section className="bg-white border border-gray-200 rounded-2xl p-4 sm:p-5">
            {post.is_locked ? (
              <p className="text-sm text-gray-500 flex items-center gap-2"><Lock className="w-4 h-4" /> Comments are closed on this post.</p>
            ) : user ? (
              <form onSubmit={comment}>
                <p className="text-xs text-gray-500 mb-2">Comment as <span className="font-semibold text-gray-800">{user.display_name}</span></p>
                <textarea className="w-full text-sm border border-gray-200 rounded-xl px-3.5 py-3 min-h-[96px] leading-relaxed focus:outline-none focus:border-brand-400"
                  placeholder={REPLY_PROMPT[post.category] || 'Add a comment…'}
                  value={body} onChange={e => setBody(e.target.value)} maxLength={4000} />
                <div className="flex justify-end mt-2">
                  <button type="submit" disabled={sending || !body.trim()} className="btn-primary text-sm px-5 py-2">
                    {sending ? 'Posting…' : 'Comment'}
                  </button>
                </div>
              </form>
            ) : (
              <p className="text-sm text-gray-600">
                <Link to="/login" state={{ from: { pathname: `/community/${post.id}` } }} className="font-semibold text-brand-600 hover:underline">Sign in</Link>
                {' '}or{' '}
                <Link to="/register" className="font-semibold text-brand-600 hover:underline">create an account</Link> to comment.
              </p>
            )}

            <div className="mt-5">
              {comments.length === 0 && !post.is_locked && (
                <p className="text-sm text-gray-500 py-6 text-center">No comments yet. Be the first to reply.</p>
              )}
              <div className="space-y-5">
                {comments.map(c => (
                  <div key={c.id} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <Avatar name={c.author_name} url={c.author_avatar} official={c.is_official} />
                      <div className="flex-1 w-0.5 bg-gray-100 mt-2 rounded-full" />
                    </div>
                    <div className="flex-1 min-w-0 pb-1">
                      <div className="flex items-center gap-2 text-xs">
                        <span className={`font-semibold ${c.is_official ? 'text-brand-700' : 'text-gray-800'}`}>{c.author_name || 'Someone'}</span>
                        {c.author_is_mod && <ModBadge />}
                        {c.author_id && c.author_id === post.author_id && (
                          <span className="text-[11px] font-bold text-brand-600 bg-brand-50 px-1.5 py-0.5 rounded">OP</span>
                        )}
                        <span className="text-gray-400">· {timeAgo(c.created_at)}</span>
                        {user && c.author_id === user.id && (
                          <button onClick={() => removeComment(c.id)}
                            className="ml-auto text-gray-300 hover:text-red-500 cursor-pointer" title="Delete">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                      <p className="mt-1 text-sm text-gray-800 leading-relaxed whitespace-pre-wrap break-words">{c.body}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>

        <aside className="lg:sticky lg:top-20 lg:self-start">
          {/* The feed decides whether posting is open; from here the sidebar just links there */}
          <CommunitySidebar canPost onCompose={type => navigate(`/community?compose=1${type ? `&category=${type}` : ''}`)} />
        </aside>
      </div>
    </div>
  );
}
