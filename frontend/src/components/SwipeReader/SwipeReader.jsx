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

// Scene slides left/right — Inshorts style
const mobileVariants = {
  enter:  (dir) => ({ x: dir > 0 ? '55%'  : '-55%',  opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit:   (dir) => ({ x: dir > 0 ? '-25%' : '25%',   opacity: 0 }),
};
const desktopVariants = {
  enter:  (dir) => ({ x: dir > 0 ? 50  : -50,  opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit:   (dir) => ({ x: dir > 0 ? -20 : 20,   opacity: 0 }),
};

export default function SwipeReader({ article, onClose, onNextArticle, onPrevArticle }) {
  const [scene,    setScene]    = useState(0);
  const [dir,      setDir]      = useState(1);
  const [showHint, setShowHint] = useState(true);
  const total = article.scenes.length;

  useEffect(() => {
    const t = setTimeout(() => setShowHint(false), 2500);
    return () => clearTimeout(t);
  }, []);

  const next = useCallback(() => {
    if (scene < total - 1) { setDir(1);  setScene(s => s + 1); setShowHint(false); }
    else onNextArticle?.();
  }, [scene, total, onNextArticle]);

  const prev = useCallback(() => {
    if (scene > 0) { setDir(-1); setScene(s => s - 1); setShowHint(false); }
    else onPrevArticle?.();
  }, [scene, onPrevArticle]);

  const goTo = useCallback((i) => {
    setDir(i > scene ? 1 : -1); setScene(i); setShowHint(false);
  }, [scene]);

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'ArrowRight') next();
      if (e.key === 'ArrowLeft')  prev();
      if (e.key === 'ArrowDown')  onNextArticle?.();
      if (e.key === 'ArrowUp')    onPrevArticle?.();
      if (e.key === 'Escape' && onClose) onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [next, prev, onClose, onNextArticle, onPrevArticle]);

  const containerRef = useRef(null);
  useSwipe({
    onSwipeLeft:  next,
    onSwipeRight: prev,
    onSwipeUp:    onNextArticle,
    onSwipeDown:  onPrevArticle,
    elementRef:   containerRef,
  });

  const currentScene = article.scenes[scene];
  const sceneLabel   = SCENE_LABELS[currentScene?.type] || '';

  // Shared content pane used by both layouts
  function ScenePane({ variants }) {
    return (
      <AnimatePresence mode="wait" custom={dir}>
        <motion.div
          key={scene}
          custom={dir}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="absolute inset-0"
        >
          <div className="h-full overflow-y-auto">
            <SceneRenderer scene={currentScene} article={article} onClose={onClose} />
          </div>
        </motion.div>
      </AnimatePresence>
    );
  }

  return (
    <>
      {/* ══════════════════════════════════════
          MOBILE — Inshorts-style full-screen
      ══════════════════════════════════════ */}
      <div className="sm:hidden w-full h-full">
        <div
          ref={containerRef}
          className="swipe-reader relative bg-white flex flex-col overflow-hidden w-full"
        >

          {/* ── Story segment bar ── */}
          <div className="shrink-0 flex items-center gap-[3px] px-3 pt-3">
            {article.scenes.map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                className="flex-1 py-3 -my-3 cursor-pointer"
                aria-label={`Go to scene ${i + 1}`}
              >
                <div className="h-[3px] rounded-full overflow-hidden bg-gray-100">
                  <div
                    className="h-full bg-brand-600 transition-all duration-300"
                    style={{ width: i <= scene ? '100%' : '0%' }}
                  />
                </div>
              </button>
            ))}
          </div>

          {/* ── Article info bar ── */}
          <div className="shrink-0 flex items-center justify-between px-3 pt-2 pb-1.5">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="shrink-0 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-brand-50 text-brand-700 border border-brand-100 uppercase tracking-widest">
                {article.category}
              </span>
              <span className="text-[11px] font-semibold text-gray-500 truncate">
                {article.title}
              </span>
            </div>
            {onClose && (
              <button
                onClick={onClose}
                className="shrink-0 ml-2 w-7 h-7 rounded-full flex items-center justify-center text-gray-400 active:bg-gray-100 cursor-pointer transition-colors"
                aria-label="Exit"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* ── Scene content ── */}
          <div className="flex-1 overflow-hidden relative">
            <ScenePane variants={mobileVariants} />

            {/* Right-edge article nav arrows */}
            <div className="absolute right-2 inset-y-0 flex flex-col items-center justify-center gap-5 pointer-events-none select-none">
              {onPrevArticle && (
                <motion.div
                  animate={{ y: [0, -5, 0] }}
                  transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut', repeatDelay: 0.8 }}
                >
                  <svg className="w-[15px] h-[15px] text-gray-200" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                  </svg>
                </motion.div>
              )}
              {onNextArticle && (
                <motion.div
                  animate={{ y: [0, 5, 0] }}
                  transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut', repeatDelay: 0.8, delay: 0.4 }}
                >
                  <svg className="w-[15px] h-[15px] text-gray-200" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </motion.div>
              )}
            </div>

            {/* Initial hint pill */}
            <AnimatePresence>
              {showHint && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ duration: 0.3 }}
                  className="absolute inset-x-0 bottom-3 flex justify-center pointer-events-none"
                >
                  <div className="bg-gray-900/80 backdrop-blur-sm text-white text-[11px] font-semibold px-4 py-2 rounded-full flex items-center gap-2">
                    <svg className="w-3.5 h-3.5 opacity-70" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                    </svg>
                    <span>scenes</span>
                    <svg className="w-3.5 h-3.5 opacity-70" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                    <span className="w-px h-3 bg-white/25 mx-0.5" />
                    <svg className="w-3 h-3 opacity-70" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                    </svg>
                    <span>articles</span>
                    <svg className="w-3 h-3 opacity-70" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ── Bottom bar — scene label + count ── */}
          <div
            className="shrink-0 flex items-center justify-between px-4 py-2.5 border-t border-gray-50 bg-white"
            style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px) + 10px, 10px)' }}
          >
            <div className="flex items-center gap-1.5">
              <SceneIcon type={currentScene?.type} className="w-3 h-3 text-gray-300" />
              <span className="text-[10px] font-semibold text-gray-400">{sceneLabel}</span>
            </div>
            <span className="text-[10px] font-medium text-gray-300 tabular-nums">{scene + 1} / {total}</span>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════
          DESKTOP — dot timeline + card
      ══════════════════════════════════════ */}
      <div className="hidden sm:flex flex-col h-full w-full bg-gray-50">

        {/* Top bar */}
        <div className="shrink-0 h-12 bg-white border-b border-gray-100 px-8 flex items-center justify-between">
          <button
            onClick={onClose}
            className="flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-brand-600 transition-colors cursor-pointer group"
          >
            <svg className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            News Cards
          </button>
          <div className="flex items-center gap-3 text-[10px] text-gray-400">
            <span>← → scenes · ↑↓ articles</span>
            {article.ssb_tags?.map(tag => (
              <span key={tag} className="font-semibold px-2 py-0.5 rounded-full bg-brand-50 text-brand-600 border border-brand-100">
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Dot timeline + card */}
        <div className="flex-1 flex items-center justify-center gap-6 overflow-hidden px-8 py-6">

          {/* Vertical scene index */}
          <div className="flex flex-col shrink-0 select-none">
            {article.scenes.map((s, i) => {
              const isActive = i === scene;
              const isDone   = i < scene;
              return (
                <div key={i}>
                  <button
                    onClick={() => goTo(i)}
                    className={`flex items-center gap-3 cursor-pointer group w-full transition-opacity ${
                      isActive ? 'opacity-100' : 'opacity-40 hover:opacity-70'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 flex-1 justify-end">
                      <SceneIcon
                        type={s.type}
                        className={`w-3 h-3 shrink-0 transition-colors ${isActive ? 'text-brand-600' : 'text-gray-500'}`}
                      />
                      <span className={`text-[11px] font-semibold whitespace-nowrap transition-colors ${
                        isActive ? 'text-brand-700' : 'text-gray-600'
                      }`}>
                        {SCENE_LABELS[s.type]}
                      </span>
                    </div>
                    <div className="w-4 flex items-center justify-center shrink-0">
                      <span className={`rounded-full block transition-all duration-200 ${
                        isActive ? 'w-3 h-3 bg-brand-600' : isDone ? 'w-2 h-2 bg-brand-300' : 'w-2 h-2 bg-gray-300 group-hover:bg-gray-400'
                      }`} />
                    </div>
                  </button>
                  {i < total - 1 && (
                    <div className="flex justify-end pr-1.5" style={{ height: 20 }}>
                      <div className={`w-px ${isDone ? 'bg-brand-200' : 'bg-gray-200'}`} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Card */}
          <div className="desktop-reader relative bg-white flex flex-col overflow-hidden rounded-2xl border border-gray-200 shadow-lg max-w-xl w-full h-full">

            {/* Story segments at top of card */}
            <div className="shrink-0 flex gap-[3px] px-3 pt-3">
              {article.scenes.map((_, i) => (
                <button
                  key={i}
                  onClick={() => goTo(i)}
                  className="flex-1 py-2 -my-2 cursor-pointer"
                >
                  <div className="h-[3px] rounded-full overflow-hidden bg-gray-100">
                    <div
                      className="h-full bg-brand-600 transition-all duration-300"
                      style={{ width: i <= scene ? '100%' : '0%' }}
                    />
                  </div>
                </button>
              ))}
            </div>

            {/* Card header */}
            <div className="shrink-0 flex items-center justify-between px-4 py-2.5 border-b border-gray-100">
              <div className="flex items-center gap-1.5">
                <SceneIcon type={currentScene?.type} className="w-3 h-3 text-gray-400" />
                <p className="text-[10px] text-gray-400 font-medium">{sceneLabel}</p>
              </div>
              <p className="text-[10px] text-gray-400 font-medium tabular-nums">{scene + 1} / {total}</p>
              {onClose && (
                <button
                  onClick={onClose}
                  className="flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs bg-gray-100 border-gray-200 text-gray-600 hover:bg-brand-50 hover:border-brand-200 hover:text-brand-600 font-semibold cursor-pointer transition-all"
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Exit
                </button>
              )}
            </div>

            {/* Scene content */}
            <div className="flex-1 overflow-hidden relative">
              <ScenePane variants={desktopVariants} />
            </div>

            {/* Bottom nav */}
            <div className="shrink-0 border-t border-gray-100 px-5 py-3 flex items-center justify-between bg-white">
              <button
                onClick={prev}
                disabled={scene === 0 && !onPrevArticle}
                className="text-xs font-semibold text-brand-600 hover:text-brand-700 disabled:opacity-25 disabled:cursor-not-allowed cursor-pointer transition-colors"
              >
                ← {scene > 0 ? SCENE_LABELS[article.scenes[scene - 1]?.type] : onPrevArticle ? 'Prev article' : 'Prev'}
              </button>
              <p className="text-[10px] text-gray-400 truncate px-3 max-w-[180px] text-center">{article.title}</p>
              <button
                onClick={next}
                disabled={scene === total - 1 && !onNextArticle}
                className="text-xs font-semibold text-brand-600 hover:text-brand-700 disabled:opacity-25 disabled:cursor-not-allowed cursor-pointer transition-colors"
              >
                {scene < total - 1 ? SCENE_LABELS[article.scenes[scene + 1]?.type] : onNextArticle ? 'Next article' : 'Done'} →
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
