import { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, FileText, CheckSquare, Download, Trash2, X, Plus, MessageSquare, Send } from 'lucide-react';

// ─── Transcript ───────────────────────────────────────────────────────────────
function TranscriptTab({ onStateChange }) {
  const [supported] = useState(() => !!(window.SpeechRecognition || window.webkitSpeechRecognition));
  const [listening, setListening] = useState(false);
  const [paused,    setPaused]    = useState(false);
  const [entries,   setEntries]   = useState([]);
  const [interim,   setInterim]   = useState('');
  const [error,     setError]     = useState('');
  const recognitionRef = useRef(null);
  const listeningRef   = useRef(false);
  const bottomRef      = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [entries, interim]);

  useEffect(() => () => {
    listeningRef.current = false;
    recognitionRef.current?.stop();
    recognitionRef.current = null;
  }, []);

  // Auto-restart when tab becomes visible again (browser kills speech rec in background)
  useEffect(() => {
    function handleVisibility() {
      if (document.visibilityState === 'visible' && listeningRef.current) {
        setPaused(false);
        // Force restart — Chrome may have killed it while hidden
        try { recognitionRef.current?.stop(); } catch {}
        // onend will fire and restart automatically
      }
      if (document.visibilityState === 'hidden' && listeningRef.current) {
        setPaused(true);
      }
    }
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, []);

  function buildRec() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const rec = new SR();
    rec.continuous = true; rec.interimResults = true; rec.lang = 'en-IN';
    rec.onresult = (e) => {
      let interimText = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) {
          const ts = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
          setEntries(prev => [...prev, { ts, text: t.trim() }]);
          setInterim('');
        } else interimText += t;
      }
      setInterim(interimText);
    };
    rec.onerror = (e) => {
      const name = e.error || 'speech recognition error';
      if (name !== 'no-speech' && name !== 'aborted') {
        listeningRef.current = false;
        setListening(false);
        setError(`Transcript error: ${name}`);
        onStateChange?.(false);
      }
    };
    rec.onend = () => {
      if (listeningRef.current) {
        // Rebuild instance on each restart (some browsers require it)
        const next = buildRec();
        recognitionRef.current = next;
        try { next.start(); } catch {}
      }
    };
    return rec;
  }

  function startListening() {
    setError('');
    const rec = buildRec();
    recognitionRef.current = rec;
    listeningRef.current = true;
    rec.start();
    setListening(true);
    setPaused(false);
    onStateChange?.(true);
  }

  function stopListening() {
    listeningRef.current = false;
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    setListening(false);
    setPaused(false);
    setInterim('');
    onStateChange?.(false);
  }

  function download() {
    if (!entries.length) return;
    const text = entries.map(e => `[${e.ts}] ${e.text}`).join('\n');
    const blob = new Blob([`SSBCircle – GD Transcript\n${'─'.repeat(40)}\n\n${text}`], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    Object.assign(document.createElement('a'), { href: url, download: `GD_Transcript_${new Date().toISOString().slice(0,10)}.txt` }).click();
    URL.revokeObjectURL(url);
  }

  if (!supported) return (
    <div className="flex flex-col items-center justify-center h-full text-center px-6">
      <MicOff className="w-8 h-8 text-gray-300 mb-3"/>
      <p className="text-sm text-gray-600 font-medium">Transcript unavailable</p>
      <p className="text-xs text-gray-400 mt-1">Use Chrome or Edge for live transcription.</p>
    </div>
  );

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100">
        <button onClick={listening ? stopListening : startListening}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer border ${
            listening
              ? paused ? 'bg-amber-50 text-amber-600 border-amber-200' : 'bg-red-50 text-red-600 border-red-200'
              : 'bg-brand-50 text-brand-600 border-brand-100 hover:bg-brand-100'
          }`}>
          {listening
            ? paused
              ? <><span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"/> Paused (tab hidden)</>
              : <><span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"/> Recording</>
            : <><Mic className="w-3.5 h-3.5"/> Start</>}
        </button>
        <div className="flex-1"/>
        <button onClick={() => { setEntries([]); setInterim(''); }} disabled={!entries.length}
          className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed">
          <Trash2 className="w-3.5 h-3.5"/>
        </button>
        <button onClick={download} disabled={!entries.length}
          className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed">
          <Download className="w-3.5 h-3.5"/>
        </button>
      </div>
      <p className="text-[10px] text-gray-400 px-4 pt-2.5 pb-1">Captures <span className="font-medium text-gray-600">your mic</span> · en-IN</p>
      {error && (
        <div className="px-4 pb-2 text-sm text-red-600 bg-red-50 rounded-xl mx-4 mb-2">
          {error}
        </div>
      )}
      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-3">
        {!entries.length && !interim && (
          <div className="flex flex-col items-center justify-center h-32 text-center">
            {listening
              ? <><div className="flex gap-0.5 mb-3">{[1,2,3,4,5].map(i => (
                  <div key={i} className="w-0.5 bg-brand-600 rounded-full animate-bounce"
                    style={{ height: `${8+i*4}px`, animationDelay: `${i*0.1}s` }}/>
                ))}</div><p className="text-xs text-gray-500">Listening…</p></>
              : <p className="text-xs text-gray-400">Press Start to begin</p>}
          </div>
        )}
        {entries.map((entry, i) => (
          <div key={i}>
            <span className="text-[10px] text-gray-400 font-mono">{entry.ts}</span>
            <p className="text-sm text-gray-800 leading-relaxed mt-0.5">{entry.text}</p>
          </div>
        ))}
        {interim && <p className="text-sm text-gray-400 italic">{interim}<span className="animate-pulse">_</span></p>}
        <div ref={bottomRef}/>
      </div>
    </div>
  );
}

// ─── Notes ────────────────────────────────────────────────────────────────────
const NOTE_PROMPTS = ['Key points raised:', 'My contributions:', 'What I missed:', 'Improvement areas:'];

function NotesTab() {
  const [notes, setNotes] = useState('');

  function download() {
    if (!notes.trim()) return;
    const blob = new Blob([`SSBCircle – GD Notes\n${'─'.repeat(40)}\n\n${notes}`], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    Object.assign(document.createElement('a'), { href: url, download: `GD_Notes_${new Date().toISOString().slice(0,10)}.txt` }).click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100">
        <span className="text-xs text-gray-500 flex-1 font-medium">Quick notes</span>
        <button onClick={() => setNotes('')} disabled={!notes}
          className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed">
          <Trash2 className="w-3.5 h-3.5"/>
        </button>
        <button onClick={download} disabled={!notes.trim()}
          className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed">
          <Download className="w-3.5 h-3.5"/>
        </button>
      </div>
      <div className="flex flex-wrap gap-1.5 px-4 py-2.5 border-b border-gray-100">
        {NOTE_PROMPTS.map(p => (
          <button key={p}
            onClick={() => setNotes(n => n + (n && !n.endsWith('\n') ? '\n\n' : '') + p + '\n')}
            className="flex items-center gap-1 text-[10px] text-gray-500 hover:text-brand-600 bg-gray-50 hover:bg-brand-50 px-2 py-1 rounded-md transition-colors cursor-pointer border border-gray-200 hover:border-brand-200">
            <Plus className="w-2.5 h-2.5"/> {p}
          </button>
        ))}
      </div>
      <textarea
        className="flex-1 bg-transparent text-sm text-gray-800 px-4 py-3 resize-none outline-none placeholder-gray-300 leading-relaxed font-sans"
        placeholder="Jot down key points, arguments, counter-arguments…"
        value={notes}
        onChange={e => setNotes(e.target.value)}
        spellCheck={false}
      />
      <div className="px-4 py-2 border-t border-gray-100 flex justify-end">
        <span className="text-[10px] text-gray-300">{notes.length} chars</span>
      </div>
    </div>
  );
}

// ─── Checklist ────────────────────────────────────────────────────────────────
const CHECKLIST = [
  { id: 'initiate',  label: 'Initiated or entered early' },
  { id: 'listen',    label: 'Listened actively' },
  { id: 'build',     label: "Built on others' points" },
  { id: 'factual',   label: 'Used facts or examples' },
  { id: 'clear',     label: 'Was clear and concise' },
  { id: 'interrupt', label: 'Avoided interrupting' },
  { id: 'summarize', label: 'Summarized or concluded' },
  { id: 'calm',      label: 'Stayed calm and composed' },
];

function ChecklistTab() {
  const [checked, setChecked] = useState({});
  const toggle = id => setChecked(c => ({ ...c, [id]: !c[id] }));
  const score = Object.values(checked).filter(Boolean).length;
  const pct   = Math.round((score / CHECKLIST.length) * 100);
  const scoreColor = pct >= 75 ? 'text-emerald-600' : pct >= 50 ? 'text-amber-600' : 'text-red-500';
  const barColor   = pct >= 75 ? 'bg-emerald-500'   : pct >= 50 ? 'bg-amber-400'   : 'bg-red-400';

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-gray-100">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-gray-500 font-medium">Self-evaluation</span>
          <span className={`text-2xl font-bold tabular-nums ${scoreColor}`}>{pct}<span className="text-sm font-medium">%</span></span>
        </div>
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div className={`h-full rounded-full transition-all duration-500 ${barColor}`} style={{ width: `${pct}%` }}/>
        </div>
        <p className="text-[10px] text-gray-400 mt-1.5">{score} of {CHECKLIST.length} criteria met</p>
      </div>
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
        {CHECKLIST.map(({ id, label }) => (
          <button key={id} onClick={() => toggle(id)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all cursor-pointer ${
              checked[id] ? 'bg-brand-50' : 'hover:bg-gray-50'
            }`}>
            <div className={`flex items-center justify-center shrink-0 rounded-md border-2 transition-all ${
              checked[id] ? 'bg-brand-600 border-brand-600' : 'border-gray-300'
            }`} style={{ width: 18, height: 18 }}>
              {checked[id] && (
                <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7"/>
                </svg>
              )}
            </div>
            <span className={`text-sm transition-colors ${checked[id] ? 'text-gray-400 line-through' : 'text-gray-700'}`}>
              {label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Chat ─────────────────────────────────────────────────────────────────────
function ChatTab({ messages, onSend }) {
  const [text, setText] = useState('');
  const bottomRef = useRef(null);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  function handleSend(e) {
    e.preventDefault();
    const t = text.trim(); if (!t) return;
    onSend(t); setText('');
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-32 text-center">
            <MessageSquare className="w-7 h-7 text-gray-200 mb-2"/>
            <p className="text-xs text-gray-400">No messages yet</p>
            <p className="text-[11px] text-gray-300 mt-0.5">Start the conversation</p>
          </div>
        )}
        {messages.map(msg => (
          <div key={msg.id} className={`flex flex-col ${msg.isMe ? 'items-end' : 'items-start'}`}>
            {!msg.isMe && <span className="text-[10px] text-gray-400 font-medium mb-0.5 px-1">{msg.sender}</span>}
            <div className={`max-w-[85%] px-3 py-2 rounded-xl text-sm leading-snug ${
              msg.isMe
                ? 'bg-brand-600 text-white rounded-br-sm'
                : 'bg-gray-100 text-gray-800 rounded-bl-sm'
            }`}>
              {msg.text}
            </div>
            <span className="text-[10px] text-gray-300 mt-0.5 px-1">{msg.ts}</span>
          </div>
        ))}
        <div ref={bottomRef}/>
      </div>
      <form onSubmit={handleSend} className="flex items-center gap-2 px-3 py-3 border-t border-gray-100">
        <input
          type="text" value={text} onChange={e => setText(e.target.value)}
          placeholder="Type a message…"
          className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 placeholder-gray-400 outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-100 transition-colors"
        />
        <button type="submit" disabled={!text.trim()}
          className="p-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-white transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed">
          <Send className="w-4 h-4"/>
        </button>
      </form>
    </div>
  );
}

