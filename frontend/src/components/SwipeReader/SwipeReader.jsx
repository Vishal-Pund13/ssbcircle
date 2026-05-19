import { useState, useEffect, useCallback, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import SceneRenderer from './SceneRenderer';
import { useSwipe } from '../../hooks/useSwipe';
import './SwipeReader.css';

const SCENE_LABELS = {
  hook:            'Introduction',
  concept:         'Core Concept',
  breakdown:       'Breakdown',
  two_sides:       'Two Sides',
  context:         'Big Picture',
  ssb_application: 'SSB Application',
  quiz:            'Test Yourself',
};

// Brand-palette SVG icon paths
function SceneIcon({ type, className = 'w-3.5 h-3.5' }) {
  const paths = {
    hook: (
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M5 3l14 9-14 9V3z" />
    ),
    concept: (
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
    ),
    breakdown: (
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M4 6h16M4 10h16M4 14h16M4 18h16" />
    ),
    two_sides: (
      <>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5" />
      </>
    ),
    context: (
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    ),
    ssb_application: (
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    ),
    quiz: (
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    ),
  };

  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      {paths[type] || null}
    </svg>
  );
}

// Mobile: vertical swipe
const mobileVariants = {
  enter:  (dir) => ({ y: dir > 0 ? 48 : -48, opacity: 0 }),
  center: { y: 0, opacity: 1 },
  exit:   (dir) => ({ y: dir > 0 ? -48 : 48, opacity: 0 }),
};

