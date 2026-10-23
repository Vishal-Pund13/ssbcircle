import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, MessageCircle, Trash2, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
  getArticleEngagement, likeArticle, addArticleComment, deleteArticleComment,
  trackArticleView, trackArticleRead,
} from '../services/api';

// Likes and comments for one blog article. The bar sits under the article
// header; the comment list sits at the end. Both share the state from
// useArticleEngagement, so a new comment updates the count in the bar too.

export function useArticleEngagement(slug) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [likes,    setLikes]    = useState(0);
  const [liked,    setLiked]    = useState(false);
  const [comments, setComments] = useState([]);

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;
    getArticleEngagement(slug)
      .then(d => {
        if (cancelled) return;
        setLikes(d.likes); setLiked(d.liked); setComments(d.comments);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [slug, user?.id]);

  async function toggleLike() {
    if (!user) { navigate('/login'); return; }
    const before = { likes, liked };
    setLiked(!liked); setLikes(likes + (liked ? -1 : 1));
    try {
      const d = await likeArticle(slug);
      setLikes(d.likes); setLiked(d.liked);
    } catch {
      setLikes(before.likes); setLiked(before.liked);
    }
  }

  return { slug, user, likes, liked, comments, setComments, toggleLike };
}

export function EngagementBar({ engagement, onCommentClick }) {
  const { likes, liked, comments, toggleLike } = engagement;
  return (
    <div className="flex items-center gap-2">
      <button onClick={toggleLike} title={liked ? 'Unlike' : 'Like'}
        className={`inline-flex items-center gap-1.5 text-sm font-semibold px-3 py-1.5 rounded-full border cursor-pointer transition-colors ${
          liked
            ? 'text-rose-600 bg-rose-50 border-rose-100'
            : 'text-gray-500 bg-white border-gray-200 hover:text-rose-600 hover:border-rose-100'
        }`}>
        <Heart className={`w-4 h-4 ${liked ? 'fill-rose-600' : ''}`} />
        <span className="tabular-nums">{likes}</span>
      </button>
      <button onClick={onCommentClick} title="Comments"
        className="inline-flex items-center gap-1.5 text-sm font-semibold px-3 py-1.5 rounded-full border border-gray-200 bg-white text-gray-500 hover:text-brand-600 hover:border-brand-100 cursor-pointer transition-colors">
        <MessageCircle className="w-4 h-4" />
        <span className="tabular-nums">{comments.length}</span>
      </button>
    </div>
  );
}

function timeAgo(iso) {
  const secs = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (secs < 60)    return 'just now';
  if (secs < 3600)  return Math.floor(secs / 60) + 'm ago';
  if (secs < 86400) return Math.floor(secs / 3600) + 'h ago';
  if (secs < 604800) return Math.floor(secs / 86400) + 'd ago';
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

function Avatar({ name, url }) {
  if (url) return <img src={url} alt="" className="w-7 h-7 rounded-full object-cover shrink-0" />;
  return (
    <div className="w-7 h-7 rounded-full bg-brand-600 flex items-center justify-center text-[10px] font-bold text-white shrink-0">
      {(name || '?').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)}
    </div>
  );
}

