import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  getCommunityPost, addCommunityComment, voteCommunityPost,
  deleteCommunityPost, deleteCommunityComment,
} from '../services/api';
import { ArrowBigUp, ArrowLeft, Trash2, Lock, AlertCircle } from 'lucide-react';
import CategoryChip, { timeAgo } from './community/CategoryChip';

function Avatar({ name, url }) {
  if (url) return <img src={url} alt="" className="w-7 h-7 rounded-full object-cover shrink-0" />;
  return (
    <div className="w-7 h-7 rounded-full bg-brand-600 flex items-center justify-center text-[10px] font-bold text-white shrink-0">
      {(name || '?').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)}
    </div>
  );
}

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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (state === 'missing') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white border border-gray-200 rounded-xl p-8 text-center max-w-sm">
          <p className="text-sm font-semibold text-gray-800 mb-1">That post is not available</p>
          <p className="text-xs text-gray-400 mb-5">It may have been removed.</p>
          <Link to="/community" className="btn-primary text-xs py-2 px-5">Back to the community</Link>
        </div>
      </div>
    );
  }

  const mine = user && post.author_id === user.id;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 px-4 sm:px-6 py-3.5">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link to="/community" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900">
            <ArrowLeft className="w-4 h-4" /> Community
          </Link>
          {!user && <Link to="/register" className="btn-primary text-xs px-4 py-2">Get started</Link>}
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-7">
        <article className="bg-white border border-gray-200 rounded-xl p-5">
          <div className="flex flex-wrap items-center gap-2">
            <CategoryChip category={post.category} />
            {post.is_locked && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-gray-400">
                <Lock className="w-3 h-3" /> Comments closed
              </span>
            )}
          </div>

          <h1 className="mt-2.5 text-xl sm:text-2xl font-bold text-gray-900 leading-snug">{post.title}</h1>

          <p className="mt-1.5 text-xs text-gray-400">
            {post.is_official
              ? <span className="font-semibold text-brand-600">{post.author_name}</span>
              : (post.author_name || 'Someone')}
            {' · '}{timeAgo(post.created_at)}
          </p>

          <div className="mt-4 text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{post.body}</div>

          <div className="mt-5 flex items-center gap-4 border-t border-gray-100 pt-3.5">
            <button onClick={vote}
              className={`inline-flex items-center gap-1.5 text-sm font-semibold cursor-pointer transition-colors ${
                post.voted ? 'text-brand-600' : 'text-gray-400 hover:text-brand-600'
              }`}>
              <ArrowBigUp className={`w-5 h-5 ${post.voted ? 'fill-brand-600' : ''}`} />
              <span className="tabular-nums">{post.upvotes}</span>
            </button>
            <span className="text-sm text-gray-400">{comments.length} {comments.length === 1 ? 'reply' : 'replies'}</span>
            {mine && (
              <button onClick={removePost}
                className="ml-auto inline-flex items-center gap-1.5 text-xs font-semibold text-gray-300 hover:text-red-500 cursor-pointer">
                <Trash2 className="w-3.5 h-3.5" /> Delete
              </button>
            )}
          </div>
        </article>

        {error && (
          <p className="mt-4 text-xs text-red-600 flex items-start gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" /> {error}
          </p>
        )}

        {!post.is_locked && (
          user ? (
            <form onSubmit={comment} className="mt-5 bg-white border border-gray-200 rounded-xl p-4">
              <textarea className="input-base text-sm w-full min-h-[90px]"
                placeholder="Answer, or add what you know."
                value={body} onChange={e => setBody(e.target.value)} maxLength={4000} />
              <button type="submit" disabled={sending || !body.trim()}
                className="btn-primary text-sm px-5 py-2 mt-3">
                {sending ? 'Posting…' : 'Reply'}
              </button>
            </form>
          ) : (
            <p className="mt-5 text-sm text-gray-500">
              <Link to="/register" className="font-semibold text-brand-600 hover:underline">Create a free account</Link>
              {' '}to reply.
            </p>
          )
        )}

        <div className="mt-6 space-y-3">
          {comments.map(c => (
            <div key={c.id} className="bg-white border border-gray-200 rounded-xl px-4 py-3.5">
              <div className="flex items-center gap-2.5">
                <Avatar name={c.author_name} url={c.author_avatar} />
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-gray-800">
                    {c.is_official
                      ? <span className="text-brand-600">{c.author_name}</span>
                      : (c.author_name || 'Someone')}
                  </p>
                  <p className="text-[11px] text-gray-400">{timeAgo(c.created_at)}</p>
                </div>
                {user && c.author_id === user.id && (
                  <button onClick={() => removeComment(c.id)}
                    className="ml-auto text-gray-300 hover:text-red-500 cursor-pointer" title="Delete">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <p className="mt-2.5 text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{c.body}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