// Desktop: horizontal slide
const desktopVariants = {
  enter:  (dir) => ({ x: dir > 0 ? 32 : -32, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit:   (dir) => ({ x: dir > 0 ? -32 : 32, opacity: 0 }),
};

export default function SwipeReader({ article, onClose }) {
  const [scene,    setScene]    = useState(0);
  const [dir,      setDir]      = useState(1);
  const [showHint, setShowHint] = useState(true);
  const total = article.scenes.length;

  useEffect(() => {
    const t = setTimeout(() => setShowHint(false), 2500);
    return () => clearTimeout(t);
  }, []);

  const next = useCallback(() => {
    if (scene < total - 1) { setDir(1); setScene(s => s + 1); setShowHint(false); }
  }, [scene, total]);

  const prev = useCallback(() => {
    if (scene > 0) { setDir(-1); setScene(s => s - 1); setShowHint(false); }
  }, [scene]);

  const goTo = useCallback((i) => {
    setDir(i > scene ? 1 : -1);
    setScene(i);
    setShowHint(false);
  }, [scene]);

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') next();
      if (e.key === 'ArrowUp'   || e.key === 'ArrowLeft')  prev();
      if (e.key === 'Escape' && onClose) onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [next, prev, onClose]);

  const containerRef = useRef(null);
  useSwipe({ onSwipeUp: next, onSwipeDown: prev, elementRef: containerRef });

  const currentScene = article.scenes[scene];
  const sceneLabel   = SCENE_LABELS[currentScene?.type] || '';
  const pct          = ((scene + 1) / total) * 100;

  return (
    <>
      {/* ══════════════════════════════════════
          MOBILE — full-screen swipe card
      ══════════════════════════════════════ */}
      <div className="sm:hidden w-full h-full">
        <div ref={containerRef} className="swipe-reader relative bg-white flex flex-col overflow-hidden w-full">

          {/* Progress */}
          <div className="shrink-0">
            <div className="h-0.5 bg-gray-100">
              <div className="h-full bg-brand-600 transition-all duration-300 ease-out" style={{ width: `${pct}%` }} />
            </div>
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100">
              <div className="flex items-center gap-1">
                {article.scenes.map((_, i) => (
                  <button key={i} onClick={() => goTo(i)}
                    className={`rounded-full transition-all duration-200 cursor-pointer ${
                      i === scene ? 'w-4 h-1.5 bg-brand-600' : 'w-1.5 h-1.5 bg-gray-200'
                    }`} />
                ))}
              </div>
              <p className="text-[10px] text-gray-400 font-medium">{scene + 1}/{total} · {sceneLabel}</p>
              {onClose && (
                <button onClick={onClose} className="text-gray-300 hover:text-gray-600 ml-2 cursor-pointer">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          {/* Scene */}
          <div className="flex-1 overflow-hidden relative">
            <AnimatePresence mode="wait" custom={dir}>
              <motion.div key={scene} custom={dir} variants={mobileVariants}
                initial="enter" animate="center" exit="exit"
                transition={{ duration: 0.25, ease: 'easeOut' }}
                className="absolute inset-0 overflow-hidden">
                <div className="h-full overflow-y-auto">
                  <SceneRenderer scene={currentScene} article={article} />
                </div>
              </motion.div>
            </AnimatePresence>

            <AnimatePresence>
              {showHint && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }} transition={{ duration: 0.3 }}
                  className="absolute inset-x-0 bottom-4 flex justify-center pointer-events-none">
                  <div className="bg-gray-900/75 backdrop-blur-sm text-white text-[11px] font-semibold px-4 py-2 rounded-full flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <svg className="w-3.5 h-3.5 animate-bounce" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                      </svg>
                      Swipe up
                    </span>
                    <span className="w-px h-3 bg-white/30" />
                    <span>Swipe down</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Bottom nav */}
          <div className="shrink-0 border-t border-gray-100 px-4 py-3 flex items-center justify-between bg-white"
            style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px) + 12px, 12px)' }}>
            <button onClick={prev} disabled={scene === 0}
              className="flex items-center gap-1 text-xs font-semibold disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed text-brand-600">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              Prev
            </button>
            <p className="text-[10px] text-gray-400 font-medium text-center truncate px-2">{article.title}</p>
            <button onClick={next} disabled={scene === total - 1}
              className="flex items-center gap-1 text-xs font-semibold disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed text-brand-600">
              Next
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════
          DESKTOP — minimal index + reading panel
      ══════════════════════════════════════ */}
      <div className="hidden sm:flex h-full w-full bg-white">

        {/* ── Minimal index sidebar ── */}
        <aside className="w-48 shrink-0 border-r border-gray-100 flex flex-col h-full bg-white">

          {/* Logo only */}
          <div className="px-4 py-4 border-b border-gray-100 shrink-0 flex items-center gap-2">
            <svg viewBox="0 0 48 48" fill="none" className="w-5 h-5 shrink-0">
              <circle cx="24" cy="24" r="22" stroke="#1e3a5f" strokeWidth="3" />
              <circle cx="14" cy="20" r="3.5" fill="#1e3a5f" />
              <circle cx="24" cy="14" r="3.5" fill="#1e3a5f" />
              <circle cx="34" cy="20" r="3.5" fill="#1e3a5f" />
              <circle cx="30" cy="31" r="3.5" fill="#1e3a5f" />
              <circle cx="18" cy="31" r="3.5" fill="#1e3a5f" />
              <path d="M14 20 L24 14 L34 20 L30 31 L18 31 Z" stroke="#1e3a5f" strokeWidth="1.5" fill="none" />
            </svg>
            <span className="text-xs font-bold text-gray-600 tracking-tight">SSBCircle</span>
          </div>

          {/* Index label */}
          <div className="px-4 pt-4 pb-2 shrink-0">
            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Contents</p>
          </div>

          {/* Scene index — compact */}
          <nav className="flex-1 overflow-y-auto px-3 pb-3">
            {article.scenes.map((s, i) => {
              const isActive = i === scene;
              const isDone   = i < scene;
              return (
                <button key={i} onClick={() => goTo(i)}
                  className={`w-full text-left flex items-center gap-2.5 px-2.5 py-2 rounded-lg mb-0.5 transition-all cursor-pointer group ${
                    isActive ? 'bg-brand-600' : 'hover:bg-gray-50'
                  }`}>
                  <SceneIcon type={s.type}
                    className={`w-3.5 h-3.5 shrink-0 transition-colors ${
                      isActive ? 'text-white' : isDone ? 'text-gray-300' : 'text-gray-400 group-hover:text-brand-600'
                    }`}
                  />
                  <span className={`text-[11px] font-medium leading-tight truncate ${
                    isActive ? 'text-white' : isDone ? 'text-gray-400' : 'text-gray-600 group-hover:text-gray-900'
                  }`}>
                    {SCENE_LABELS[s.type]}
                  </span>
                  {isDone && !isActive && (
                    <svg className="w-3 h-3 text-brand-600 shrink-0 ml-auto" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Minimal progress */}
          <div className="px-4 py-3 border-t border-gray-100 shrink-0">
            <div className="h-1 bg-gray-100 rounded-full overflow-hidden mb-1.5">
              <div className="h-full bg-brand-600 rounded-full transition-all duration-300" style={{ width: `${pct}%` }} />
            </div>
            <p className="text-[10px] text-gray-400 text-center">{scene + 1} / {total}</p>
          </div>
        </aside>

        {/* ── Content panel ── */}
        <div className="flex-1 flex flex-col h-full min-w-0 bg-gray-50">

          {/* Top bar — exit is the dominant action on the left */}
          <div className="shrink-0 h-13 bg-white border-b border-gray-100 px-6 flex items-center justify-between" style={{ height: '52px' }}>
            {/* Prominent exit — left side, always visible */}
            <button onClick={onClose}
              className="flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-brand-600 transition-colors cursor-pointer group">
              <svg className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span>News Cards</span>
            </button>

            {/* Right: scene label + tags */}
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-gray-400">{sceneLabel}</span>
              <span className="text-gray-200 text-xs">|</span>
              <div className="flex items-center gap-1.5">
                {article.ssb_tags?.map(tag => (
                  <span key={tag} className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-brand-50 text-brand-600 border border-brand-100">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Scene content */}
          <div className="flex-1 overflow-hidden relative">
            <AnimatePresence mode="wait" custom={dir}>
              <motion.div key={scene} custom={dir} variants={desktopVariants}
                initial="enter" animate="center" exit="exit"
                transition={{ duration: 0.2, ease: 'easeOut' }}
                className="absolute inset-0 overflow-y-auto">
                <div className="max-w-2xl mx-auto px-8 py-8">
                  <SceneRenderer scene={currentScene} article={article} />
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Bottom nav */}
          <div className="shrink-0 bg-white border-t border-gray-100 px-6 flex items-center justify-between" style={{ height: '52px' }}>
            <button onClick={prev} disabled={scene === 0}
              className="flex items-center gap-1.5 text-sm font-semibold text-brand-600 hover:text-brand-700 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              {scene > 0 ? SCENE_LABELS[article.scenes[scene - 1]?.type] : 'Previous'}
            </button>

            <div className="flex items-center gap-1">
              {article.scenes.map((_, i) => (
                <button key={i} onClick={() => goTo(i)}
                  className={`rounded-full transition-all duration-200 cursor-pointer ${
                    i === scene ? 'w-4 h-1.5 bg-brand-600' : 'w-1.5 h-1.5 bg-gray-200 hover:bg-gray-300'
                  }`} />
              ))}
            </div>

            <button onClick={next} disabled={scene === total - 1}
              className="flex items-center gap-1.5 text-sm font-semibold text-brand-600 hover:text-brand-700 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors">
              {scene < total - 1 ? SCENE_LABELS[article.scenes[scene + 1]?.type] : 'Finished'}
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