// ─── Panel ────────────────────────────────────────────────────────────────────
const TABS = [
  { id: 'chat',       label: 'Chat',       Icon: MessageSquare },
  { id: 'transcript', label: 'Transcript', Icon: Mic },
  { id: 'notes',      label: 'Notes',      Icon: FileText },
  { id: 'checklist',  label: 'Checklist',  Icon: CheckSquare },
];

export default function GDPanel({ show, onClose, chatMessages = [], onSendMessage, activeTab, onTabChange, onTranscriptStateChange }) {
  const [active, setActive] = useState(activeTab ?? 'chat');

  useEffect(() => { if (activeTab) setActive(activeTab); }, [activeTab]);

  function handleTab(id) { setActive(id); onTabChange?.(id); }

  return (
    <div className={`${show ? '' : 'hidden'} fixed inset-0 z-50 bg-white flex flex-col sm:relative sm:inset-auto sm:z-20 sm:w-80 sm:shrink-0 sm:border-l sm:border-gray-200 sm:shadow-none shadow-2xl`}>
      {/* Tab bar */}
      <div className="flex items-center border-b border-gray-200 shrink-0">
        {TABS.map(({ id, label, Icon }) => (
          <button key={id} onClick={() => handleTab(id)}
            className={`flex-1 flex flex-col items-center gap-0.5 py-2.5 text-[10px] font-semibold tracking-wide uppercase transition-all cursor-pointer border-b-2 ${
              active === id
                ? 'text-brand-600 border-brand-600'
                : 'text-gray-400 border-transparent hover:text-gray-600'
            }`}>
            <Icon className="w-3.5 h-3.5"/>
            {label}
          </button>
        ))}
        {/* X only on desktop — mobile has Done button at bottom */}
        <button onClick={onClose}
          className="hidden sm:block px-2.5 py-2.5 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer border-b-2 border-transparent shrink-0">
          <X className="w-4 h-4"/>
        </button>
      </div>

      {/* All tabs mounted — CSS controls visibility so state is never lost */}
      <div className="flex-1 overflow-hidden relative">
        <div className={`absolute inset-0 flex flex-col ${active === 'chat'       ? '' : 'hidden'}`}><ChatTab messages={chatMessages} onSend={onSendMessage}/></div>
        <div className={`absolute inset-0 flex flex-col ${active === 'transcript' ? '' : 'hidden'}`}><TranscriptTab onStateChange={onTranscriptStateChange}/></div>
        <div className={`absolute inset-0 flex flex-col ${active === 'notes'      ? '' : 'hidden'}`}><NotesTab/></div>
        <div className={`absolute inset-0 flex flex-col ${active === 'checklist'  ? '' : 'hidden'}`}><ChecklistTab/></div>
      </div>

      {/* Mobile-only close button at the bottom — easy thumb reach */}
      <div className="sm:hidden shrink-0 px-4 py-3 border-t border-gray-200">
        <button onClick={onClose}
          className="w-full py-2.5 text-sm font-semibold text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-xl border border-gray-200 transition-colors cursor-pointer">
          Close
        </button>
      </div>
    </div>
  );
}
