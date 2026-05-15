import { useState, useEffect, useRef } from 'react';

// ─── Transcript Tab ───────────────────────────────────────────────────────────

function TranscriptTab() {
  const [supported] = useState(
    () => !!(window.SpeechRecognition || window.webkitSpeechRecognition)
  );
  const [listening, setListening] = useState(false);
  const [entries, setEntries] = useState([]);
  const [interim, setInterim] = useState('');
  const recognitionRef = useRef(null);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [entries, interim]);

  useEffect(() => {
    return () => recognitionRef.current?.stop();
  }, []);

  function startListening() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const rec = new SR();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = 'en-IN';

    rec.onresult = (e) => {
      let interimText = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const transcript = e.results[i][0].transcript;
        if (e.results[i].isFinal) {
          const timestamp = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
          setEntries((prev) => [...prev, { timestamp, text: transcript.trim() }]);
          setInterim('');
        } else {
          interimText += transcript;
        }
      }
      setInterim(interimText);
    };

    rec.onerror = (e) => {
      if (e.error !== 'no-speech') {
        setListening(false);
      }
    };

    rec.onend = () => {
      // Auto-restart if still listening (handles Chrome's 60s limit)
      if (recognitionRef.current && listening) {
        try { recognitionRef.current.start(); } catch {}
      }
    };

    recognitionRef.current = rec;
    rec.start();
    setListening(true);
  }

  function stopListening() {
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    setListening(false);
    setInterim('');
  }

  function downloadTranscript() {
    if (entries.length === 0) return;
    const text = entries.map((e) => `[${e.timestamp}] ${e.text}`).join('\n');
    const blob = new Blob([`SSBCircle – GD Transcript\n${'─'.repeat(40)}\n\n${text}`], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `GD_Transcript_${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function clearTranscript() {
    setEntries([]);
    setInterim('');
  }

  if (!supported) {
    return (
      <div className="flex flex-col items-center justify-center h-full px-4 text-center">
        <svg className="w-10 h-10 text-slate-600 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="text-slate-400 text-sm">Transcript requires Chrome or Edge browser.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Controls */}
      <div className="flex items-center gap-2 p-3 border-b border-slate-700">
        <button
          onClick={listening ? stopListening : startListening}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
            listening
              ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
              : 'bg-primary-600 text-white hover:bg-primary-700'
          }`}
        >
          <span className={`w-2 h-2 rounded-full ${listening ? 'bg-red-400 animate-pulse' : 'bg-white'}`} />
          {listening ? 'Stop' : 'Start'}
        </button>
        <button
          onClick={downloadTranscript}
          disabled={entries.length === 0}
          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-700 text-slate-300 hover:bg-slate-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Download
        </button>
        <button
          onClick={clearTranscript}
          disabled={entries.length === 0}
          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-700 text-slate-400 hover:bg-slate-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors ml-auto"
        >
          Clear
        </button>
      </div>

      <p className="text-[10px] text-slate-500 px-3 pt-2 pb-1">
        Captures <span className="text-slate-400 font-medium">your speech</span> only · en-IN
      </p>

      {/* Transcript area */}
      <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-2">
        {entries.length === 0 && !interim && (
          <p className="text-slate-600 text-xs text-center mt-8">
            {listening ? 'Listening… start speaking.' : 'Press Start to begin transcription.'}
          </p>
        )}
        {entries.map((entry, i) => (
          <div key={i} className="text-sm">
            <span className="text-[10px] text-slate-500 font-mono">{entry.timestamp}</span>
            <p className="text-slate-200 leading-snug mt-0.5">{entry.text}</p>
          </div>
        ))}
        {interim && (
          <p className="text-slate-500 text-sm italic">{interim}</p>
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}

// ─── Notes Tab ────────────────────────────────────────────────────────────────

function NotesTab() {
  const [notes, setNotes] = useState('');

  function downloadNotes() {
    if (!notes.trim()) return;
    const blob = new Blob([`SSBCircle – GD Notes\n${'─'.repeat(40)}\n\n${notes}`], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `GD_Notes_${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const PROMPTS = [
    'Key points raised:',
    'My contributions:',
    'What I missed:',
    'Improvement areas:',
  ];

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 p-3 border-b border-slate-700">
        <span className="text-xs text-slate-400 flex-1">Quick notes during GD</span>
        <button
          onClick={downloadNotes}
          disabled={!notes.trim()}
          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-700 text-slate-300 hover:bg-slate-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Download
        </button>
      </div>

      {/* Prompt chips */}
      <div className="flex flex-wrap gap-1.5 p-3 border-b border-slate-700/50">
        {PROMPTS.map((p) => (
          <button
            key={p}
            onClick={() => setNotes((n) => n + (n ? '\n\n' : '') + p + '\n')}
            className="text-[10px] bg-slate-700 text-slate-400 hover:bg-slate-600 hover:text-slate-200 px-2 py-1 rounded-md transition-colors"
          >
            + {p}
          </button>
        ))}
      </div>

      <textarea
        className="flex-1 bg-transparent text-slate-200 text-sm p-3 resize-none outline-none placeholder-slate-600 leading-relaxed"
        placeholder="Jot down key points, your arguments, and observations here…"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        spellCheck={false}
      />
      <div className="px-3 pb-2 text-right">
        <span className="text-[10px] text-slate-600">{notes.length} chars</span>
      </div>
    </div>
  );
}

// ─── Checklist Tab ────────────────────────────────────────────────────────────

const CHECKLIST_ITEMS = [
  { id: 'initiate', label: 'Initiated / entered early' },
  { id: 'listen', label: 'Listened actively' },
  { id: 'build', label: 'Built on others\' points' },
  { id: 'factual', label: 'Used facts/examples' },
  { id: 'clear', label: 'Was clear & concise' },
  { id: 'interrupt', label: 'Avoided interrupting' },
  { id: 'summarize', label: 'Summarized / concluded' },
  { id: 'calm', label: 'Stayed calm & composed' },
];

function ChecklistTab() {
  const [checked, setChecked] = useState({});

  function toggle(id) {
    setChecked((c) => ({ ...c, [id]: !c[id] }));
  }

  const score = Object.values(checked).filter(Boolean).length;

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-3 border-b border-slate-700">
        <span className="text-xs text-slate-400">Self-evaluation checklist</span>
        <span className="text-xs font-bold text-primary-400">{score}/{CHECKLIST_ITEMS.length}</span>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {CHECKLIST_ITEMS.map(({ id, label }) => (
          <label key={id} className="flex items-center gap-3 cursor-pointer group">
            <div
              onClick={() => toggle(id)}
              className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors ${
                checked[id]
                  ? 'bg-primary-600 border-primary-600'
                  : 'border-slate-600 group-hover:border-slate-500'
              }`}
            >
              {checked[id] && (
                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
            <span
              onClick={() => toggle(id)}
              className={`text-sm transition-colors ${checked[id] ? 'text-slate-400 line-through' : 'text-slate-200'}`}
            >
              {label}
            </span>
          </label>
        ))}
      </div>
      {/* Score bar */}
      <div className="p-3 border-t border-slate-700">
        <div className="flex justify-between text-xs text-slate-500 mb-1">
          <span>Performance</span>
          <span>{Math.round((score / CHECKLIST_ITEMS.length) * 100)}%</span>
        </div>
        <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-primary-500 rounded-full transition-all duration-300"
            style={{ width: `${(score / CHECKLIST_ITEMS.length) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}

// ─── Panel wrapper ────────────────────────────────────────────────────────────

const TABS = [
  { id: 'transcript', label: 'Transcript' },
  { id: 'notes', label: 'Notes' },
  { id: 'checklist', label: 'Checklist' },
];

export default function GDPanel({ onClose }) {
  const [activeTab, setActiveTab] = useState('transcript');

  return (
    <div className="absolute top-12 right-0 bottom-0 z-20 w-72 bg-slate-800 border-l border-slate-700 flex flex-col shadow-2xl">
      {/* Panel header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-slate-700 shrink-0">
        <div className="flex gap-1">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                activeTab === tab.id
                  ? 'bg-primary-600 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <button onClick={onClose} className="text-slate-500 hover:text-slate-300 transition-colors ml-1">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'transcript' && <TranscriptTab />}
        {activeTab === 'notes' && <NotesTab />}
        {activeTab === 'checklist' && <ChecklistTab />}
      </div>
    </div>
  );
}
