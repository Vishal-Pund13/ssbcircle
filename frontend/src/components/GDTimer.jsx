import { useState, useEffect, useRef } from 'react';

const PRESETS = [
  { label: '15m', value: 15 * 60 },
  { label: '20m', value: 20 * 60 },
  { label: '25m', value: 25 * 60 },
  { label: '30m', value: 30 * 60 },
];

function pad(n) {
  return String(n).padStart(2, '0');
}

export default function GDTimer({ onClose }) {
  const [total, setTotal] = useState(20 * 60);
  const [remaining, setRemaining] = useState(20 * 60);
  const [running, setRunning] = useState(false);
  const [started, setStarted] = useState(false);
  const [done, setDone] = useState(false);
  const intervalRef = useRef(null);
  const audioRef = useRef(null);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setRemaining((r) => {
          if (r <= 1) {
            clearInterval(intervalRef.current);
            setRunning(false);
            setDone(true);
            playAlert();
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

  function playAlert() {
    // Browser notification
    if (Notification.permission === 'granted') {
      new Notification('SSBCircle', { body: 'GD time is up!' });
    } else if (Notification.permission !== 'denied') {
      Notification.requestPermission();
    }
  }

  function handlePreset(val) {
    clearInterval(intervalRef.current);
    setTotal(val);
    setRemaining(val);
    setRunning(false);
    setStarted(false);
    setDone(false);
  }

  function handleStart() {
    setStarted(true);
    setDone(false);
    setRunning(true);
    if (Notification.permission !== 'granted') {
      Notification.requestPermission();
    }
  }

  function handlePause() { setRunning(false); }
  function handleReset() {
    clearInterval(intervalRef.current);
    setRunning(false);
    setStarted(false);
    setDone(false);
    setRemaining(total);
  }

  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;
  const progress = remaining / total;
  const circumference = 2 * Math.PI * 40;
  const dashOffset = circumference * (1 - progress);

  const timeColor = done
    ? 'text-red-400'
    : remaining <= 60
    ? 'text-red-400'
    : remaining <= 300
    ? 'text-yellow-400'
    : 'text-white';

  const ringColor = done
    ? '#f87171'
    : remaining <= 60
    ? '#f87171'
    : remaining <= 300
    ? '#facc15'
    : '#2563eb';

  return (
    <div className="absolute top-14 left-1/2 -translate-x-1/2 z-30 bg-slate-800/95 backdrop-blur-sm border border-slate-700 rounded-2xl shadow-2xl p-5 w-72">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-semibold text-slate-300">GD Timer</span>
        <button onClick={onClose} className="text-slate-500 hover:text-slate-300 transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Presets */}
      {!started && (
        <div className="flex gap-2 mb-4">
          {PRESETS.map(({ label, value }) => (
            <button
              key={value}
              onClick={() => handlePreset(value)}
              className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                total === value
                  ? 'bg-primary-600 text-white'
                  : 'bg-slate-700 text-slate-400 hover:bg-slate-600 hover:text-white'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {/* Circle countdown */}
      <div className="flex justify-center mb-4">
        <div className="relative w-24 h-24 flex items-center justify-center">
          <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="40" fill="none" stroke="#334155" strokeWidth="6" />
            <circle
              cx="50" cy="50" r="40"
              fill="none"
              stroke={ringColor}
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              style={{ transition: 'stroke-dashoffset 0.8s linear, stroke 0.5s' }}
            />
          </svg>
          <span className={`text-2xl font-bold font-mono tabular-nums ${timeColor}`}>
            {pad(minutes)}:{pad(seconds)}
          </span>
        </div>
      </div>

      {done && (
        <p className="text-center text-red-400 text-sm font-semibold mb-3 animate-pulse">
          Time&apos;s up!
        </p>
      )}

      {/* Controls */}
      <div className="flex gap-2">
        {!started ? (
          <button onClick={handleStart} className="flex-1 bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold py-2 rounded-xl transition-colors">
            Start
          </button>
        ) : running ? (
          <button onClick={handlePause} className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white text-sm font-semibold py-2 rounded-xl transition-colors">
            Pause
          </button>
        ) : (
          <button onClick={handleStart} className="flex-1 bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold py-2 rounded-xl transition-colors">
            Resume
          </button>
        )}
        {started && (
          <button onClick={handleReset} className="px-4 bg-slate-700 hover:bg-slate-600 text-slate-300 text-sm font-semibold py-2 rounded-xl transition-colors">
            Reset
          </button>
        )}
      </div>
    </div>
  );
}
