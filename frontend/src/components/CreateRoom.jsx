import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { createRoom } from '../services/api';
import { useAuth } from '../context/AuthContext';

function CopyIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
  );
}

export default function CreateRoom() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [topic, setTopic] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [room, setRoom] = useState(null);
  const [copied, setCopied] = useState(false);

  const shareUrl = room
    ? `${window.location.origin}/join/${room.room_code}`
    : '';

  async function handleSubmit(e) {
    e.preventDefault();
    if (!user) {
      navigate('/login', { state: { from: location } });
      return;
    }
    const trimmed = topic.trim();
    if (trimmed.length < 3) {
      setError('Topic must be at least 3 characters');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const created = await createRoom(trimmed);
      setRoom(created);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  }

  if (room) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-[#0f0f0f]">
        <div className="card w-full max-w-md text-center">
          <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <h2 className="text-2xl font-bold text-white mb-1">Room Created!</h2>
          <p className="text-white/40 mb-6 text-sm">{room.topic}</p>

          <div className="bg-primary-400/10 border border-primary-400/20 rounded-2xl p-5 mb-4">
            <p className="text-xs text-primary-400/70 font-medium tracking-widest uppercase mb-2">Room Code</p>
            <p className="text-4xl font-extrabold text-primary-400 tracking-widest">{room.room_code}</p>
          </div>

          <div className="flex items-center gap-2 mb-6">
            <input
              readOnly
              value={shareUrl}
              className="input-field text-sm flex-1"
              onFocus={(e) => e.target.select()}
            />
            <button
              onClick={handleCopy}
              className="btn-primary px-4 py-3 flex items-center gap-1.5 shrink-0"
              title="Copy link"
            >
              <CopyIcon />
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>

          <div className="flex flex-col gap-3">
            <button
              onClick={() => navigate(`/room/${room.room_code}`)}
              className="btn-primary w-full"
            >
              Enter Room
            </button>
            <button
              onClick={() => { setRoom(null); setTopic(''); }}
              className="text-white/30 hover:text-white/60 text-sm transition-colors"
            >
              Create another room
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-[#0f0f0f]">
      <div className="card w-full max-w-md">
        <Link to="/" className="inline-flex items-center gap-1 text-sm text-white/30 hover:text-white/60 mb-6 transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </Link>

        <h1 className="text-2xl font-bold text-white mb-2">Create a Room</h1>
        <p className="text-white/40 text-sm mb-6">Enter a topic to start a group discussion practice session.</p>

        <form onSubmit={handleSubmit} noValidate>
          <label className="block text-sm font-medium text-white/60 mb-1.5" htmlFor="topic">
            GD Topic
          </label>
          <textarea
            id="topic"
            rows={3}
            className="input-field resize-none"
            placeholder="e.g. Should India abolish reservations in government jobs?"
            value={topic}
            onChange={(e) => { setTopic(e.target.value); setError(''); }}
            maxLength={255}
            disabled={loading}
          />
          <div className="flex justify-between mt-1 mb-4">
            {error ? (
              <p className="text-sm text-red-400">{error}</p>
            ) : (
              <span />
            )}
            <span className="text-xs text-white/20">{topic.length}/255</span>
          </div>

          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Creating…
              </span>
            ) : (
              'Create Room'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
