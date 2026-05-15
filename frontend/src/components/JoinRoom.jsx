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

  // Auto-join if code is in the URL
  useEffect(() => {
    if (paramCode && /^[A-Z0-9]{6}$/i.test(paramCode)) {
      handleJoin(paramCode);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleJoin(roomCode) {
    const upper = (roomCode || code).toUpperCase().trim();
    if (!/^[A-Z0-9]{6}$/.test(upper)) {
      setError('Enter a valid 6-character room code');
      return;
    }
    if (!user) {
      navigate('/login', { state: { from: location } });
      return;
    }
    setError('');
    setLoading(true);
    try {
      await getRoom(upper);
      navigate(`/room/${upper}`);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  }

  function handleChange(e) {
    const val = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
    setCode(val);
    setError('');
  }

  function handleSubmit(e) {
    e.preventDefault();
    handleJoin(code);
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-slate-50">
      <div className="card w-full max-w-md">
        <Link to="/" className="inline-flex items-center gap-1 text-sm text-slate-400 hover:text-slate-600 mb-6 transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </Link>

        <h1 className="text-2xl font-bold text-slate-900 mb-2">Join a Room</h1>
        <p className="text-slate-500 text-sm mb-6">Enter the 6-character code shared by the room host.</p>

        <form onSubmit={handleSubmit} noValidate>
          <label className="block text-sm font-medium text-slate-700 mb-1.5" htmlFor="code">
            Room Code
          </label>
          <input
            id="code"
            type="text"
            className="input-field text-center text-2xl font-bold tracking-[0.4em] uppercase"
            placeholder="ABC123"
            value={code}
            onChange={handleChange}
            maxLength={6}
            autoComplete="off"
            spellCheck={false}
            disabled={loading}
          />
          {error && <p className="text-sm text-red-500 mt-2">{error}</p>}

          <button
            type="submit"
            className="btn-primary w-full mt-5"
            disabled={loading || code.length !== 6}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Joining…
              </span>
            ) : (
              'Join Room'
            )}
          </button>
        </form>

        <p className="text-center text-sm text-slate-400 mt-6">
          Don&apos;t have a code?{' '}
          <Link to="/create" className="text-primary-600 hover:underline font-medium">
            Create a room
          </Link>
        </p>
      </div>
    </div>
  );
}
