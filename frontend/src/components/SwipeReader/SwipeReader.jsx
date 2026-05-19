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

function SideArrow({ onClick, disabled, direction }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="hidden sm:flex w-11 h-11 rounded-full bg-white border border-gray-200 shadow-md items-center justify-center text-brand-600 disabled:opacity-25 hover:bg-brand-50 hover:border-brand-200 hover:shadow-lg transition-all cursor-pointer disabled:cursor-not-allowed shrink-0"
    >
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        {direction === 'prev'
          ? <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          : <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />}
      </svg>
    </button>
  );
}

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
    /* Desktop: flex row with arrows flanking the card */
    <div className="flex items-center gap-4 w-full sm:w-auto">

      <SideArrow direction="prev" onClick={prev} disabled={scene === 0} />

      {/* ── Card ── */}
      <div
        ref={containerRef}
        className="swipe-reader relative bg-white flex flex-col overflow-hidden w-full sm:rounded-2xl sm:border sm:border-gray-200 sm:shadow-xl sm:max-w-sm"
      >
        {/* Progress bar */}
        <div className="shrink-0">
          <div className="h-0.5 bg-gray-100">
            <div
              className="h-full bg-brand-600 transition-all duration-300 ease-out"
              style={{ width: `${pct}%` }}
            />
          </div>

          {/* Dots + label + close */}
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100">
            <div className="flex items-center gap-1">
              {article.scenes.map((_, i) => (
                <button
                  key={i}
                  onClick={() => { setDir(i > scene ? 1 : -1); setScene(i); setShowHint(false); }}
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

        {/* Scene area */}
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
              className="absolute inset-0 overflow-y-auto"
            >
              <SceneRenderer scene={currentScene} article={article} />
            </motion.div>
          </AnimatePresence>

          {/* Mobile swipe hint */}
          <AnimatePresence>
            {showHint && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                transition={{ duration: 0.3 }}
                className="absolute inset-x-0 bottom-4 flex justify-center sm:hidden pointer-events-none"
              >
                <div className="bg-gray-900/75 backdrop-blur-sm text-white text-[11px] font-semibold px-4 py-2 rounded-full flex items-center gap-3">
                  <span className="flex items-center gap-1">
                    <svg className="w-3.5 h-3.5 animate-bounce" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                    </svg>
                    Swipe up
                  </span>
                  <span className="w-px h-3 bg-white/30" />
                  <span className="flex items-center gap-1">
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                    Swipe down
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Desktop keyboard hint */}
          <AnimatePresence>
            {showHint && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-x-0 bottom-4 hidden sm:flex justify-center pointer-events-none"
              >
                <div className="bg-gray-900/70 backdrop-blur-sm text-white text-[11px] font-semibold px-4 py-2 rounded-full flex items-center gap-2">
                  <kbd className="font-mono bg-white/20 px-1.5 py-0.5 rounded text-[10px]">←</kbd>
                  <kbd className="font-mono bg-white/20 px-1.5 py-0.5 rounded text-[10px]">→</kbd>
                  <span className="text-white/70">arrow keys or side buttons</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Bottom nav — mobile only (desktop uses side arrows) */}
        <div
          className="shrink-0 border-t border-gray-100 px-4 py-3 flex items-center justify-between bg-white sm:hidden"
          style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px) + 12px, 12px)' }}
        >
          <button onClick={prev} disabled={scene === 0}
            className="flex items-center gap-1 text-xs font-semibold transition-colors disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed text-brand-600 hover:text-brand-700">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Prev
          </button>
          <p className="text-[10px] text-gray-400 font-medium text-center truncate px-2">{article.title}</p>
          <button onClick={next} disabled={scene === total - 1}
            className="flex items-center gap-1 text-xs font-semibold transition-colors disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed text-brand-600 hover:text-brand-700">
            Next
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      <SideArrow direction="next" onClick={next} disabled={scene === total - 1} />
    </div>
  );
}
