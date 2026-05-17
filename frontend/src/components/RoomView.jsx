import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getRoom, getRoomToken, closeRoom, kickParticipant, reportUser } from '../services/api';
import { useAuth } from '../context/AuthContext';
import GDTimer from './GDTimer';
import GDPanel from './GDPanel';
import {
  LiveKitRoom, RoomAudioRenderer,
  useParticipants, useLocalParticipant, useIsSpeaking, useRoomContext,
  useTracks, VideoTrack,
} from '@livekit/components-react';
import { RoomEvent, Track } from 'livekit-client';
import {
  Mic, MicOff, Timer, FileText, MessageSquare, LogOut,
  AlertCircle, Hand, VolumeX, Volume2, UserX, PhoneOff, Settings, Trash2, Flag,
  ScreenShare, ScreenShareOff, Monitor,
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

const REPORT_REASONS = [
  'Inappropriate language',
  'Harassment or bullying',
  'Spam / off-topic',
  'Impersonation',
  'Other',
];

// ── Report modal ──────────────────────────────────────────────────────────────
function ReportModal({ participant, roomCode, onClose }) {
  const [reason,      setReason]      = useState('');
  const [description, setDescription] = useState('');
  const [submitting,  setSubmitting]  = useState(false);
  const [done,        setDone]        = useState(false);

  async function submit() {
    if (!reason) return;
    setSubmitting(true);
    try {
      await reportUser({ reported_user_id: participant.identity, room_code: roomCode, reason, description });
      setDone(true);
    } catch { /* non-critical */ }
    finally { setSubmitting(false); }
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6" onClick={e => e.stopPropagation()}>
        {done ? (
          <>
            <div className="w-10 h-10 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-3">
              <Flag className="w-5 h-5 text-emerald-600" />
            </div>
            <h3 className="text-base font-semibold text-gray-900 text-center mb-1">Report submitted</h3>
            <p className="text-sm text-gray-500 text-center mb-4">Our team will review it and take action if needed.</p>
            <button onClick={onClose} className="w-full py-2 rounded-lg text-sm font-medium bg-gray-100 hover:bg-gray-200 transition-colors cursor-pointer">Close</button>
          </>
        ) : (
          <>
            <h3 className="text-base font-semibold text-gray-900 mb-1">Report {participant.name || 'participant'}</h3>
            <p className="text-xs text-gray-400 mb-4">Help us keep SSBCircle safe. False reports may result in action against your account.</p>
            <div className="flex flex-col gap-2 mb-4">
              {REPORT_REASONS.map(r => (
                <button key={r} onClick={() => setReason(r)}
                  className={`px-3 py-2 rounded-lg text-sm text-left border transition-all cursor-pointer ${reason === r ? 'bg-brand-50 border-brand-300 text-brand-700 font-semibold' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                  {r}
                </button>
              ))}
            </div>
            <textarea
              placeholder="Additional details (optional)"
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={2}
              maxLength={500}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 resize-none focus:outline-none focus:border-brand-400 mb-4"
            />
            <div className="flex gap-2">
              <button onClick={onClose} className="flex-1 py-2 rounded-lg text-sm font-medium bg-gray-100 hover:bg-gray-200 transition-colors cursor-pointer">Cancel</button>
              <button onClick={submit} disabled={!reason || submitting}
                className="flex-1 py-2 rounded-lg text-sm font-semibold bg-red-500 hover:bg-red-600 text-white transition-colors cursor-pointer disabled:opacity-50">
                {submitting ? 'Submitting…' : 'Submit Report'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── Confirm dialog ────────────────────────────────────────────────────────────
function ConfirmDialog({ open, title, message, confirmLabel = 'Confirm', onConfirm, onCancel }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={onCancel}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6" onClick={e => e.stopPropagation()}>
        <h3 className="text-base font-semibold text-gray-900 mb-1">{title}</h3>
        <p className="text-sm text-gray-500 mb-5">{message}</p>
        <div className="flex gap-2 justify-end">
          <button onClick={onCancel}
            className="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors cursor-pointer">
            Cancel
          </button>
          <button onClick={onConfirm}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-red-500 hover:bg-red-600 text-white transition-colors cursor-pointer">
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Hint-aware button wrapper ─────────────────────────────────────────────────
function HintButton({ hint, children, ...props }) {
  const [show, setShow] = useState(false);
  const timer = useRef(null);

  function onTouchStart() { timer.current = setTimeout(() => setShow(true), 500); }
  function onTouchEnd() { clearTimeout(timer.current); if (show) setTimeout(() => setShow(false), 1500); }

  return (
    <div className="relative shrink-0">
      {show && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-[180px] bg-gray-800 text-white text-[11px] leading-snug rounded-lg px-3 py-1.5 text-center z-50 pointer-events-none shadow-lg">
          {hint}
          <span className="absolute top-full left-1/2 -translate-x-1/2 border-[5px] border-transparent border-t-gray-800"/>
        </div>
      )}
      <button {...props} onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}
        onTouchStart={onTouchStart} onTouchEnd={onTouchEnd} onTouchMove={() => clearTimeout(timer.current)}>
        {children}
      </button>
    </div>
  );
}

// ── Participant tile ─────────────────────────────────────────────────────────
function ParticipantTile({ participant, handRaised, isAdmin, roomCode, onMute, hostId }) {
  const isSpeaking = useIsSpeaking(participant);
  const [showKickConfirm,   setShowKickConfirm]   = useState(false);
  const [showReportModal,   setShowReportModal]    = useState(false);
  const [locallyMuted, setLocallyMuted] = useState(false);
  const name     = participant.name || participant.identity || 'Participant';
  const initials = name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  const isMuted  = !participant.isMicrophoneEnabled;
  const isLocal  = participant.isLocal;

  function toggleLocalMute() {
    const next = !locallyMuted;
    setLocallyMuted(next);
    try { participant.setVolume(next ? 0 : 1); } catch {}
  }

  async function confirmKick() {
    setShowKickConfirm(false);
    try { await kickParticipant(roomCode, participant.identity); }
    catch (e) { alert(e.message); }
  }

  return (
    <div className={`relative flex flex-col items-center justify-center p-3 sm:p-5 rounded-xl border-2 transition-all duration-200 group ${
      isSpeaking
        ? 'border-brand-600 bg-brand-50 shadow-md'
        : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
    }`}>

      {/* Host badge */}
      {hostId && participant.identity === hostId && (
        <div className="absolute top-2 left-2 bg-brand-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
          HOST
        </div>
      )}

      {/* Raised hand */}
      {handRaised && (
        <div className={`absolute text-amber-600 text-[10px] font-semibold px-1.5 py-0.5 rounded-full flex items-center gap-1 bg-amber-50 border border-amber-200 ${hostId && participant.identity === hostId ? 'top-2 left-14' : 'top-2 left-2'}`}>
          <Hand className="w-2.5 h-2.5"/> Hand
        </div>
      )}

      {/* Action buttons — always visible on mobile, hover-only on desktop */}
      {!isLocal && (
        <div className="absolute top-2 right-2 flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all">
          {/* Speaker toggle — everyone can locally mute a participant */}
          <button onClick={toggleLocalMute}
            title={locallyMuted ? 'Unmute for you' : 'Mute for you'}
            className={`w-6 h-6 rounded-full flex items-center justify-center transition-all cursor-pointer ${locallyMuted ? 'bg-red-100 text-red-500' : 'bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-700'}`}>
            {locallyMuted ? <VolumeX className="w-3 h-3"/> : <Volume2 className="w-3 h-3"/>}
          </button>
          {/* Mute mic — admin only */}
          {isAdmin && (
            <button onClick={() => onMute(participant.identity)}
              title="Request mute"
              className="w-6 h-6 rounded-full bg-gray-100 hover:bg-amber-100 text-gray-500 hover:text-amber-600 flex items-center justify-center transition-all cursor-pointer">
              <MicOff className="w-3 h-3"/>
            </button>
          )}
          {/* Kick — admin only */}
          {isAdmin && (
            <button onClick={() => setShowKickConfirm(true)}
              title="Remove from room"
              className="w-6 h-6 rounded-full bg-gray-100 hover:bg-red-100 text-gray-500 hover:text-red-500 flex items-center justify-center transition-all cursor-pointer">
              <UserX className="w-3 h-3"/>
            </button>
          )}
          {/* Report — available to everyone */}
          <button onClick={() => setShowReportModal(true)}
            title="Report this participant"
            className="w-6 h-6 rounded-full bg-gray-100 hover:bg-orange-100 text-gray-400 hover:text-orange-500 flex items-center justify-center transition-all cursor-pointer">
            <Flag className="w-3 h-3"/>
          </button>
        </div>
      )}
      {showReportModal && (
        <ReportModal participant={participant} roomCode={roomCode} onClose={() => setShowReportModal(false)} />
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

      <p className="text-xs font-semibold text-gray-700 text-center truncate w-full px-1 mb-1" title={name}>
        {isLocal ? 'You' : name}
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
      <ConfirmDialog open={showKickConfirm} title="Remove participant?"
        message={`Remove ${name} from the room? They won't be able to rejoin unless invited again.`}
        confirmLabel="Remove" onConfirm={confirmKick} onCancel={() => setShowKickConfirm(false)}/>
    </div>
  );
}

// ── Admin panel ──────────────────────────────────────────────────────────────
function AdminPanel({ participants, roomCode, onMuteAll, onEndRoom, onMuteParticipant, onClose }) {
  const [pendingKick, setPendingKick] = useState(null);

  async function confirmKick() {
    if (!pendingKick) return;
    setPendingKick(null);
    try { await kickParticipant(roomCode, pendingKick.identity); }
    catch (e) { alert(e.message); }
  }

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
                    <button onClick={() => setPendingKick({ identity: p.identity, name })}
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
      <ConfirmDialog open={!!pendingKick} title="Remove participant?"
        message={`Remove ${pendingKick?.name} from the room? They won't be able to rejoin unless invited again.`}
        confirmLabel="Remove" onConfirm={confirmKick} onCancel={() => setPendingKick(null)}/>
    </div>
  );
}

// ── Voice room UI ────────────────────────────────────────────────────────────
function VoiceRoomUI({ room, isAdmin, roomCode, showTimer, setShowTimer, showPanel, setShowPanel, onLeave, setIsTranscribing }) {
  const lkRoom = useRoomContext();
  const participants = useParticipants();
  const { localParticipant } = useLocalParticipant();
  const isMuted = !localParticipant.isMicrophoneEnabled;

  const screenTracks    = useTracks([{ source: Track.Source.ScreenShare, withPlaceholder: false }]);
  const activeScreen    = screenTracks[0] ?? null;
  const isScreenSharing = screenTracks.some(t => t.participant.isLocal);

  const [myHandRaised,   setMyHandRaised]   = useState(false);
  const [raisedHands,    setRaisedHands]    = useState(new Set());
  const [chatMessages,   setChatMessages]   = useState([]);
  const [unreadChat,     setUnreadChat]     = useState(0);
  const [panelTab,       setPanelTab]       = useState('chat');
  const [showAdmin,      setShowAdmin]      = useState(false);
  const [isMicToggling,  setIsMicToggling]  = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [hostTipDismissed, setHostTipDismissed] = useState(false);
  const [timerSyncEvent, setTimerSyncEvent] = useState(null);

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
        if (['TIMER_START','TIMER_PAUSE','TIMER_RESUME','TIMER_RESET'].includes(msg.type)) {
          setTimerSyncEvent(msg);
          if (msg.type === 'TIMER_START') setShowTimer(true);
        }
        if (msg.type === 'TIMER_CLOSE') setShowTimer(false);
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

  async function toggleMic() {
    if (isMicToggling) return;
    setIsMicToggling(true);
    try { await localParticipant.setMicrophoneEnabled(isMuted); } catch {}
    finally { setIsMicToggling(false); }
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

  async function toggleScreenShare() {
    if (isScreenSharing) {
      try { await localParticipant.setScreenShareEnabled(false); } catch {}
      return;
    }
    const isMobile = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);
    if (isMobile) {
      alert('Screen sharing is only supported on desktop browsers (Chrome / Edge / Firefox). Open SSBCircle on your laptop or PC to share your screen.');
      return;
    }
    try { await localParticipant.setScreenShareEnabled(true); }
    catch { /* user cancelled */ }
  }

  function openChat() {
    setPanelTab('chat');
    setShowPanel(true);
    setUnreadChat(0);
  }

  // Participant mini-tile for the screen-share sidebar strip
  function MiniTile({ p }) {
    const name     = p.name || p.identity;
    const initials = name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
    return (
      <div className={`shrink-0 flex flex-col items-center gap-1 p-2 rounded-lg border transition-all ${
        p.isSpeaking ? 'border-brand-600 bg-brand-50' : 'border-gray-200 bg-white'
      }`}>
        <div className={`w-9 h-9 rounded-full bg-brand-600 flex items-center justify-center text-[11px] font-bold text-white ${
          p.isSpeaking ? 'ring-2 ring-brand-600/30' : ''
        }`}>{initials}</div>
        <span className="text-[9px] text-gray-500 truncate w-full text-center">{p.isLocal ? 'You' : name}</span>
      </div>
    );
  }

  return (
    <>
      <RoomAudioRenderer />

      {/* ── Middle: admin panel + main + right panel ── */}
      <div className="flex-1 flex overflow-hidden">

        {/* Admin panel — left sidebar on desktop, full overlay on mobile */}
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

        {/* ── Main content area ── */}
        <div className="flex-1 flex flex-col overflow-hidden bg-gray-50">

          {/* Host-only screen share tip — dismissible */}
          {isAdmin && !hostTipDismissed && !isScreenSharing && (
            <div className="shrink-0 flex items-start gap-3 bg-brand-50 border-b border-brand-100 px-4 py-2.5">
              <Monitor className="w-4 h-4 text-brand-600 shrink-0 mt-0.5" />
              <p className="text-xs text-brand-700 leading-relaxed flex-1">
                <span className="font-semibold">Host tip:</span> Share your screen to show the PPDT image, GD leads or topic — helps newcomers follow along and keeps the group channelized.
              </p>
              <button onClick={() => setHostTipDismissed(true)}
                className="shrink-0 text-brand-400 hover:text-brand-600 transition-colors cursor-pointer text-lg leading-none">
                ×
              </button>
            </div>
          )}

          {activeScreen ? (
            /* ── Screen share active — video top/left, participants strip bottom/right ── */
            <div className="flex-1 flex flex-col sm:flex-row overflow-hidden">
              {/* Screen video — full width on mobile, flex-1 on desktop */}
              <div className="flex-1 bg-gray-900 relative overflow-hidden flex items-center justify-center min-h-0">
                <VideoTrack trackRef={activeScreen} className="max-w-full max-h-full object-contain" />
                <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-black/60 text-white text-xs px-2.5 py-1.5 rounded-full backdrop-blur-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  {activeScreen.participant.isLocal ? 'You are' : `${activeScreen.participant.name || activeScreen.participant.identity} is`} sharing screen
                </div>
              </div>
              {/* Participant strip — horizontal bottom on mobile, vertical right on desktop */}
              <div className="flex sm:flex-col gap-2 p-2 bg-white border-t sm:border-t-0 sm:border-l border-gray-200 overflow-x-auto sm:overflow-y-auto sm:overflow-x-hidden shrink-0 sm:w-44">
                {participants.map(p => <MiniTile key={p.identity} p={p} />)}
              </div>
            </div>
          ) : (
            /* ── Normal participant grid ── */
            <div className="flex-1 overflow-auto p-3 sm:p-6 flex items-center justify-center">
              {participants.length === 0 ? (
                <div className="text-center">
                  <div className="w-16 h-16 rounded-xl bg-white border border-gray-200 flex items-center justify-center mx-auto mb-4 shadow-sm">
                    <Mic className="w-7 h-7 text-gray-300"/>
                  </div>
                  <p className="text-gray-600 font-semibold text-sm">Waiting for others to join…</p>
                  <p className="text-gray-400 text-xs mt-1">
                    Share the code <span className="font-mono font-semibold text-brand-600 bg-brand-50 px-1.5 py-0.5 rounded">{room.room_code}</span>
                  </p>
                </div>
              ) : (
                <div className={`grid gap-2 sm:gap-4 w-full max-w-4xl mx-auto ${
                  participants.length === 1 ? 'grid-cols-1 max-w-xs' :
                  participants.length === 2 ? 'grid-cols-2 max-w-lg' :
                  participants.length <= 4  ? 'grid-cols-2' :
                  participants.length <= 6  ? 'grid-cols-2 sm:grid-cols-3' :
                  'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4'
                }`}>
                  {participants.map(p => (
                    <ParticipantTile key={p.identity} participant={p} handRaised={raisedHands.has(p.identity)} isAdmin={isAdmin} roomCode={roomCode} onMute={muteParticipant} hostId={room.created_by ? String(room.created_by) : null} />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Notes / chat panel — right sidebar */}
        <GDPanel
          show={showPanel}
          onClose={() => setShowPanel(false)}
          chatMessages={chatMessages}
          onSendMessage={sendChat}
          activeTab={panelTab}
          onTabChange={setPanelTab}
          onTranscriptStateChange={v => setIsTranscribing?.(v)}
        />
      </div>

      {/* ── Bottom bar — GMeet 3-group layout ── */}
      <div className="shrink-0 bg-white border-t border-gray-200 pt-2.5 sm:py-3 px-3 sm:px-5"
        style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px) + 10px, 14px)' }}>

        {/* Mobile: single centered scrollable row — Mic in center */}
        <div className="flex sm:hidden items-center justify-center gap-2 overflow-x-auto pb-1">
          <HintButton hint="Signal you want to speak without interrupting — like in a GTO group task" onClick={toggleHand}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer border ${myHandRaised ? 'bg-amber-50 text-amber-600 border-amber-200' : 'bg-white text-gray-600 border-gray-200'}`}>
            <Hand className="w-4 h-4"/>
          </HintButton>
          <HintButton hint="Share your screen — useful in mock presentations & interviews" onClick={toggleScreenShare}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer border ${isScreenSharing ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-white text-gray-600 border-gray-200'}`}>
            {isScreenSharing ? <ScreenShareOff className="w-4 h-4"/> : <ScreenShare className="w-4 h-4"/>}
          </HintButton>
          <HintButton hint="Mute yourself when others speak — practice active listening like in a GD" onClick={toggleMic} disabled={isMicToggling}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer border ${isMicToggling ? 'opacity-60 cursor-wait' : ''} ${isMuted ? 'bg-red-50 text-red-600 border-red-200' : 'bg-white text-gray-700 border-gray-200'}`}>
            {isMuted ? <MicOff className="w-4 h-4"/> : <Mic className="w-4 h-4"/>}
          </HintButton>
          <HintButton hint="Send text to the group without interrupting the discussion" onClick={openChat}
            className="relative flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold bg-white text-gray-600 border border-gray-200 cursor-pointer">
            <MessageSquare className="w-4 h-4"/>
            {unreadChat > 0 && <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-brand-600 text-white text-[9px] font-bold rounded-full flex items-center justify-center">{unreadChat > 9 ? '9+' : unreadChat}</span>}
          </HintButton>
          <HintButton hint="Auto-captures spoken words — review your GD performance after the session" onClick={() => { setPanelTab('transcript'); setShowPanel(v => !v); }}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer border ${showPanel && panelTab !== 'chat' ? 'bg-brand-600 text-white border-brand-600' : 'bg-white text-gray-600 border-gray-200'}`}>
            <FileText className="w-4 h-4"/>
          </HintButton>
          {isAdmin && (
            <HintButton hint="Manage participants — mute, remove, or end the room" onClick={() => setShowAdmin(v => !v)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer border ${showAdmin ? 'bg-brand-600 text-white border-brand-600' : 'bg-white text-gray-600 border-gray-200'}`}>
              <Settings className="w-4 h-4"/>
            </HintButton>
          )}
          {isAdmin && (
            <HintButton hint="End session and delete room for everyone" onClick={endRoomForAll}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold bg-red-600 hover:bg-red-700 text-white transition-colors cursor-pointer">
              <Trash2 className="w-4 h-4"/>
            </HintButton>
          )}
          {!isAdmin && (
            <HintButton hint="Exit the voice room" onClick={() => setShowLeaveConfirm(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold bg-red-500 hover:bg-red-600 text-white transition-colors cursor-pointer">
              <LogOut className="w-4 h-4"/>
            </HintButton>
          )}
        </div>

        {/* Desktop: 3-column GMeet layout */}
        <div className="hidden sm:grid grid-cols-3 items-center">

          {/* Left — participant count */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-500 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0"/>
              {participants.length} in room
            </div>
          </div>

          {/* Center — all controls, Mic in middle */}
          <div className="flex items-center justify-center gap-2">
            <HintButton hint="Signal you want to speak without interrupting — like in a GTO group task" onClick={toggleHand}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer border ${myHandRaised ? 'bg-amber-50 text-amber-600 border-amber-200' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}>
              <Hand className="w-4 h-4"/>
              {myHandRaised ? 'Lower Hand' : 'Raise Hand'}
            </HintButton>
            <HintButton hint="Send text to the group without interrupting the discussion" onClick={openChat}
              className="relative flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold bg-white text-gray-600 border border-gray-200 hover:bg-gray-50 transition-all cursor-pointer">
              <MessageSquare className="w-4 h-4"/> Chat
              {unreadChat > 0 && <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-brand-600 text-white text-[9px] font-bold rounded-full flex items-center justify-center">{unreadChat > 9 ? '9+' : unreadChat}</span>}
            </HintButton>
            <HintButton hint="Mute yourself when others speak — practice active listening like in a GD" onClick={toggleMic} disabled={isMicToggling}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer border ${isMicToggling ? 'opacity-60 cursor-wait' : ''} ${isMuted ? 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'}`}>
              {isMuted ? <MicOff className="w-4 h-4"/> : <Mic className="w-4 h-4"/>}
              {isMuted ? 'Unmute' : 'Mute'}
            </HintButton>
            <HintButton hint="Auto-captures spoken words — review your GD performance after the session" onClick={() => { setPanelTab('transcript'); setShowPanel(v => !v); }}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer border ${showPanel && panelTab !== 'chat' ? 'bg-brand-600 text-white border-brand-600' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}>
              <FileText className="w-4 h-4"/> Notes
            </HintButton>
            <HintButton hint="Share your screen — useful in mock presentations & interviews" onClick={toggleScreenShare}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer border ${isScreenSharing ? 'bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}>
              {isScreenSharing ? <ScreenShareOff className="w-4 h-4"/> : <ScreenShare className="w-4 h-4"/>}
              {isScreenSharing ? 'Stop Share' : 'Share Screen'}
            </HintButton>
            <HintButton hint="Exit the voice room" onClick={() => setShowLeaveConfirm(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold bg-red-500 hover:bg-red-600 text-white transition-colors cursor-pointer">
              <LogOut className="w-4 h-4"/> Leave
            </HintButton>
          </div>

          {/* Right — admin controls */}
          <div className="flex items-center justify-end gap-2">
            {isAdmin && (
              <HintButton hint="Manage participants — mute, remove" onClick={() => setShowAdmin(v => !v)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer border ${showAdmin ? 'bg-brand-600 text-white border-brand-600' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}>
                <Settings className="w-4 h-4"/> Controls
              </HintButton>
            )}
            {isAdmin && (
              <HintButton hint="Session done? Delete the room so others can create new ones" onClick={endRoomForAll}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold bg-red-600 hover:bg-red-700 text-white transition-colors cursor-pointer">
                <Trash2 className="w-4 h-4"/> End & Delete Room
              </HintButton>
            )}
          </div>

        </div>
      </div>

      {showTimer && (
        <GDTimer
          onClose={() => setShowTimer(false)}
          isAdmin={isAdmin}
          onBroadcast={publish}
          syncEvent={timerSyncEvent}
        />
      )}

      <ConfirmDialog open={showLeaveConfirm} title="Leave the room?"
        message="Are you sure you want to leave? You can rejoin using the same room code."
        confirmLabel="Leave" onConfirm={onLeave} onCancel={() => setShowLeaveConfirm(false)}/>
    </>
  );
}

// ── Root ─────────────────────────────────────────────────────────────────────
export default function RoomView() {
  const { code } = useParams();
  const navigate  = useNavigate();
  const { user }  = useAuth();

  const [room,          setRoom]          = useState(null);
  const [token,         setToken]         = useState('');
  const [livekitUrl,    setLivekitUrl]    = useState('');
  const [fetchStatus,   setFetchStatus]   = useState('loading');
  const [error,         setError]         = useState('');
  const [showTimer,     setShowTimer]     = useState(false);
  const [showPanel,     setShowPanel]     = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);

  const isAdmin = room && user && room.created_by === user.id;

  // Show transcription status in browser tab title when minimized
  useEffect(() => {
    document.title = isTranscribing ? '● Transcribing | SSBCircle' : 'SSBCircle';
    return () => { document.title = 'SSBCircle'; };
  }, [isTranscribing]);

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

      {/* Header */}
      <header className="flex items-center justify-between px-5 py-3 bg-white border-b border-gray-200 shrink-0 z-10 shadow-sm">
        <div className="flex items-center gap-3 min-w-0">
          <Logo/>
          {isAdmin && (
            <span className="shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-brand-50 text-brand-600 border border-brand-100">
              HOST
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Live transcription indicator */}
          {isTranscribing && (
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-red-50 border border-red-100">
              <div className="flex items-end gap-[2px]">
                {[3, 6, 10, 6, 3].map((h, i) => (
                  <div key={i} className="w-[2px] bg-red-500 rounded-full animate-bounce"
                    style={{ height: h + 'px', animationDelay: `${i * 0.1}s`, animationDuration: '0.7s' }} />
                ))}
              </div>
              <span className="text-[10px] font-bold text-red-600 tracking-widest uppercase hidden xs:inline">Live</span>
            </div>
          )}

          {isAdmin && (
            <button onClick={() => setShowTimer(v => !v)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer border ${
                showTimer
                  ? 'bg-brand-600 text-white border-brand-600'
                  : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50 hover:text-gray-700'
              }`}>
              <Timer className="w-3.5 h-3.5"/>
              <span className="hidden sm:inline">Timer</span>
            </button>
          )}

          {room && (
            <span className="hidden sm:inline-flex items-center gap-1.5 text-gray-400 text-[11px] px-2.5 py-1.5 rounded-lg font-mono border border-gray-200 bg-gray-50">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"/>
              {room.room_code}
            </span>
          )}
        </div>
      </header>

      {/* Topic banner — always visible, keeps participants focused */}
      {room && (
        <div className="shrink-0 bg-brand-600 px-4 sm:px-6 py-2.5 flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <h2 className="text-sm sm:text-base font-bold text-white leading-snug truncate">
              {room.topic}
            </h2>
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              {room.admin_display_name && (
                <span className="text-[11px] text-white/60">
                  Hosted by <span className="text-white/90 font-semibold">{room.admin_display_name}</span>
                </span>
              )}
              {room.description && (
                <span className="text-[11px] text-white/50 hidden sm:inline truncate max-w-xs">· {room.description}</span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {room.category && (
              <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-white/15 text-white border border-white/20">
                {room.category}{room.subcategory ? ` · ${room.subcategory}` : ''}
              </span>
            )}
            <span className="hidden sm:inline text-[10px] font-mono text-white/50 px-2 py-1 border border-white/20 rounded-lg">
              {room.room_code}
            </span>
          </div>
        </div>
      )}

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
            setIsTranscribing={setIsTranscribing}
          />
        </LiveKitRoom>
      )}
    </div>
  );
}