export function CommentsSection({ engagement, inputRef }) {
  const { slug, user, comments, setComments } = engagement;
  const [body,    setBody]    = useState('');
  const [sending, setSending] = useState(false);
  const [error,   setError]   = useState('');

  async function submit(e) {
    e.preventDefault();
    if (!body.trim()) return;
    setSending(true); setError('');
    try {
      setComments(await addArticleComment(slug, body.trim()));
      setBody('');
    } catch (err) {
      setError(err.message || 'Could not post your comment.');
    } finally {
      setSending(false);
    }
  }

  async function remove(id) {
    try {
      await deleteArticleComment(id);
      setComments(list => list.filter(c => c.id !== id));
    } catch (err) {
      setError(err.message || 'Could not delete that comment.');
    }
  }

  return (
    <section id="comments" className="mt-10 pt-6 border-t border-gray-100 scroll-mt-20">
      <h2 className="text-base font-bold text-gray-900 mb-4">
        Comments <span className="text-gray-400 font-semibold">({comments.length})</span>
      </h2>

      {user ? (
        <form onSubmit={submit} className="bg-white border border-gray-200 rounded-xl p-4">
          <textarea ref={inputRef} className="input-base text-sm w-full min-h-[80px]"
            placeholder="Share your view, or add a point for GD."
            value={body} onChange={e => setBody(e.target.value)} maxLength={2000} />
          <button type="submit" disabled={sending || !body.trim()}
            className="btn-primary text-sm px-5 py-2 mt-3">
            {sending ? 'Posting…' : 'Comment'}
          </button>
        </form>
      ) : (
        <p className="text-sm text-gray-500">
          <Link to="/register" className="font-semibold text-brand-600 hover:underline">Create a free account</Link>
          {' '}to like and comment.
        </p>
      )}

      {error && (
        <p className="mt-3 text-xs text-red-600 flex items-start gap-1.5">
          <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" /> {error}
        </p>
      )}

      <div className="mt-5 space-y-3">
        {comments.length === 0 && (
          <p className="text-xs text-gray-400">No comments yet. Be the first.</p>
        )}
        {comments.map(c => (
          <div key={c.id} className="bg-white border border-gray-200 rounded-xl px-4 py-3.5">
            <div className="flex items-center gap-2.5">
              <Avatar name={c.author_name} url={c.author_avatar} />
              <div className="min-w-0">
                <p className="text-xs font-semibold text-gray-800">{c.author_name || 'Someone'}</p>
                <p className="text-[11px] text-gray-400">{timeAgo(c.created_at)}</p>
              </div>
              {user && c.author_id === user.id && (
                <button onClick={() => remove(c.id)}
                  className="ml-auto text-gray-300 hover:text-red-500 cursor-pointer" title="Delete">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <p className="mt-2.5 text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{c.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

// ── Reading metrics ─────────────────────────────────────────────────────────
// A random id kept in this browser, so a signed-out reader is counted once
// without us storing anything about who they are. Storage can be blocked
// (private mode), so every access is guarded and tracking just skips.

function visitorId() {
  try {
    let id = localStorage.getItem('ssbc_visitor');
    if (!id) {
      id = crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
      localStorage.setItem('ssbc_visitor', id);
    }
    return id;
  } catch {
    return null;
  }
}

// Each flag is set once per browser tab, so a refresh or StrictMode's double
// effect does not count the same visit twice.
function onceThisTab(key) {
  try {
    if (sessionStorage.getItem(key)) return false;
    sessionStorage.setItem(key, '1');
    return true;
  } catch {
    return false;
  }
}

// Records a view when the article opens, and a "read to the end" when the
// element behind endRef scrolls into sight. Attach endRef after the body.
export function useArticleTracking(slug) {
  const endRef = useRef(null);

  useEffect(() => {
    const id = slug && visitorId();
    if (!id) return;
    // The read is recorded against the view row, so it waits for the view.
    const viewed = onceThisTab(`viewed:${slug}`) ? trackArticleView(slug, id) : Promise.resolve();

    const el = endRef.current;
    if (!el || !('IntersectionObserver' in window)) return;
    const observer = new IntersectionObserver(entries => {
      if (!entries.some(e => e.isIntersecting)) return;
      observer.disconnect();
      if (onceThisTab(`read:${slug}`)) viewed.then(() => trackArticleRead(slug, id));
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [slug]);

  return endRef;
}

// Scrolls to the comment box and puts the cursor in it.
export function useScrollToComments() {
  const inputRef = useRef(null);
  function scrollToComments() {
    document.getElementById('comments')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setTimeout(() => inputRef.current?.focus({ preventScroll: true }), 400);
  }
  return { inputRef, scrollToComments };
}
