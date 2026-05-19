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

function SceneIcon({ type, className = 'w-3.5 h-3.5' }) {
  const paths = {
    hook:            <path strokeLinecap="round" strokeLinejoin="round" d="M5 3l14 9-14 9V3z" />,
    concept:         <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />,
    breakdown:       <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" />,
    two_sides:       <path strokeLinecap="round" strokeLinejoin="round" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5" />,
    context:         <path strokeLinecap="round" strokeLinejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />,
    ssb_application: <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />,
    quiz:            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />,
  };
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      {paths[type] || null}
    </svg>
  );
}

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

/* Shared close button — prominent pill */
function CloseBtn({ onClick, mobile }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 rounded-full border transition-all cursor-pointer font-semibold ${
        mobile
          ? 'px-2.5 py-1 text-[11px] bg-white border-gray-200 text-gray-500 hover:border-gray-300 hover:text-gray-700'
          : 'px-3 py-1.5 text-xs bg-gray-100 border-gray-200 text-gray-600 hover:bg-brand-50 hover:border-brand-200 hover:text-brand-600'
      }`}
    >
      <svg className={mobile ? 'w-3 h-3' : 'w-3.5 h-3.5'} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
      </svg>
      Exit
    </button>
  );
}

export default function SwipeReader({ article, onClose }) {
  const [scene,      setScene]      = useState(0);
  const [dir,        setDir]        = useState(1);
  const [showHint,   setShowHint]   = useState(true);
  const [hoveredDot, setHoveredDot] = useState(null);
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
    setDir(i > scene ? 1 : -1); setScene(i); setShowHint(false);
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

  function SceneArea({ variants }) {
    return (
      <div className="flex-1 overflow-hidden relative">
        <AnimatePresence mode="wait" custom={dir}>
          <motion.div key={scene} custom={dir} variants={variants}
            initial="enter" animate="center" exit="exit"
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="absolute inset-0 overflow-hidden">
            <div className="h-full overflow-y-auto">
              <SceneRenderer scene={currentScene} article={article} onClose={onClose} />
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
          MOBILE
      ══════════════════════════════ */}
      <div className="sm:hidden w-full h-full">
        <div ref={containerRef}
          className="swipe-reader relative bg-white flex flex-col overflow-hidden w-full">

          {/* Progress bar */}
          <div className="shrink-0">
            <div className="h-0.5 bg-gray-100">
              <div className="h-full bg-brand-600 transition-all duration-300 ease-out" style={{ width: `${pct}%` }} />
            </div>
            {/* Header */}
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
              {/* Prominent exit for mobile */}
              {onClose && <CloseBtn onClick={onClose} mobile />}
            </div>
          </div>

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

        {/* Top bar */}
        <div className="shrink-0 h-12 bg-white border-b border-gray-100 px-8 flex items-center justify-between">
          <button onClick={onClose}
            className="flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-brand-600 transition-colors cursor-pointer group">
            <svg className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            News Cards
          </button>
          <div className="flex items-center gap-3 text-[10px] text-gray-400">
            <span>← → keys to navigate</span>
            {article.ssb_tags?.map(tag => (
              <span key={tag} className="font-semibold px-2 py-0.5 rounded-full bg-brand-50 text-brand-600 border border-brand-100">
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Dots + Card */}
        <div className="flex-1 flex items-center justify-center gap-6 overflow-hidden px-8 py-6">

          {/* Vertical dot line with hover labels */}
          <div className="flex flex-col items-center shrink-0 select-none relative">
            {article.scenes.map((s, i) => (
              <div key={i} className="flex flex-col items-center relative">

                {/* Hover label — floats to the LEFT of the dot */}
                <AnimatePresence>
                  {hoveredDot === i && (
                    <motion.div
                      initial={{ opacity: 0, x: 4 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 4 }}
                      transition={{ duration: 0.12 }}
                      className="absolute right-full mr-3 top-1/2 -translate-y-1/2 z-20 pointer-events-none"
                    >
                      <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 shadow-md whitespace-nowrap">
                        <SceneIcon type={s.type}
                          className={`w-3 h-3 shrink-0 ${i === scene ? 'text-brand-600' : 'text-gray-400'}`} />
                        <span className={`text-[11px] font-semibold ${i === scene ? 'text-brand-700' : 'text-gray-600'}`}>
                          {SCENE_LABELS[s.type]}
                        </span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Dot button */}
                <button
                  onClick={() => goTo(i)}
                  onMouseEnter={() => setHoveredDot(i)}
                  onMouseLeave={() => setHoveredDot(null)}
                  className="group relative flex items-center justify-center cursor-pointer"
                  style={{ width: 20, height: 20 }}
                >
                  <span className={`absolute rounded-full transition-all duration-200 ${
                    i === scene ? 'w-5 h-5 bg-brand-600/10' : 'w-0 h-0 group-hover:w-5 group-hover:h-5 bg-gray-200/60'
                  }`} />
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

            {/* Card header */}
            <div className="shrink-0">
              <div className="h-0.5 bg-gray-100">
                <div className="h-full bg-brand-600 transition-all duration-300 ease-out" style={{ width: `${pct}%` }} />
              </div>
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100">
                <p className="text-[10px] text-gray-400 font-medium">{scene + 1} / {total}</p>
                <p className="text-[10px] text-gray-400 font-medium">{sceneLabel}</p>
                {onClose && <CloseBtn onClick={onClose} mobile={false} />}
              </div>
            </div>

            <SceneArea variants={desktopVariants} />

            {/* Bottom nav */}
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
