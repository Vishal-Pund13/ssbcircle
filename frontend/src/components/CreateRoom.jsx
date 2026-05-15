import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { createRoom } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function CreateRoom() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [topic, setTopic] = useState('');
  const [loading, setLoading] = useState(false);
  const [room, setRoom] = useState(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  const shareUrl = room ? `${window.location.origin}/join/${room.room_code}` : '';

  async function handleSubmit(e) {
    e.preventDefault();
    if (!user) { navigate('/login', { state: { from: location } }); return; }
    if (topic.trim().length < 3) { setError('Topic must be at least 3 characters'); return; }
    setLoading(true); setError('');
    try { setRoom(await createRoom(topic.trim())); }
    catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }

  async function handleCopy() {
    try { await navigator.clipboard.writeText(shareUrl); setCopied(true); setTimeout(() => setCopied(false), 2000); }
    catch {}
  }

  if (room) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md bg-white border border-gray-200 rounded-xl shadow-sm p-8 text-center">
        <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-1">Room created</h2>
        <p className="text-gray-400 text-sm mb-6">{room.topic}</p>

        <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 mb-5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">Room Code</p>
          <p className="text-4xl font-mono font-bold text-brand-600 tracking-[0.2em] mb-3">{room.room_code}</p>
          <button onClick={handleCopy} className="text-xs text-gray-400 hover:text-brand-600 transition-colors cursor-pointer font-medium">
            {copied ? '✓ Copied!' : '⧉ Copy invite link'}
          </button>
        </div>

        <button onClick={() => navigate(`/room/${room.room_code}`)} className="btn-primary w-full py-2.5 mb-3">
          Enter Room →
        </button>
        <button onClick={() => { setRoom(null); setTopic(''); }} className="text-sm text-gray-400 hover:text-gray-600 cursor-pointer">
          Create another
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-lg">
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 mb-6 transition-colors">
          ← Back
        </Link>
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-8">
          <h1 className="text-xl font-bold text-gray-900 mb-1">Create a room</h1>
          <p className="text-sm text-gray-400 mb-6">Enter a topic to start a group discussion.</p>

          <form onSubmit={handleSubmit}>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Discussion Topic</label>
            <textarea
              rows={3}
              className="input-base resize-none"
              placeholder='e.g. "Should India adopt AI in the defence sector?"'
              value={topic}
              onChange={e => { setTopic(e.target.value); setError(''); }}
              maxLength={255} disabled={loading}
            />
            <div className="flex justify-between mt-1.5 mb-5">
              {error ? <p className="text-xs text-red-500">{error}</p> : <span />}
              <span className="text-[11px] text-gray-300">{topic.length}/255</span>
            </div>
            <button type="submit" className="btn-primary w-full py-2.5" disabled={loading}>
              {loading ? 'Creating…' : 'Create Room'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
