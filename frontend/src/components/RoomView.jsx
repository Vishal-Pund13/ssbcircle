import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getRoom } from '../services/api';
import { useAuth } from '../context/AuthContext';
import GDTimer from './GDTimer';
import GDPanel from './GDPanel';

const JITSI_DOMAIN = import.meta.env.VITE_JITSI_DOMAIN || 'meet.jit.si';

function CircleIcon() {
  return (
    <svg viewBox="0 0 48 48" fill="none" className="w-5 h-5" aria-hidden="true">
      <circle cx="24" cy="24" r="22" stroke="#60a5fa" strokeWidth="3" />
      <circle cx="14" cy="20" r="3.5" fill="#60a5fa" />
      <circle cx="24" cy="14" r="3.5" fill="#60a5fa" />
      <circle cx="34" cy="20" r="3.5" fill="#60a5fa" />
      <circle cx="30" cy="31" r="3.5" fill="#60a5fa" />
      <circle cx="18" cy="31" r="3.5" fill="#60a5fa" />
      <path d="M14 20 L24 14 L34 20 L30 31 L18 31 Z" stroke="#60a5fa" strokeWidth="1.5" fill="none" />
    </svg>
  );
}

export default function RoomView() {
  const { code } = useParams();
  const navigate = useNavigate();
  const containerRef = useRef(null);
  const apiRef = useRef(null);

  const { user } = useAuth();
  const [room, setRoom] = useState(null);
  const [fetchStatus, setFetchStatus] = useState('loading');
  const [error, setError] = useState('');
  const [showTimer, setShowTimer] = useState(false);
  const [showPanel, setShowPanel] = useState(false);

  const isAdmin = room && user && room.created_by === user.id;

  // 1. Fetch room
  useEffect(() => {
    let cancelled = false;
    getRoom(code)
      .then((data) => {
        if (!cancelled) { setRoom(data); setFetchStatus('done'); }
      })
      .catch((err) => {
        if (!cancelled) { setError(err.message); setFetchStatus('error'); }
      });
    return () => { cancelled = true; };
  }, [code]);

  // 2. Load Jitsi
  useEffect(() => {
    if (!room) return;

    let script;

    function initJitsi() {
      if (!containerRef.current || !window.JitsiMeetExternalAPI) return;

      const api = new window.JitsiMeetExternalAPI(JITSI_DOMAIN, {
        roomName: room.jitsi_room_name,
        parentNode: containerRef.current,
        width: '100%',
        height: '100%',
        configOverwrite: {
          startWithAudioMuted: false,
          startWithVideoMuted: true,
          prejoinPageEnabled: false,
          enableWelcomePage: false,
          disableDeepLinking: true,
          hideConferenceSubject: true,
          subject: room.topic,
        },
        interfaceConfigOverwrite: {
          SHOW_JITSI_WATERMARK: false,
          SHOW_WATERMARK_FOR_GUESTS: false,
          SHOW_BRAND_WATERMARK: false,
          SHOW_POWERED_BY: false,
          SHOW_PROMOTIONAL_CLOSE_PAGE: false,
          MOBILE_APP_PROMO: false,
          HIDE_INVITE_MORE_HEADER: true,
          PROVIDER_NAME: 'SSBCircle',
          // hangup removed — use our Leave button to avoid 8x8 promo page
          TOOLBAR_BUTTONS: [
            'microphone',
            'chat',
            'raisehand',
            'participants-pane',
            'tileview',
          ],
        },
        userInfo: {
          displayName: user?.display_name || '',
          email: user?.email || '',
        },
      });

      // Enforce display name after joining (overrides any Jitsi default)
      api.addListener('videoConferenceJoined', () => {
        if (user?.display_name) {
          api.executeCommand('displayName', user.display_name);
        }
        if (user?.avatar_url) {
          api.executeCommand('avatarUrl', user.avatar_url);
        }
      });

      api.addListener('readyToClose', handleLeave);
      apiRef.current = api;
    }

    if (window.JitsiMeetExternalAPI) {
      initJitsi();
    } else {
      script = document.createElement('script');
      script.src = `https://${JITSI_DOMAIN}/external_api.js`;
      script.async = true;
      script.onload = initJitsi;
      script.onerror = () => {
        setError('Failed to load voice client. Check your connection.');
        setFetchStatus('error');
      };
      document.body.appendChild(script);
    }

    return () => {
      if (apiRef.current) { apiRef.current.dispose(); apiRef.current = null; }
      if (script && document.body.contains(script)) document.body.removeChild(script);
    };
  }, [room]);

  function handleLeave() {
    if (apiRef.current) { apiRef.current.dispose(); apiRef.current = null; }
    navigate('/');
  }

  // ── Error screen ───────────────────────────────────────────────────────────
  if (fetchStatus === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-slate-50">
        <div className="card w-full max-w-md text-center">
          <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Cannot join room</h2>
          <p className="text-slate-500 text-sm mb-6">{error}</p>
          <div className="flex gap-3 justify-center">
            <Link to="/" className="btn-secondary">Home</Link>
            <Link to="/join" className="btn-primary">Try again</Link>
          </div>
        </div>
      </div>
    );
  }

  // ── Room view ──────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-screen bg-slate-900 relative overflow-hidden">

      {/* ── Header ── */}
      <header className="flex items-center justify-between px-5 py-3 bg-[#0f1623] border-b border-white/5 shrink-0 z-10">
        {/* Left: brand + topic */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex items-center gap-2 shrink-0">
            <CircleIcon />
            <span className="text-blue-400 font-extrabold text-sm tracking-tight">SSBCircle</span>
          </div>
          {room && (
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-px h-4 bg-slate-700 shrink-0" />
              <span className="text-slate-400 text-xs truncate max-w-[140px] sm:max-w-sm">
                {room.topic}
              </span>
              {isAdmin && (
                <span className="shrink-0 bg-yellow-500/20 text-yellow-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-yellow-500/30">
                  ADMIN
                </span>
              )}
            </div>
          )}
        </div>

        {/* Right: tools + room code + leave */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Timer */}
          <button
            onClick={() => setShowTimer((v) => !v)}
            title="GD Timer"
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              showTimer
                ? 'bg-primary-600 text-white shadow-lg shadow-primary-900/40'
                : 'text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-700 border border-slate-700'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Timer
          </button>

          {/* Notes/Panel */}
          <button
            onClick={() => setShowPanel((v) => !v)}
            title="Transcript & Notes"
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              showPanel
                ? 'bg-primary-600 text-white shadow-lg shadow-primary-900/40'
                : 'text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-700 border border-slate-700'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Notes
          </button>

          {/* Room code */}
          {room && (
            <span className="hidden sm:inline-flex items-center bg-slate-800 text-slate-300 text-xs px-3 py-1.5 rounded-lg font-mono border border-slate-700">
              {room.room_code}
            </span>
          )}

          {/* Leave */}
          <button
            onClick={handleLeave}
            className="flex items-center gap-1.5 ml-1 bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white text-xs font-semibold px-3 py-1.5 rounded-lg border border-red-500/20 hover:border-red-500 transition-all"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Leave
          </button>
        </div>
      </header>

      {/* ── Loading ── */}
      {fetchStatus === 'loading' && (
        <div className="flex-1 flex flex-col items-center justify-center bg-slate-900">
          <svg className="animate-spin w-10 h-10 text-primary-500 mb-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          <p className="text-slate-400 text-sm">Loading room…</p>
        </div>
      )}

      {/* ── Jitsi ── */}
      {fetchStatus === 'done' && (
        <div className="flex-1 w-full relative">
          <div ref={containerRef} className="absolute inset-0" />
          {/* SSBCircle LIVE badge — covers Jitsi watermark */}
          <div
            className="absolute z-10 pointer-events-none"
            style={{ top: 0, left: 0, width: 200, height: 110,
              background: 'linear-gradient(135deg, #000 45%, rgba(0,0,0,0.5) 70%, transparent 100%)' }}
          />
          <div
            className="absolute z-20 pointer-events-none flex items-center gap-2.5 px-4 py-2.5 rounded-2xl border border-white/15"
            style={{ top: 14, left: 14, background: 'rgba(255,255,255,0.07)', backdropFilter: 'blur(8px)' }}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse shrink-0" />
            <span className="text-white text-sm font-bold tracking-wide">SSBCircle</span>
            <span className="bg-red-500/20 text-red-400 text-[10px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded-full border border-red-500/30">LIVE</span>
          </div>
        </div>
      )}

      {/* ── Floating Timer ── */}
      {showTimer && <GDTimer onClose={() => setShowTimer(false)} />}

      {/* ── Side Panel (transcript / notes / checklist) ── */}
      {showPanel && <GDPanel onClose={() => setShowPanel(false)} />}
    </div>
  );
}
