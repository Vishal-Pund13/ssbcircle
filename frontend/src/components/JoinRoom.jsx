import { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation, Link } from 'react-router-dom';
import { getRoom } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function JoinRoom() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { code: paramCode } = useParams();
  const [code, setCode] = useState(paramCode || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (paramCode && /^[A-Z0-9]{6}$/i.test(paramCode)) handleJoin(paramCode);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleJoin(roomCode) {
    const upper = (roomCode || code).toUpperCase().trim();
    if (!/^[A-Z0-9]{6}$/.test(upper)) { setError('Enter a valid 6-character room code'); return; }
    if (!user) { navigate('/login', { state: { from: location } }); return; }
    setError(''); setLoading(true);
    try { await getRoom(upper); navigate(`/room/${upper}`); }
    catch { setError('Room not found or no longer active.'); setLoading(false); }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-sm">
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 mb-6 transition-colors">
          ← Back
        </Link>
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-8">
          <h1 className="text-xl font-bold text-gray-900 mb-1">Join a room</h1>
          <p className="text-sm text-gray-400 mb-6">Enter the 6-character code from your host.</p>

          <form onSubmit={e => { e.preventDefault(); handleJoin(code); }}>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Room Code</label>
            <input
              type="text"
              className="input-base text-center text-2xl font-mono tracking-[0.4em] uppercase py-4"
              placeholder="ABC123"
              value={code}
              onChange={e => { setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6)); setError(''); }}
              maxLength={6} autoComplete="off" spellCheck={false} disabled={loading}
            />
            {error && <p className="text-xs text-red-500 mt-2">{error}</p>}
            <button type="submit" className="btn-primary w-full py-2.5 mt-5" disabled={loading || code.length !== 6}>
              {loading ? 'Joining…' : 'Join Room'}
            </button>
          </form>

          <p className="text-center text-xs text-gray-400 mt-5">
            No code?{' '}
            <Link to="/create" className="text-brand-600 font-medium hover:text-brand-700">Create a room</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
