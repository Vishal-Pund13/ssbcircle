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

const mobileVariants = {
  enter:  (dir) => ({ y: dir > 0 ? 48 : -48, opacity: 0 }),
  center: { y: 0, opacity: 1 },
  exit:   (dir) => ({ y: dir > 0 ? -48 : 48, opacity: 0 }),
};

const desktopVariants = {
  enter:  (dir) => ({ y: dir > 0 ? 24 : -24, opacity: 0 }),
  center: { y: 0, opacity: 1 },
  exit:   (dir) => ({ y: dir > 0 ? -24 : 24, opacity: 0 }),
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

  /* ─── Shared card header (used on both mobile + desktop) ─── */
  const CardHeader = (
    <div className="shrink-0">
      <div className="h-0.5 bg-gray-100">
        <div className="h-full bg-brand-600 transition-all duration-300 ease-out" style={{ width: `${pct}%` }} />
      </div>
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100">
        {/* Mobile: dots. Desktop: hide dots (side-line handles it) */}
        <div className="flex items-center gap-1 sm:hidden">
          {article.scenes.map((_, i) => (
            <button key={i} onClick={() => goTo(i)}
              className={`rounded-full transition-all duration-200 cursor-pointer ${
                i === scene ? 'w-4 h-1.5 bg-brand-600' : 'w-1.5 h-1.5 bg-gray-200'
              }`} />
          ))}
        </div>
        {/* Desktop: scene counter left-aligned */}
        <p className="hidden sm:block text-[10px] text-gray-400 font-medium">{scene + 1} / {total}</p>
        <p className="text-[10px] text-gray-400 font-medium">{sceneLabel}</p>
        {onClose && (
          <button onClick={onClose} className="text-gray-300 hover:text-gray-600 transition-colors cursor-pointer ml-2">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );

  /* ─── Shared scene area ─── */
  function SceneArea({ variants }) {
    return (
      <div className="flex-1 overflow-hidden relative">
        <AnimatePresence mode="wait" custom={dir}>
          <motion.div key={scene} custom={dir} variants={variants}
            initial="enter" animate="center" exit="exit"
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="absolute inset-0 overflow-hidden">
            <div className="h-full overflow-y-auto">
              <SceneRenderer scene={currentScene} article={article} />
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Mobile swipe hint */}
        <AnimatePresence>
          {showHint && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }} transition={{ duration: 0.3 }}
              className="absolute inset-x-0 bottom-4 flex justify-center sm:hidden pointer-events-none">
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
    );
  }

  return (
    <>
      {/* ══════════════════════════════
          MOBILE — full-screen card
      ══════════════════════════════ */}
      <div className="sm:hidden w-full h-full">
        <div ref={containerRef}
          className="swipe-reader relative bg-white flex flex-col overflow-hidden w-full">
          {CardHeader}
          <SceneArea variants={mobileVariants} />
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
            <p className="text-[10px] text-gray-400 text-center truncate px-2">{article.title}</p>
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

      {/* ══════════════════════════════
          DESKTOP — dot line + card
      ══════════════════════════════ */}
      <div className="hidden sm:flex flex-col h-full w-full bg-gray-50">

        {/* Top bar — exit dominant on left */}
        <div className="shrink-0 h-12 bg-white border-b border-gray-100 px-8 flex items-center justify-between">
          <button onClick={onClose}
            className="flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-brand-600 transition-colors cursor-pointer group">
            <svg className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            News Cards
          </button>
          <div className="flex items-center gap-2 text-[10px] text-gray-400">
            <span>← → keys to navigate</span>
            {article.ssb_tags?.map(tag => (
              <span key={tag} className="font-semibold px-2 py-0.5 rounded-full bg-brand-50 text-brand-600 border border-brand-100">
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Card + dot line */}
        <div className="flex-1 flex items-center justify-center gap-6 overflow-hidden px-8 py-6">

          {/* Vertical dot line */}
          <div className="flex flex-col items-center shrink-0 select-none">
            {article.scenes.map((s, i) => (
              <div key={i} className="flex flex-col items-center">
                <button
                  onClick={() => goTo(i)}
                  title={SCENE_LABELS[s.type]}
                  className="group relative flex items-center justify-center cursor-pointer"
                  style={{ width: 20, height: 20 }}
                >
                  {/* Hover ring */}
                  <span className={`absolute rounded-full transition-all duration-200 ${
                    i === scene ? 'w-5 h-5 bg-brand-600/10' : 'w-0 h-0 group-hover:w-5 group-hover:h-5 bg-gray-200/60'
                  }`} />
                  {/* Dot */}
                  <span className={`rounded-full transition-all duration-200 ${
                    i === scene
                      ? 'w-3 h-3 bg-brand-600'
                      : i < scene
                        ? 'w-2 h-2 bg-brand-300'
                        : 'w-2 h-2 bg-gray-300 group-hover:bg-gray-400'
                  }`} />
                </button>
                {/* Connecting line */}
                {i < total - 1 && (
                  <div className={`w-px transition-colors duration-300 ${i < scene ? 'bg-brand-200' : 'bg-gray-200'}`}
                    style={{ height: 28 }} />
                )}
              </div>
            ))}
          </div>

          {/* Card */}
          <div className="desktop-reader relative bg-white flex flex-col overflow-hidden rounded-2xl border border-gray-200 shadow-lg max-w-xl w-full h-full">
            {CardHeader}
            <SceneArea variants={desktopVariants} />
            {/* Minimal bottom nav */}
            <div className="shrink-0 border-t border-gray-100 px-5 py-3 flex items-center justify-between bg-white">
              <button onClick={prev} disabled={scene === 0}
                className="text-xs font-semibold text-brand-600 hover:text-brand-700 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors">
                ← {scene > 0 ? SCENE_LABELS[article.scenes[scene - 1]?.type] : 'Prev'}
              </button>
              <p className="text-[10px] text-gray-400 truncate px-3 max-w-[180px] text-center">{article.title}</p>
              <button onClick={next} disabled={scene === total - 1}
                className="text-xs font-semibold text-brand-600 hover:text-brand-700 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors">
                {scene < total - 1 ? SCENE_LABELS[article.scenes[scene + 1]?.type] : 'Done'} →
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
