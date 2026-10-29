import { useState, useEffect, useRef } from 'react';
import { Mic, Square, RotateCcw, Sparkles, AlertCircle, Check, Keyboard } from 'lucide-react';
import { speakPrepTopic, transcribeAudio } from '../../services/api';
import { ANSWER, answerOf } from '../../data/prepSheet';

// Answer a topic's question out loud and get feedback on it.
//
// Two ways to turn speech into text, best first:
//
//  1. Sarvam (when the backend has a key). Trained on Indian speech, so it gets
//     Indian-accented English and place names like "Ahilyanagar" right where
//     the browser hears "Lawanda". Its API takes under 30 seconds per request,
//     so we record in pieces, cut at a natural pause between 20 and 27
//     seconds, and send each piece while the aspirant keeps talking. Audio is
//     used only for transcription and is not stored.
//  2. The browser's own recognition (Chrome, Edge). Live, free, weaker on
//     Indian accents.
//
// Where neither works the aspirant types their answer.
//
// How long to speak depends on the question (ANSWER in prepSheet.js): a fact
// needs a word, a personal answer about a minute, an opinion about two.
//
// The speech-to-text provider is never named to users; they are told only
// that it is tuned for Indian English.

const SR = typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition);
const CAN_RECORD = typeof window !== 'undefined' && !!window.MediaRecorder && !!navigator.mediaDevices?.getUserMedia;

// Piece boundaries for Sarvam. Cut at the first pause after SOFT_CUT; force a
// cut at HARD_CUT so a piece never reaches the API's 30-second limit.
const SOFT_CUT = 20000, HARD_CUT = 27000, PAUSE_MS = 350, SILENCE = 0.012;

function pickMime() {
  for (const m of ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg;codecs=opus']) {
    if (window.MediaRecorder.isTypeSupported?.(m)) return m;
  }
  return '';
}

// Proper names in the topic that the recogniser should expect — "Galwan",
// "Agnipath", "Operation Sindoor". The first word of each sentence is skipped
// so ordinary capitalised words do not crowd the list.
function topicTerms(topic) {
  const terms = new Set();
  for (const sentence of [topic.title, topic.ask, ...topic.points].join('. ').split(/[.?!:;]\s+/)) {
    const rest = sentence.trim().split(/\s+/).slice(1).join(' ');
    for (const m of rest.matchAll(/\b[A-Z][A-Za-z0-9-]+(?:\s+[A-Z][A-Za-z0-9-]+)*/g)) {
      if (m[0].length >= 3 && m[0].length <= 64) terms.add(m[0]);
    }
  }
  return [...terms].slice(0, 30);
}

