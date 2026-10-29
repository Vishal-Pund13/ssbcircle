import { useState, useEffect } from 'react';
import { Pin, Trash2, Check, AlertCircle, Lock, Unlock } from 'lucide-react';
import CategoryChip, { timeAgo } from './CategoryChip';

// The community panel in the admin dashboard.
//
// Self-contained: it loads its own data and takes the API base and auth header
// helper as props, so it does not have to be threaded through the dashboard's
// shared loader.

const CATEGORIES = [
  { value: 'announcement', label: 'Announcement' },
  { value: 'session',      label: 'Session' },
  { value: 'discussion',   label: 'Discussion' },
];

export default function CommunityAdmin({ api, authHeaders }) {
  const [whoCanPost, setWhoCanPost] = useState('admin');
  const [posts,   setPosts]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');
  const [saved,   setSaved]   = useState('');

  const [title,    setTitle]    = useState('');
  const [body,     setBody]     = useState('');
  const [category, setCategory] = useState('announcement');
  const [posting,  setPosting]  = useState(false);

  async function load() {
    try {
      const [sRes, pRes] = await Promise.all([
        fetch(`${api}/api/admin/community/settings`, { headers: authHeaders() }),
        fetch(`${api}/api/community?limit=50`),
      ]);
      if (sRes.ok) setWhoCanPost((await sRes.json()).who_can_post);
      if (pRes.ok) setPosts((await pRes.json()).posts);
    } catch {
      setError('Could not load the community.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  function flash(msg) { setSaved(msg); setTimeout(() => setSaved(''), 2500); }

  async function setWho(value) {
    setError('');
    const previous = whoCanPost;
    setWhoCanPost(value);
    try {
      const res = await fetch(`${api}/api/admin/community/settings`, {
        method: 'PUT',
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ who_can_post: value }),
      });
      if (!res.ok) throw new Error();
      flash(value === 'everyone' ? 'Aspirants can now post' : 'Posting limited to the team');
    } catch {
      setWhoCanPost(previous);
      setError('Could not change that setting.');
    }
  }

  async function publish(e) {
    e.preventDefault();
    setPosting(true); setError('');
    try {
      const res = await fetch(`${api}/api/admin/community/posts`, {
        method: 'POST',
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim(), body: body.trim(), category }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not publish');
      setPosts(list => [data.post, ...list]);
      setTitle(''); setBody('');
      flash('Posted');
    } catch (err) {
      setError(err.message || 'Could not publish that post.');
    } finally {
      setPosting(false);
    }
  }

  async function setFlag(post, patch) {
    try {
      const res = await fetch(`${api}/api/admin/community/posts/${post.id}`, {
        method: 'PATCH',
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      });
      if (!res.ok) throw new Error();
      setPosts(list => list.map(p => p.id === post.id ? { ...p, ...patch } : p));
    } catch {
      setError('Could not update that post.');
    }
  }

  async function remove(post) {
    if (!window.confirm(`Delete "${post.title}"?`)) return;
    try {
      const res = await fetch(`${api}/api/community/${post.id}`, {
        method: 'DELETE', headers: authHeaders(),
      });
      if (!res.ok) throw new Error();
      setPosts(list => list.filter(p => p.id !== post.id));
    } catch {
      setError('Could not delete that post.');
    }
  }

  return (
    <div className="space-y-4">
      {/* Who may post */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <h3 className="text-sm font-bold text-gray-900">Who can post</h3>
        <p className="text-xs text-gray-400 mt-1 mb-3 leading-relaxed">
          Keep this on the team until there is enough to read, and until you are ready to
          moderate. It can be switched back at any time.
        </p>
        <div className="flex flex-wrap gap-2">
          {[
            { value: 'admin',    label: 'Only the team' },
            { value: 'everyone', label: 'All signed-in aspirants' },
          ].map(opt => (
            <button key={opt.value} type="button" onClick={() => setWho(opt.value)}
              className={`text-xs font-semibold px-3.5 py-2 rounded-full border transition-colors cursor-pointer ${
                whoCanPost === opt.value
                  ? 'bg-brand-600 border-brand-600 text-white'
                  : 'bg-white border-gray-200 text-gray-600 hover:border-brand-300'
              }`}>
              {opt.label}
            </button>
          ))}
        </div>
        {whoCanPost === 'everyone' && (
          <p className="mt-3 text-[12px] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 leading-relaxed">
            Aspirants can post now. Most of your users are under eighteen, so check the feed
            regularly — anything posted is public to every visitor.
          </p>
        )}
      </div>

      {/* Compose */}
      <form onSubmit={publish} className="bg-white border border-gray-200 rounded-xl p-5">
        <h3 className="text-sm font-bold text-gray-900 mb-3">Post as SSBCircle</h3>
        <div className="flex flex-wrap gap-2 mb-3">
          {CATEGORIES.map(c => (
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
        <input className="input-base text-sm w-full mb-2" placeholder="Title"
          value={title} onChange={e => setTitle(e.target.value)} maxLength={200} />
        <textarea className="input-base text-sm w-full min-h-[110px]" placeholder="Details — date, time, what to prepare."
          value={body} onChange={e => setBody(e.target.value)} maxLength={8000} />
        <button type="submit" disabled={posting || title.trim().length < 5 || !body.trim()}
          className="btn-primary text-sm px-5 py-2 mt-3">
          {posting ? 'Posting…' : 'Publish'}
        </button>
      </form>

      {error && (
        <p className="text-xs text-red-600 flex items-start gap-1.5">
          <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" /> {error}
        </p>
      )}
      {saved && (
        <p className="text-xs text-emerald-600 flex items-center gap-1.5">
          <Check className="w-3.5 h-3.5" /> {saved}
        </p>
      )}

      {/* Existing posts */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        {loading && <p className="text-sm text-gray-400 text-center py-10">Loading…</p>}
        {!loading && posts.length === 0 && (
          <p className="text-sm text-gray-400 text-center py-10">No posts yet</p>
        )}
        <div className="divide-y divide-gray-50">
          {posts.map(p => (
            <div key={p.id} className="px-4 py-3 flex items-start gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <CategoryChip category={p.category} />
                  {p.is_pinned && <Pin className="w-3 h-3 text-amber-500" />}
                  {p.is_locked && <Lock className="w-3 h-3 text-gray-300" />}
                </div>
                <p className="text-sm font-medium text-gray-900 mt-1 truncate">{p.title}</p>
                <p className="text-[12px] text-gray-400 mt-0.5">
                  {p.author_name || 'Someone'} · {timeAgo(p.created_at)} · {p.upvotes} up · {p.comment_count} replies
                </p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => setFlag(p, { is_pinned: !p.is_pinned })}
                  title={p.is_pinned ? 'Unpin' : 'Pin to top'}
                  className={`p-1.5 rounded-lg cursor-pointer transition-colors ${p.is_pinned ? 'text-amber-500 hover:bg-amber-50' : 'text-gray-300 hover:text-amber-500 hover:bg-amber-50'}`}>
                  <Pin className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => setFlag(p, { is_locked: !p.is_locked })}
                  title={p.is_locked ? 'Reopen comments' : 'Close comments'}
                  className="p-1.5 rounded-lg text-gray-300 hover:text-gray-600 hover:bg-gray-50 cursor-pointer transition-colors">
                  {p.is_locked ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                </button>
                <button onClick={() => remove(p)} title="Delete"
                  className="p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 cursor-pointer transition-colors">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
