import { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, X, GripHorizontal } from 'lucide-react';

const PRESETS = [
  { label: '15m', value: 15 * 60 },
  { label: '20m', value: 20 * 60 },
  { label: '25m', value: 25 * 60 },
  { label: '30m', value: 30 * 60 },
];

function pad(n) { return String(n).padStart(2, '0'); }

export default function GDTimer({ onClose, isAdmin, onBroadcast, syncEvent }) {
  const [total,     setTotal]     = useState(20 * 60);
  const [remaining, setRemaining] = useState(20 * 60);
  const [running,   setRunning]   = useState(false);
  const [started,   setStarted]   = useState(false);
  const [done,      setDone]      = useState(false);
  const intervalRef = useRef(null);

  // Drag state
  const [pos, setPos]   = useState(null);
  const dragging        = useRef(false);
  const dragOrigin      = useRef({ mx: 0, my: 0, px: 0, py: 0 });

  // ── Sync from host broadcasts ──────────────────────────────────────────────
  useEffect(() => {
    if (!syncEvent) return;
    const { type } = syncEvent;

    if (type === 'TIMER_START') {
      const elapsed = Math.floor((Date.now() - syncEvent.startedAt) / 1000);
      const rem = Math.max(0, syncEvent.total - elapsed);
      setTotal(syncEvent.total);
      setRemaining(rem);
      setRunning(true);
      setStarted(true);
      setDone(false);
    } else if (type === 'TIMER_PAUSE') {
      setRemaining(syncEvent.remaining);
      setRunning(false);
    } else if (type === 'TIMER_RESUME') {
      const elapsed = Math.floor((Date.now() - syncEvent.resumedAt) / 1000);
      setRemaining(Math.max(0, syncEvent.remaining - elapsed));
      setRunning(true);
    } else if (type === 'TIMER_RESET') {
      clearInterval(intervalRef.current);
      setTotal(syncEvent.total);
      setRemaining(syncEvent.total);
      setRunning(false);
      setStarted(false);
      setDone(false);
    }
  }, [syncEvent]);

  // ── Countdown tick ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setRemaining(r => {
          if (r <= 1) {
            clearInterval(intervalRef.current);
            setRunning(false);
            setDone(true);
            if (Notification.permission === 'granted')
              new Notification('SSBCircle', { body: 'GD time is up!' });
            return 0;
          }
          return r - 1;
        });
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [running]);

  // ── Admin controls ─────────────────────────────────────────────────────────
  function handlePreset(val) {
    if (!isAdmin) return;
    clearInterval(intervalRef.current);
    setTotal(val); setRemaining(val);
    setRunning(false); setStarted(false); setDone(false);
  }

  function handleStart() {
    if (!isAdmin) return;
    const startedAt = Date.now();
    setStarted(true); setDone(false); setRunning(true);
    onBroadcast?.({ type: 'TIMER_START', total, startedAt });
    if (Notification.permission !== 'granted') Notification.requestPermission();
  }

  function handlePause() {
    if (!isAdmin) return;
    setRunning(false);
    onBroadcast?.({ type: 'TIMER_PAUSE', remaining });
  }

  function handleResume() {
    if (!isAdmin) return;
    const resumedAt = Date.now();
    setRunning(true);
    onBroadcast?.({ type: 'TIMER_RESUME', remaining, resumedAt });
  }

  function handleReset() {
    if (!isAdmin) return;
    clearInterval(intervalRef.current);
    setRunning(false); setStarted(false); setDone(false); setRemaining(total);
    onBroadcast?.({ type: 'TIMER_RESET', total });
  }

  function handleClose() {
    if (isAdmin) onBroadcast?.({ type: 'TIMER_CLOSE' });
    onClose();
  }

  // ── Drag ──────────────────────────────────────────────────────────────────
  function onDragStart(e) {
    e.preventDefault();
    const touch = e.touches?.[0] ?? e;
    const current = pos ?? { x: window.innerWidth / 2, y: 80 };
    dragging.current = true;
    dragOrigin.current = { mx: touch.clientX, my: touch.clientY, px: current.x, py: current.y };
  }

  useEffect(() => {
    function onMove(e) {
      if (!dragging.current) return;
      const touch = e.touches?.[0] ?? e;
      const dx = touch.clientX - dragOrigin.current.mx;
      const dy = touch.clientY - dragOrigin.current.my;
      setPos({ x: dragOrigin.current.px + dx, y: dragOrigin.current.py + dy });
    }
    function onUp() { dragging.current = false; }
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    window.addEventListener('touchmove', onMove, { passive: false });
    window.addEventListener('touchend', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onUp);
    };
  }, []);

  // ── Derived ───────────────────────────────────────────────────────────────
  const minutes     = Math.floor(remaining / 60);
  const seconds     = remaining % 60;
  const progress    = total > 0 ? remaining / total : 1;
  const circumference = 2 * Math.PI * 16;
  const dashOffset  = circumference * (1 - progress);

  const isUrgent  = remaining <= 60 && !done;
  const isWarning = remaining <= 300 && remaining > 60;
  const ringColor = done || isUrgent ? '#f87171' : isWarning ? '#fbbf24' : '#3b82f6';
  const timeColor = done || isUrgent ? 'text-red-500' : isWarning ? 'text-amber-500' : 'text-gray-900';

  const posStyle = pos
    ? { position: 'fixed', left: pos.x, top: pos.y, transform: 'translate(-50%, -50%)', zIndex: 50 }
    : { position: 'absolute', top: 16, left: '50%', transform: 'translateX(-50%)', zIndex: 30 };

  return (
    <div style={posStyle} className="flex flex-col items-center gap-2 select-none">

      {/* Preset bar — admin only, before starting */}
      {isAdmin && !started && (
        <div className="flex items-center gap-1.5 bg-white border border-gray-200 rounded-full px-3 py-1.5 shadow-lg">
          <span className="text-[10px] text-gray-400 font-medium mr-1">Duration</span>
          {PRESETS.map(({ label, value }) => (
            <button key={value} onClick={() => handlePreset(value)}
              className={`px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all cursor-pointer ${
                total === value ? 'bg-brand-600 text-white' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100'
              }`}>
              {label}
            </button>
          ))}
        </div>
      )}

      {/* Main pill */}
      <div className={`flex items-center gap-3 bg-white border rounded-full pl-2 pr-4 py-2.5 shadow-lg transition-all ${
        done ? 'border-red-300' : isUrgent ? 'border-red-200' : 'border-gray-200'
      }`}>

        {/* Drag handle */}
        <div onMouseDown={onDragStart} onTouchStart={onDragStart}
          className="flex items-center px-1.5 cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-500 transition-colors">
          <GripHorizontal className="w-4 h-4"/>
        </div>

        {/* Mini ring */}
        <div className="relative w-9 h-9 flex items-center justify-center shrink-0">
          <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 40 40">
            <circle cx="20" cy="20" r="16" fill="none" stroke="#f3f4f6" strokeWidth="3"/>
            <circle cx="20" cy="20" r="16" fill="none" stroke={ringColor} strokeWidth="3"
              strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={dashOffset}
              style={{ transition: 'stroke-dashoffset 0.8s linear, stroke 0.4s' }}/>
          </svg>
          <span className="text-[10px] font-bold text-gray-500 tabular-nums">{pad(minutes)}</span>
        </div>

        {/* Time */}
        <span className={`text-xl font-bold font-mono tabular-nums tracking-tight ${timeColor}`}>
          {pad(minutes)}:{pad(seconds)}
        </span>

        {done && <span className="text-xs font-bold text-red-500 uppercase tracking-widest">Time's up</span>}

        {/* Controls — admin only */}
        {isAdmin ? (
          <div className="flex items-center gap-1">
            {!started ? (
              <button onClick={handleStart}
                className="flex items-center gap-1.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold px-3 py-1.5 rounded-full transition-colors cursor-pointer">
                <Play className="w-3 h-3"/> Start
              </button>
            ) : running ? (
              <button onClick={handlePause}
                className="p-1.5 rounded-full text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition-colors cursor-pointer">
                <Pause className="w-4 h-4"/>
              </button>
            ) : (
              <button onClick={handleResume}
                className="p-1.5 rounded-full text-brand-600 hover:bg-brand-50 transition-colors cursor-pointer">
                <Play className="w-4 h-4"/>
              </button>
            )}
            {started && (
              <button onClick={handleReset}
                className="p-1.5 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer">
                <RotateCcw className="w-3.5 h-3.5"/>
              </button>
            )}
            <button onClick={handleClose}
              className="p-1.5 rounded-full text-gray-300 hover:text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer">
              <X className="w-3.5 h-3.5"/>
            </button>
          </div>
        ) : (
          <span className="text-[10px] text-gray-400 font-medium pr-1">Host timer</span>
        )}
      </div>
    </div>
  );
}