const VERDICT = {
  ready:   { label: 'Ready for SSB', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  almost:  { label: 'Almost there',  className: 'bg-amber-50 text-amber-700 border-amber-200' },
  not_yet: { label: 'Not yet',       className: 'bg-red-50 text-red-700 border-red-200' },
};

function CostNote() {
  return (
    <p className="mt-3 text-sm text-amber-800 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 leading-relaxed">
      Every check costs us real money to run. It is free for you, so please use it when your answer is ready, not just to test.
    </p>
  );
}

const clock = s => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
const wordCount = t => t.trim().split(/\s+/).filter(Boolean).length;

export function Feedback({ feedback, seconds, words }) {
  const v = VERDICT[feedback.verdict] || VERDICT.almost;
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className={`text-xs font-bold px-2.5 py-1 rounded-lg border ${v.className}`}>{v.label}</span>
        <span className="text-xs font-bold text-gray-700 tabular-nums">{feedback.score}/10</span>
        {seconds != null && <span className="text-[12px] text-gray-400">{clock(seconds)} · {words} words</span>}
      </div>
      <p className="text-sm text-gray-700">{feedback.summary}</p>

      {feedback.did_well?.length > 0 && (
        <div>
          <p className="text-[12px] font-bold text-emerald-700 uppercase tracking-wide mb-1.5">What you did well</p>
          <ul className="space-y-1">
            {feedback.did_well.map((x, i) => (
              <li key={i} className="text-sm text-gray-700 flex gap-2"><Check className="w-3.5 h-3.5 text-emerald-500 mt-0.5 shrink-0" />{x}</li>
            ))}
          </ul>
        </div>
      )}

      {feedback.improve?.length > 0 && (
        <div>
          <p className="text-[12px] font-bold text-amber-700 uppercase tracking-wide mb-1.5">What to improve</p>
          <ul className="space-y-2">
            {feedback.improve.map((x, i) => (
              <li key={i} className="text-sm">
                <span className="font-semibold text-gray-800">{x.point}</span>
                <span className="block text-gray-600">{x.how}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {feedback.missed?.length > 0 && (
        <div>
          <p className="text-[12px] font-bold text-gray-500 uppercase tracking-wide mb-1.5">Points you missed</p>
          <ul className="list-disc pl-5 space-y-0.5">
            {feedback.missed.map((x, i) => <li key={i} className="text-sm text-gray-700">{x}</li>)}
          </ul>
        </div>
      )}

      {feedback.better_opening && (
        <div className="bg-brand-50/60 border border-brand-100 rounded-xl p-3">
          <p className="text-[12px] font-bold text-brand-600 uppercase tracking-wide mb-1">Try opening like this</p>
          <p className="text-sm text-gray-800">"{feedback.better_opening}"</p>
        </div>
      )}

      {feedback.language?.length > 0 && (
        <div>
          <p className="text-[12px] font-bold text-gray-500 uppercase tracking-wide mb-1.5">How you spoke</p>
          <ul className="list-disc pl-5 space-y-0.5">
            {feedback.language.map((x, i) => <li key={i} className="text-sm text-gray-700">{x}</li>)}
          </ul>
        </div>
      )}
    </div>
  );
}

// onSaved(progressRow) is called with the server's row after feedback, which
// may already be marked "can speak". onMarkAnyway lets the aspirant override.
export default function SpeakPanel({ topic, status, serverStt, onSaved, onMarkAnyway, onClose }) {
  const engine = serverStt && CAN_RECORD ? 'sarvam' : SR ? 'browser' : null;
  const length = answerOf(topic);
  const { target: TARGET, max: MAX, minWords: MIN_WORDS, hint } = ANSWER[length];
  const short = length === 'short';
  const [phase, setPhase]   = useState('idle');   // idle | recording | transcribing | review | sending | done
  const [typing, setTyping] = useState(!engine);
  const [level, setLevel]   = useState(0);       // mic volume, so people can see it is hearing them
  const [pending, setPending] = useState(0);     // Sarvam pieces still recording or being transcribed
  const [text, setText]     = useState('');
  const [interim, setInterim] = useState('');
  const [seconds, setSeconds] = useState(0);
  const [error, setError]   = useState('');
  const [result, setResult] = useState(null);
  const recRef = useRef(null);
  const wantRef = useRef(false);     // still recording? onend restarts while true
  const finalRef = useRef('');
  // Sarvam recording
  const streamRef = useRef(null), ctxRef = useRef(null), tickRef = useRef(null);
  const partsRef = useRef([]);           // [{ status: recording|sending|done|failed, text }]
  const segStartRef = useRef(0), quietSinceRef = useRef(null), mimeRef = useRef('');
  const termsRef = useRef(topicTerms(topic));

  function releaseMic() {
    clearInterval(tickRef.current);
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    ctxRef.current?.close().catch(() => {});
    ctxRef.current = null;
  }

  useEffect(() => () => {
    wantRef.current = false;
    if (recRef.current?.abort) recRef.current.abort();
    else if (recRef.current?.state === 'recording') recRef.current.stop();
    releaseMic();
  }, []);

  // Once stopped, wait for the last pieces to come back before showing the text.
  useEffect(() => {
    if (phase === 'transcribing' && pending === 0) setPhase('review');
  }, [phase, pending]);

  useEffect(() => {
    if (phase !== 'recording') return;
    const t = setInterval(() => setSeconds(s => s + 1), 1000);
    return () => clearInterval(t);
  }, [phase]);

  useEffect(() => {
    if (phase === 'recording' && seconds >= MAX) stop();
  }, [phase, seconds]); // eslint-disable-line react-hooks/exhaustive-deps

  function listen() {
    const rec = new SR();
    rec.lang = 'en-IN';
    rec.continuous = true;
    rec.interimResults = true;
    rec.onresult = e => {
      let live = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) finalRef.current += r[0].transcript.trim() + ' ';
        else live += r[0].transcript;
      }
      setText(finalRef.current);
      setInterim(live);
    };
    rec.onerror = e => {
      if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
        wantRef.current = false;
        setError('Microphone access was blocked. Allow the mic for this site in your browser settings, or type your answer.');
        setPhase(finalRef.current.trim() ? 'review' : 'idle');
      } else if (e.error === 'audio-capture') {
        wantRef.current = false;
        setError('No microphone found. Plug one in, or type your answer.');
        setPhase('idle');
      }
      // 'no-speech' and 'network' blips: onend restarts listening.
    };
    // Browsers end recognition after a pause. Pick up again until Stop.
    rec.onend = () => {
      if (wantRef.current) { try { listen(); } catch { /* already started */ } }
    };
    recRef.current = rec;
    rec.start();
  }

  function refreshParts() {
    const parts = partsRef.current;
    setText(parts.map(x => x.text).filter(Boolean).join(' '));
    setPending(parts.filter(x => x.status === 'recording' || x.status === 'sending').length);
  }

  function startPiece() {
    const part = { status: 'recording', text: '' };
    partsRef.current.push(part);
    const rec = new MediaRecorder(streamRef.current, mimeRef.current ? { mimeType: mimeRef.current } : undefined);
    const chunks = [];
    const began = Date.now();
    rec.ondataavailable = e => { if (e.data.size) chunks.push(e.data); };
    rec.onstop = () => {
      const blob = new Blob(chunks, { type: rec.mimeType || mimeRef.current || 'audio/webm' });
      if (Date.now() - began < 800 || blob.size < 1000) {
        part.status = 'done'; refreshParts(); return;
      }
      part.status = 'sending'; refreshParts();
      transcribeAudio(blob, termsRef.current)
        .then(t => { part.text = t; part.status = 'done'; })
        .catch(err => {
          part.status = 'failed';
          setError(`${err.message || 'Part of your answer could not be turned into text.'} Check the text and fill in anything missing.`);
        })
        .finally(refreshParts);
    };
    rec.start();
    recRef.current = rec;
    segStartRef.current = began;
    quietSinceRef.current = null;
    refreshParts();
  }

  // Ten times a second: update the volume meter and decide whether to cut.
  function monitor(analyser, buf) {
    analyser.getFloatTimeDomainData(buf);
    let sum = 0;
    for (const v of buf) sum += v * v;
    const rms = Math.sqrt(sum / buf.length);
    setLevel(Math.min(1, rms * 8));

    const now = Date.now();
    if (rms < SILENCE) quietSinceRef.current ??= now;
    else quietSinceRef.current = null;

    const len = now - segStartRef.current;
    const paused = quietSinceRef.current != null && now - quietSinceRef.current >= PAUSE_MS;
    if ((len >= SOFT_CUT && paused) || len >= HARD_CUT) {
      // Start the next piece before stopping this one, so nothing falls
      // into a gap between them.
      const old = recRef.current;
      startPiece();
      old.stop();
    }
  }

  async function startSarvam() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });
      streamRef.current = stream;
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      ctxRef.current = ctx;
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 1024;
      ctx.createMediaStreamSource(stream).connect(analyser);
      const buf = new Float32Array(analyser.fftSize);
      mimeRef.current = pickMime();
      partsRef.current = [];
      startPiece();
      tickRef.current = setInterval(() => monitor(analyser, buf), 100);
      setPhase('recording');
    } catch (err) {
      releaseMic();
      setError(err?.name === 'NotAllowedError'
        ? 'Microphone access was blocked. Allow the mic for this site in your browser settings, or type your answer.'
        : 'Could not start the microphone. Check it is connected, or type your answer.');
    }
  }

  function start() {
    setError(''); setResult(null); setInterim(''); setLevel(0);
    finalRef.current = ''; setText(''); setSeconds(0);
    if (engine === 'sarvam') { startSarvam(); return; }
    wantRef.current = true;
    try {
      listen();
      setPhase('recording');
    } catch {
      wantRef.current = false;
      setError('Could not start the microphone. Try again, or type your answer.');
    }
  }

  function stop() {
    if (engine === 'sarvam') {
      clearInterval(tickRef.current);
      if (recRef.current?.state === 'recording') recRef.current.stop();
      releaseMic();
      setLevel(0);
      setPhase('transcribing');
      return;
    }
    wantRef.current = false;
    recRef.current?.stop();
    setInterim('');
    setPhase('review');
  }

  async function send() {
    const transcript = text.trim();
    if (wordCount(transcript) < MIN_WORDS) {
      setError(MIN_WORDS === 1 ? 'Say your answer first.' : `Say a little more first — at least ${MIN_WORDS} words. You have ${wordCount(transcript)}.`);
      return;
    }
    setError(''); setPhase('sending');
    try {
      const data = await speakPrepTopic(topic.id, {
        transcript,
        seconds: typing ? null : seconds,
        topic: { title: topic.title, ask: topic.ask, points: topic.points, personal: topic.stepId === 'self', answer: length },
      });
      setResult(data);
      setPhase('done');
      onSaved(data.progress);
    } catch (err) {
      setError(err.message || 'Could not get feedback.');
      setPhase('review');
    }
  }

  const words = wordCount(text);

  return (
    <div className="mt-4 bg-white border-2 border-brand-100 rounded-xl p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[12px] font-bold text-brand-600 uppercase tracking-wide flex items-center gap-1.5">
            <Mic className="w-3.5 h-3.5" /> Speak your answer · {ANSWER[length].label}
          </p>
          <p className="mt-1.5 text-base font-semibold text-gray-900 leading-snug">"{topic.ask}"</p>
        </div>
        <button type="button" onClick={onClose} className="text-sm text-gray-500 hover:text-gray-700 cursor-pointer shrink-0 min-h-[36px] px-1">Close</button>
      </div>

      {phase === 'idle' && (
        <div className="mt-3">
          <p className="text-sm text-gray-600 leading-relaxed">
            {hint} Our AI will tell you {short ? 'if you are right' : 'what worked and what to fix'}. If it says you are
            ready, the topic is marked <span className="font-semibold text-emerald-600">Can speak</span>.
          </p>
          <CostNote />
          {!typing ? (
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <button type="button" onClick={start} className="btn-primary text-sm px-4 py-2">
                <Mic className="w-4 h-4" /> Start speaking
              </button>
              <button type="button" onClick={() => { setTyping(true); setPhase('review'); }}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-700 cursor-pointer">
                <Keyboard className="w-3.5 h-3.5" /> Type instead
              </button>
            </div>
          ) : (
            <button type="button" onClick={() => setPhase('review')} className="btn-primary text-sm px-4 py-2 mt-3">
              <Keyboard className="w-4 h-4" /> Type your answer
            </button>
          )}
          {engine && (
            <p className="mt-2 text-[12px] text-gray-400">
              {engine === 'sarvam'
                ? 'Speech-to-text tuned for Indian English.'
                : 'Speech-to-text: your browser\'s built-in one, which can struggle with Indian accents. Fix any wrong words before asking for feedback.'}
            </p>
          )}
          {!engine && (
            <p className="mt-2 text-[12px] text-gray-400">
              This browser cannot turn speech into text. Open the site in Chrome or Edge to speak, or type what you would say.
            </p>
          )}
        </div>
      )}

      {phase === 'recording' && (
        <div className="mt-3">
          <div className="flex items-center gap-3">
            <span className="relative flex w-3 h-3">
              <span className="absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75 animate-ping" />
              <span className="relative inline-flex w-3 h-3 rounded-full bg-red-500" />
            </span>
            <span className={`text-lg font-bold tabular-nums ${seconds >= TARGET ? 'text-emerald-600' : 'text-gray-900'}`}>{clock(seconds)}</span>
            <span className="text-xs text-gray-400">{seconds >= TARGET ? (short ? 'Done? Tap Stop' : 'Time to wrap up') : `aim for ${clock(TARGET)}`}</span>
            <button type="button" onClick={stop}
              className="ml-auto inline-flex items-center gap-1.5 text-sm font-semibold text-white bg-red-500 hover:bg-red-600 px-4 py-2 rounded-lg cursor-pointer">
              <Square className="w-3.5 h-3.5 fill-white" /> Stop
            </button>
          </div>
          <div className="mt-3 h-1 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-brand-600 transition-all" style={{ width: `${Math.min(100, (seconds / TARGET) * 100)}%` }} />
          </div>
          <div className="mt-3 flex items-end gap-0.5 h-5" aria-hidden>
            {Array.from({ length: 16 }, (_, i) => (
              <span key={i} className={`w-1.5 rounded-sm ${level * 16 > i ? 'bg-brand-600' : 'bg-gray-200'}`}
                style={{ height: `${30 + (i % 4) * 20}%` }} />
            ))}
          </div>
          <p className="mt-3 text-sm text-gray-700 min-h-[3rem] max-h-40 overflow-y-auto">
            {text}<span className="text-gray-400">{interim}</span>
            {!text && !interim && (
              <span className="text-gray-400">
                {engine === 'sarvam'
                  ? (short ? 'Listening… say your answer, then tap Stop.' : 'Listening… your words appear here every 20–30 seconds.')
                  : 'Listening… start speaking.'}
              </span>
            )}
          </p>
        </div>
      )}

      {phase === 'transcribing' && (
        <div className="mt-3 flex items-center gap-2 text-sm text-gray-600">
          <span className="w-4 h-4 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
          Turning your speech into text…
        </div>
      )}

      {(phase === 'review' || phase === 'sending') && (
        <div className="mt-3">
          <p className="text-[12px] text-gray-500 mb-1.5">
            {typing ? 'Write what you would say, as you would say it.' : 'Fix any words that came out wrong, then get feedback.'}
          </p>
          <textarea rows={short ? 2 : 6} value={text} onChange={e => setText(e.target.value)} disabled={phase === 'sending'}
            className="input-base text-sm resize-y" placeholder="Your answer…" />
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <button type="button" onClick={send} disabled={phase === 'sending' || !text.trim()} className="btn-primary text-sm px-4 py-2">
              <Sparkles className="w-4 h-4" /> {phase === 'sending' ? 'Listening to your answer…' : 'Get feedback'}
            </button>
            {engine && phase === 'review' && (
              <button type="button" onClick={() => { setTyping(false); start(); }}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-700 cursor-pointer">
                <RotateCcw className="w-3.5 h-3.5" /> Record again
              </button>
            )}
            <span className="text-[12px] text-gray-400 ml-auto">
              {words} words{!typing && ` · ${clock(seconds)}`}
            </span>
          </div>
          <CostNote />
          <p className="mt-2 text-[12px] text-gray-400">
            {engine === 'sarvam'
              ? 'Your voice is used only to turn it into text, and is not stored. This text is what our AI reads.'
              : 'Only this text is sent to our AI. Your voice is never recorded or stored.'}
          </p>
        </div>
      )}

      {phase === 'done' && result && (
        <div className="mt-4">
          <Feedback feedback={result.feedback} seconds={typing ? null : seconds} words={words} />
          <div className="mt-4 pt-3 border-t border-gray-100 flex flex-wrap items-center gap-3">
            {result.feedback.verdict === 'ready' ? (
              <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-700">
                <Check className="w-4 h-4" /> Marked as Can speak
              </span>
            ) : (
              <>
                <button type="button" onClick={() => (typing ? (setResult(null), setPhase('review')) : start())}
                  className="btn-primary text-sm px-4 py-2">
                  <RotateCcw className="w-4 h-4" /> Try again
                </button>
                {status < 2 && (
                  <button type="button" onClick={onMarkAnyway}
                    className="text-xs font-semibold text-gray-500 hover:text-gray-700 cursor-pointer">
                    Mark Can speak anyway
                  </button>
                )}
              </>
            )}
            <span className="text-[12px] text-gray-400 ml-auto">
              {result.used_today}/{result.daily_limit} feedbacks used today
            </span>
          </div>
        </div>
      )}

      {error && (
        <p className="mt-3 flex items-start gap-2 text-xs text-red-700 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
          <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" /> {error}
        </p>
      )}
    </div>
  );
}
