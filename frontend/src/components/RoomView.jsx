import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getRoom, getRoomToken, closeRoom, kickParticipant } from '../services/api';
import { useAuth } from '../context/AuthContext';
import GDTimer from './GDTimer';
import GDPanel from './GDPanel';
import {
  LiveKitRoom, RoomAudioRenderer,
  useParticipants, useLocalParticipant, useIsSpeaking, useRoomContext,
} from '@livekit/components-react';
import { RoomEvent } from 'livekit-client';
import {
  Mic, MicOff, Timer, MessageSquare, LogOut,
  AlertCircle, Hand, VolumeX, UserX, PhoneOff, Settings, Users,
} from 'lucide-react';

// ── Logo (navy, for light header) ───────────────────────────────────────────
function Logo() {
  return (
    <div className="flex items-center gap-2.5">
      <svg viewBox="0 0 48 48" fill="none" className="w-7 h-7">
        <circle cx="24" cy="24" r="22" stroke="#1e3a5f" strokeWidth="3"/>
        <circle cx="14" cy="20" r="3.5" fill="#1e3a5f"/>
        <circle cx="24" cy="14" r="3.5" fill="#1e3a5f"/>
        <circle cx="34" cy="20" r="3.5" fill="#1e3a5f"/>
        <circle cx="30" cy="31" r="3.5" fill="#1e3a5f"/>
        <circle cx="18" cy="31" r="3.5" fill="#1e3a5f"/>
        <path d="M14 20 L24 14 L34 20 L30 31 L18 31 Z" stroke="#1e3a5f" strokeWidth="1.5" fill="none"/>
      </svg>
      <span className="font-bold text-gray-900 text-[15px] tracking-tight">SSBCircle</span>
    </div>
  );
}

// ── Participant tile ─────────────────────────────────────────────────────────
function ParticipantTile({ participant, handRaised, isAdmin, roomCode, onMute }) {
  const isSpeaking = useIsSpeaking(participant);
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);
  const name     = participant.name || participant.identity || 'Participant';
  const initials = name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  const isMuted  = !participant.isMicrophoneEnabled;
  const isLocal  = participant.isLocal;

  useEffect(() => {
    if (!showMenu) return;
    function h(e) { if (menuRef.current && !menuRef.current.contains(e.target)) setShowMenu(false); }
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [showMenu]);

  async function handleKick() {
    setShowMenu(false);
    if (!window.confirm(`Remove ${name} from the room?`)) return;
    try { await kickParticipant(roomCode, participant.identity); }
    catch (e) { alert(e.message); }
  }

  return (
    <div className={`relative flex flex-col items-center justify-center p-3 sm:p-5 rounded-xl border-2 transition-all duration-200 group ${
      isSpeaking
        ? 'border-brand-600 bg-brand-50 shadow-md'
        : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
    }`}>

      {/* Raised hand */}
      {handRaised && (
        <div className="absolute top-2 left-2 bg-amber-50 border border-amber-200 text-amber-600 text-[10px] font-semibold px-1.5 py-0.5 rounded-full flex items-center gap-1">
          <Hand className="w-2.5 h-2.5"/> Hand
        </div>
      )}

      {/* Admin gear */}
      {isAdmin && !isLocal && (
        <div className="absolute top-2 right-2">
          <button
            onClick={() => setShowMenu(v => !v)}
            className="w-6 h-6 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-400 hover:text-gray-600 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
          >
            <Settings className="w-3 h-3"/>
          </button>
          {showMenu && (
            <div ref={menuRef} className="absolute top-8 right-0 bg-white border border-gray-200 rounded-xl shadow-lg py-1 z-50 min-w-[150px]">
              <button onClick={() => { setShowMenu(false); onMute(participant.identity); }}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors cursor-pointer text-left">
                <MicOff className="w-3.5 h-3.5 shrink-0"/> Request mute
              </button>
              <button onClick={handleKick}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-500 hover:bg-red-50 transition-colors cursor-pointer text-left">
                <UserX className="w-3.5 h-3.5 shrink-0"/> Remove from room
              </button>
            </div>
          )}
        </div>
      )}

      {/* Avatar */}
      <div className="relative mb-3">
        <div className={`w-10 h-10 sm:w-14 sm:h-14 rounded-full bg-brand-600 flex items-center justify-center text-sm sm:text-lg font-bold text-white transition-all ${
          isSpeaking ? 'ring-4 ring-brand-600/25' : ''
        }`}>
          {initials}
        </div>
        {isMuted && (
          <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-white border border-gray-200 rounded-full flex items-center justify-center shadow-sm">
            <MicOff className="w-2.5 h-2.5 text-red-500"/>
          </div>
        )}
      </div>

      <p className="text-xs font-semibold text-gray-700 text-center truncate w-full px-1 mb-1">
        {name}{isLocal && <span className="text-gray-400 font-normal"> (you)</span>}
      </p>

      {isSpeaking ? (
        <div className="flex items-end gap-0.5 h-4">
          {[3,6,9,6,3].map((h,i) => (
            <div key={i} className="w-0.5 bg-brand-600 rounded-full animate-bounce"
              style={{ height: h+'px', animationDelay: `${i*0.1}s` }}/>
          ))}
        </div>
      ) : (
        <div className="h-4 flex items-center">
          <span className="text-[10px] text-gray-400">{isMuted ? 'Muted' : 'Listening'}</span>
        </div>
      )}
    </div>
  );
}

