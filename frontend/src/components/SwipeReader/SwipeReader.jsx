import { useState, useEffect, useCallback, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
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

const variants = {
  enter:  (dir) => ({ y: dir > 0 ? 48 : -48, opacity: 0 }),
  center: { y: 0, opacity: 1 },
  exit:   (dir) => ({ y: dir > 0 ? -48 : 48, opacity: 0 }),
};

export default function SwipeReader({ article, onClose }) {
  const [scene,     setScene]     = useState(0);
  const [dir,       setDir]       = useState(1);
  const [showHint,  setShowHint]  = useState(true);
  const [hoverZone, setHoverZone] = useState(null); // 'prev' | 'next' | null
  const total = article.scenes.length;

  // Hide hint after 2.5s or after first navigation
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

  // Keyboard navigation
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

  const currentScene  = article.scenes[scene];
  const sceneLabel    = SCENE_LABELS[currentScene?.type] || '';
  const pct           = ((scene + 1) / total) * 100;

  return (
    <div
      ref={containerRef}
      className="swipe-reader relative bg-white flex flex-col overflow-hidden w-full sm:rounded-2xl sm:border sm:border-gray-200 sm:shadow-xl sm:max-w-sm"
    >
      {/* ── Progress bar ── */}
      <div className="shrink-0">
        <div className="h-0.5 bg-gray-100">
          <div
            className="h-full bg-brand-600 transition-all duration-300 ease-out"
            style={{ width: `${pct}%` }}
          />
        </div>

        {/* Scene dots + label */}
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100">
          <div className="flex items-center gap-1">
            {article.scenes.map((_, i) => (
              <button
                key={i}
                onClick={() => { setDir(i > scene ? 1 : -1); setScene(i); }}
                className={`rounded-full transition-all duration-200 cursor-pointer ${
                  i === scene
                    ? 'w-4 h-1.5 bg-brand-600'
                    : 'w-1.5 h-1.5 bg-gray-200 hover:bg-gray-300'
                }`}
              />
            ))}
          </div>
          <p className="text-[10px] text-gray-400 font-medium">
            {scene + 1}/{total} · {sceneLabel}
          </p>
          {onClose && (
            <button onClick={onClose}
              className="text-gray-300 hover:text-gray-600 transition-colors cursor-pointer ml-2">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* ── Scene area ── */}
      <div className="flex-1 overflow-hidden relative">
        <AnimatePresence mode="wait" custom={dir}>
          <motion.div
            key={scene}
            custom={dir}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="absolute inset-0 overflow-hidden"
          >
            <SceneRenderer scene={currentScene} article={article} />
          </motion.div>
        </AnimatePresence>

        {/* ── Desktop click zones (hidden on touch devices) ── */}
        <div className="absolute inset-0 hidden sm:flex pointer-events-none">
          {/* Prev zone — left 40% */}
          <div
            className="h-full w-[40%] pointer-events-auto cursor-pointer flex items-center justify-start pl-3 group"
            onClick={prev}
            onMouseEnter={() => setHoverZone('prev')}
            onMouseLeave={() => setHoverZone(null)}
          >
            <AnimatePresence>
              {hoverZone === 'prev' && scene > 0 && (
                <motion.div
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  transition={{ duration: 0.15 }}
                  className="bg-white/80 backdrop-blur-sm border border-gray-200 rounded-full w-8 h-8 flex items-center justify-center shadow-sm"
                >
                  <svg className="w-4 h-4 text-brand-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          {/* Next zone — right 60% */}
          <div
            className="h-full flex-1 pointer-events-auto cursor-pointer flex items-center justify-end pr-3 group"
            onClick={next}
            onMouseEnter={() => setHoverZone('next')}
            onMouseLeave={() => setHoverZone(null)}
          >
            <AnimatePresence>
              {hoverZone === 'next' && scene < total - 1 && (
                <motion.div
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 8 }}
                  transition={{ duration: 0.15 }}
                  className="bg-white/80 backdrop-blur-sm border border-gray-200 rounded-full w-8 h-8 flex items-center justify-center shadow-sm"
                >
                  <svg className="w-4 h-4 text-brand-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* ── Swipe hint overlay (mobile, first scene only) ── */}
        <AnimatePresence>
          {showHint && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.3 }}
              className="absolute inset-x-0 bottom-6 flex justify-center sm:hidden pointer-events-none"
            >
              <div className="bg-gray-900/75 backdrop-blur-sm text-white text-[11px] font-semibold px-4 py-2 rounded-full flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <svg className="w-3.5 h-3.5 animate-bounce" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                  </svg>
                  Swipe up for next
                </span>
                <span className="w-px h-3 bg-white/30" />
                <span className="flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                  down for prev
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Desktop keyboard hint (shows briefly on first load) ── */}
        <AnimatePresence>
          {showHint && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="absolute inset-x-0 bottom-6 hidden sm:flex justify-center pointer-events-none"
            >
              <div className="bg-gray-900/70 backdrop-blur-sm text-white text-[11px] font-semibold px-4 py-2 rounded-full flex items-center gap-2">
                <kbd className="font-mono bg-white/20 px-1.5 py-0.5 rounded text-[10px]">←</kbd>
                <kbd className="font-mono bg-white/20 px-1.5 py-0.5 rounded text-[10px]">→</kbd>
                <span className="text-white/70">or click sides to navigate</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Bottom nav ── */}
      <div className="shrink-0 border-t border-gray-100 px-4 py-3 flex items-center justify-between bg-white"
        style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px) + 12px, 12px)' }}>
        <button
          onClick={prev}
          disabled={scene === 0}
          className="flex items-center gap-1 text-xs font-semibold transition-colors disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed text-brand-600 hover:text-brand-700"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Prev
        </button>

        <p className="text-[10px] text-gray-400 font-medium text-center">
          {article.title}
        </p>

        <button
          onClick={next}
          disabled={scene === total - 1}
          className="flex items-center gap-1 text-xs font-semibold transition-colors disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed text-brand-600 hover:text-brand-700"
        >
          Next
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
}