// ── Admin panel ──────────────────────────────────────────────────────────────
function AdminPanel({ participants, roomCode, onMuteAll, onEndRoom, onMuteParticipant, onClose }) {
  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col sm:relative sm:inset-auto sm:z-20 sm:w-64 sm:shrink-0 sm:border-r sm:border-gray-200 shadow-lg">
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-gray-100">
        <span className="text-sm font-semibold text-gray-900">Room Controls</span>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 cursor-pointer text-lg leading-none">✕</button>
      </div>

      <div className="p-3 border-b border-gray-100 space-y-2">
        <p className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold px-1 mb-2">Quick Actions</p>
        <button onClick={onMuteAll}
          className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg bg-gray-50 hover:bg-gray-100 text-sm text-gray-700 hover:text-gray-900 transition-colors cursor-pointer text-left border border-gray-200">
          <VolumeX className="w-4 h-4 shrink-0 text-gray-500"/> Mute everyone
        </button>
        <button onClick={onEndRoom}
          className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg bg-red-50 hover:bg-red-100 text-sm text-red-600 transition-colors cursor-pointer text-left border border-red-100">
          <PhoneOff className="w-4 h-4 shrink-0"/> End room for all
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        <p className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold px-1 mb-2">
          Participants ({participants.length})
        </p>
        <div className="space-y-1.5">
          {participants.map(p => {
            const name = p.name || p.identity;
            return (
              <div key={p.identity}
                className="flex items-center justify-between px-3 py-2 rounded-lg bg-gray-50 border border-gray-100">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-6 h-6 rounded-full bg-brand-600 flex items-center justify-center text-[9px] font-bold text-white shrink-0">
                    {name.slice(0,2).toUpperCase()}
                  </div>
                  <span className="text-xs text-gray-700 truncate">{name}</span>
                  {p.isLocal && <span className="text-[9px] text-gray-400 shrink-0">you</span>}
                </div>
                {!p.isLocal && (
                  <div className="flex items-center gap-0.5 shrink-0">
                    <button onClick={() => onMuteParticipant(p.identity)}
                      className="p-1 rounded text-gray-400 hover:text-amber-600 hover:bg-amber-50 transition-colors cursor-pointer">
                      <MicOff className="w-3 h-3"/>
                    </button>
                    <button onClick={async () => {
                      if (!window.confirm(`Remove ${name}?`)) return;
                      try { await kickParticipant(roomCode, p.identity); }
                      catch (e) { alert(e.message); }
                    }}
                      className="p-1 rounded text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors cursor-pointer">
                      <UserX className="w-3 h-3"/>
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Voice room UI ────────────────────────────────────────────────────────────
function VoiceRoomUI({ room, isAdmin, roomCode, showTimer, setShowTimer, showPanel, setShowPanel, onLeave }) {
  const lkRoom = useRoomContext();
  const participants = useParticipants();
  const { localParticipant } = useLocalParticipant();
  const isMuted = !localParticipant.isMicrophoneEnabled;

  const [myHandRaised, setMyHandRaised] = useState(false);
  const [raisedHands,  setRaisedHands]  = useState(new Set());
  const [chatMessages, setChatMessages] = useState([]);
  const [unreadChat,   setUnreadChat]   = useState(0);
  const [panelTab,     setPanelTab]     = useState('chat');
  const [showAdmin,    setShowAdmin]    = useState(false);

  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  useEffect(() => {
    function handleData(payload, participant) {
      try {
        const msg = JSON.parse(decoder.decode(payload));
        if (msg.type === 'CHAT') {
          setChatMessages(prev => [...prev, { ...msg, id: Date.now() + Math.random() }]);
          setUnreadChat(n => n + 1);
        }
        if (msg.type === 'RAISE_HAND') {
          const id = participant?.identity ?? msg.identity;
          setRaisedHands(prev => { const s = new Set(prev); msg.raised ? s.add(id) : s.delete(id); return s; });
        }
        if (msg.type === 'MUTE_ALL' && !isAdmin) localParticipant.setMicrophoneEnabled(false);
        if (msg.type === 'MUTE_PARTICIPANT' && msg.identity === localParticipant.identity) localParticipant.setMicrophoneEnabled(false);
        if (msg.type === 'END_ROOM') onLeave();
      } catch { /* ignore */ }
    }
    lkRoom.on(RoomEvent.DataReceived, handleData);
    return () => lkRoom.off(RoomEvent.DataReceived, handleData);
  }, [lkRoom, isAdmin]);

  function publish(data) {
    lkRoom.localParticipant.publishData(encoder.encode(JSON.stringify(data)), { reliable: true });
  }

  function sendChat(text) {
    const msg = {
      type: 'CHAT',
      sender: localParticipant.name || localParticipant.identity,
      text,
      ts: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
    };
    setChatMessages(prev => [...prev, { ...msg, id: Date.now(), isMe: true }]);
    publish(msg);
  }

  function toggleHand() {
    const raised = !myHandRaised;
    setMyHandRaised(raised);
    const id = lkRoom.localParticipant.identity;
    setRaisedHands(prev => { const s = new Set(prev); raised ? s.add(id) : s.delete(id); return s; });
    publish({ type: 'RAISE_HAND', raised, identity: id });
  }

  function muteParticipant(identity) { publish({ type: 'MUTE_PARTICIPANT', identity }); }
  function muteAll() { publish({ type: 'MUTE_ALL' }); }

  async function endRoomForAll() {
    if (!window.confirm('End the room for everyone?')) return;
    publish({ type: 'END_ROOM' });
    try { await closeRoom(roomCode); } catch { /* best-effort */ }
    onLeave();
  }

  function openChat() {
    setPanelTab('chat');
    setShowPanel(true);
    setUnreadChat(0);
  }

  return (
    <>
      <RoomAudioRenderer />

      <div className="flex-1 flex overflow-hidden relative">
        {/* Admin panel */}
        {showAdmin && isAdmin && (
          <AdminPanel
            participants={participants}
            roomCode={roomCode}
            onMuteAll={muteAll}
            onEndRoom={endRoomForAll}
            onMuteParticipant={muteParticipant}
            onClose={() => setShowAdmin(false)}
          />
        )}

        {/* Main grid */}
        <div className="flex-1 overflow-auto p-3 sm:p-6 bg-gray-50">
          {participants.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-16 h-16 rounded-xl bg-white border border-gray-200 flex items-center justify-center mx-auto mb-4 shadow-sm">
                <Mic className="w-7 h-7 text-gray-300"/>
              </div>
              <p className="text-gray-600 font-semibold text-sm">Waiting for others to join…</p>
              <p className="text-gray-400 text-xs mt-1">
                Share the code{' '}
                <span className="font-mono font-semibold text-brand-600 bg-brand-50 px-1.5 py-0.5 rounded">
                  {room.room_code}
                </span>
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-4 max-w-4xl mx-auto">
              {participants.map(p => (
                <ParticipantTile
                  key={p.identity}
                  participant={p}
                  handRaised={raisedHands.has(p.identity)}
                  isAdmin={isAdmin}
                  roomCode={roomCode}
                  onMute={muteParticipant}
                />
              ))}
            </div>
          )}
        </div>

        {/* Notes / chat panel */}
        {showPanel && (
          <GDPanel
            onClose={() => setShowPanel(false)}
            chatMessages={chatMessages}
            onSendMessage={sendChat}
            activeTab={panelTab}
            onTabChange={setPanelTab}
          />
        )}
      </div>

      {/* Bottom bar — scrollable on mobile */}
      <div className="shrink-0 bg-white border-t border-gray-200 py-2.5 sm:py-3 px-3 sm:px-5 overflow-x-auto">
      <div className="flex items-center justify-center gap-2 min-w-max mx-auto">

        {/* Mic */}
        <button onClick={() => localParticipant.setMicrophoneEnabled(isMuted)}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer border ${
            isMuted
              ? 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100'
              : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
          }`}>
          {isMuted ? <MicOff className="w-4 h-4"/> : <Mic className="w-4 h-4"/>}
          <span className="hidden sm:inline">{isMuted ? 'Unmute' : 'Mute'}</span>
        </button>

        {/* Raise hand */}
        <button onClick={toggleHand}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer border ${
            myHandRaised
              ? 'bg-amber-50 text-amber-600 border-amber-200'
              : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
          }`}>
          <Hand className="w-4 h-4"/>
          <span className="hidden sm:inline">{myHandRaised ? 'Lower Hand' : 'Raise Hand'}</span>
        </button>

        {/* Chat */}
        <button onClick={openChat}
          className="relative flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold bg-white text-gray-600 border border-gray-200 hover:bg-gray-50 transition-all cursor-pointer">
          <MessageSquare className="w-4 h-4"/>
          <span className="hidden sm:inline">Chat</span>
          {unreadChat > 0 && (
            <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-brand-600 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
              {unreadChat > 9 ? '9+' : unreadChat}
            </span>
          )}
        </button>

        {/* Notes */}
        <button onClick={() => { setPanelTab('transcript'); setShowPanel(v => !v); }}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer border ${
            showPanel && panelTab !== 'chat'
              ? 'bg-brand-600 text-white border-brand-600'
              : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
          }`}>
          <FileText className="w-4 h-4"/>
          <span className="hidden sm:inline">Notes</span>
        </button>

        {/* Admin controls */}
        {isAdmin && (
          <button onClick={() => setShowAdmin(v => !v)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer border ${
              showAdmin
                ? 'bg-brand-600 text-white border-brand-600'
                : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
            }`}>
            <Settings className="w-4 h-4"/>
            <span className="hidden sm:inline">Controls</span>
          </button>
        )}

        {/* Count */}
        <div className="flex items-center gap-1.5 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-500 font-medium whitespace-nowrap">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0"/>
          {participants.length} in room
        </div>

        {/* Leave */}
        <button onClick={onLeave}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold bg-red-500 hover:bg-red-600 text-white transition-colors cursor-pointer">
          <LogOut className="w-4 h-4"/>
          <span className="hidden sm:inline">Leave</span>
        </button>

      </div>{/* end min-w-max */}
      </div>{/* end overflow-x-auto */}

      {showTimer && <GDTimer onClose={() => setShowTimer(false)} />}
    </>
  );
}

// ── Root ─────────────────────────────────────────────────────────────────────
export default function RoomView() {
  const { code } = useParams();
  const navigate  = useNavigate();
  const { user }  = useAuth();

  const [room,        setRoom]        = useState(null);
  const [token,       setToken]       = useState('');
  const [livekitUrl,  setLivekitUrl]  = useState('');
  const [fetchStatus, setFetchStatus] = useState('loading');
  const [error,       setError]       = useState('');
  const [showTimer,   setShowTimer]   = useState(false);
  const [showPanel,   setShowPanel]   = useState(false);

  const isAdmin = room && user && room.created_by === user.id;

  useEffect(() => {
    let cancelled = false;
    Promise.all([getRoom(code), getRoomToken(code)])
      .then(([roomData, tokenData]) => {
        if (!cancelled) {
          setRoom(roomData);
          setToken(tokenData.token);
          setLivekitUrl(tokenData.url);
          setFetchStatus('done');
        }
      })
      .catch(err => { if (!cancelled) { setError(err.message); setFetchStatus('error'); } });
    return () => { cancelled = true; };
  }, [code]);

  function handleLeave() { navigate('/'); }

  if (fetchStatus === 'error') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-8 w-full max-w-sm text-center">
          <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-6 h-6 text-red-500"/>
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-1">Cannot join room</h2>
          <p className="text-sm text-gray-400 mb-6">{error}</p>
          <div className="flex gap-3 justify-center">
            <Link to="/" className="btn-secondary text-sm px-4 py-2">Home</Link>
            <Link to="/join" className="btn-primary text-sm px-4 py-2">Try again</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-white overflow-hidden">

      {/* Header — matches homepage nav exactly */}
      <header className="flex items-center justify-between px-5 py-3 bg-white border-b border-gray-200 shrink-0 z-10 shadow-sm">
        <div className="flex items-center gap-3 min-w-0">
          <Logo/>
          {room && (
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-px h-4 bg-gray-200 shrink-0"/>
              <span className="text-gray-500 text-xs truncate max-w-[160px] sm:max-w-xs font-medium">
                {room.topic}
              </span>
              {isAdmin && (
                <span className="shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-brand-50 text-brand-600 border border-brand-100">
                  HOST
                </span>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button onClick={() => setShowTimer(v => !v)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer border ${
              showTimer
                ? 'bg-brand-600 text-white border-brand-600'
                : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50 hover:text-gray-700'
            }`}>
            <Timer className="w-3.5 h-3.5"/>
            <span className="hidden sm:inline">Timer</span>
          </button>

          {room && (
            <span className="hidden sm:inline-flex items-center gap-1.5 text-gray-400 text-[11px] px-2.5 py-1.5 rounded-lg font-mono border border-gray-200 bg-gray-50">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"/>
              {room.room_code}
            </span>
          )}
        </div>
      </header>

      {/* Loading */}
      {fetchStatus === 'loading' && (
        <div className="flex-1 flex flex-col items-center justify-center bg-gray-50">
          <svg className="animate-spin w-8 h-8 text-brand-600 mb-3" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
          </svg>
          <p className="text-gray-400 text-sm">Connecting to room…</p>
        </div>
      )}

      {/* LiveKit */}
      {fetchStatus === 'done' && token && livekitUrl && (
        <LiveKitRoom
          token={token}
          serverUrl={livekitUrl}
          connect audio video={false}
          onDisconnected={handleLeave}
          className="flex-1 flex flex-col overflow-hidden"
        >
          <VoiceRoomUI
            room={room}
            isAdmin={isAdmin}
            roomCode={code}
            showTimer={showTimer}
            setShowTimer={setShowTimer}
            showPanel={showPanel}
            setShowPanel={setShowPanel}
            onLeave={handleLeave}
          />
        </LiveKitRoom>
      )}
    </div>
  );
}
