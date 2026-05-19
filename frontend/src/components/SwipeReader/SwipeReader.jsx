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

const SCENE_ICONS = {
  hook:            '🎯',
  concept:         '💡',
  breakdown:       '🔍',
  two_sides:       '⚖️',
  context:         '🌐',
  ssb_application: '🎖️',
  quiz:            '✅',
};

// Mobile: vertical swipe (y-axis)
const mobileVariants = {
  enter:  (dir) => ({ y: dir > 0 ? 48 : -48, opacity: 0 }),
  center: { y: 0, opacity: 1 },
  exit:   (dir) => ({ y: dir > 0 ? -48 : 48, opacity: 0 }),
};

// Desktop: horizontal slide
const desktopVariants = {
  enter:  (dir) => ({ x: dir > 0 ? 40 : -40, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit:   (dir) => ({ x: dir > 0 ? -40 : 40, opacity: 0 }),
};

const PILLAR_COLORS = {
  defence:        'bg-brand-50 text-brand-600',
  economic:       'bg-brand-50 text-brand-600',
  polity:         'bg-brand-50 text-brand-600',
  geographic:     'bg-brand-50 text-brand-600',
  'socio-cultural': 'bg-brand-50 text-brand-600',
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

  // Mobile swipe
  const containerRef = useRef(null);
  useSwipe({ onSwipeUp: next, onSwipeDown: prev, elementRef: containerRef });

  const currentScene = article.scenes[scene];
  const sceneLabel   = SCENE_LABELS[currentScene?.type] || '';
  const sceneIcon    = SCENE_ICONS[currentScene?.type]  || '📄';
  const pct          = ((scene + 1) / total) * 100;

  return (
    <>
      {/* ═══════════════════════════════════════
          MOBILE — full-screen swipe card
      ═══════════════════════════════════════ */}
      <div className="sm:hidden flex items-center gap-3 w-full h-full">
        <div
          ref={containerRef}
          className="swipe-reader relative bg-white flex flex-col overflow-hidden w-full"
        >
          {/* Progress bar */}
          <div className="shrink-0">
            <div className="h-0.5 bg-gray-100">
              <div className="h-full bg-brand-600 transition-all duration-300 ease-out" style={{ width: `${pct}%` }} />
            </div>
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100">
              <div className="flex items-center gap-1">
                {article.scenes.map((_, i) => (
                  <button key={i}
                    onClick={() => goTo(i)}
                    className={`rounded-full transition-all duration-200 cursor-pointer ${
                      i === scene ? 'w-4 h-1.5 bg-brand-600' : 'w-1.5 h-1.5 bg-gray-200'
                    }`}
                  />
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
              <motion.div
                key={scene}
                custom={dir}
                variants={mobileVariants}
                initial="enter" animate="center" exit="exit"
                transition={{ duration: 0.25, ease: 'easeOut' }}
                className="absolute inset-0 overflow-hidden"
              >
                <div className="h-full overflow-y-auto">
                  <SceneRenderer scene={currentScene} article={article} />
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Swipe hint */}
            <AnimatePresence>
              {showHint && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }} transition={{ duration: 0.3 }}
                  className="absolute inset-x-0 bottom-4 flex justify-center pointer-events-none"
                >
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
              className="flex items-center gap-1 text-xs font-semibold transition-colors disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed text-brand-600">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              Prev
            </button>
            <p className="text-[10px] text-gray-400 font-medium text-center truncate px-2">{article.title}</p>
            <button onClick={next} disabled={scene === total - 1}
              className="flex items-center gap-1 text-xs font-semibold transition-colors disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed text-brand-600">
              Next
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════
          DESKTOP — sidebar + reading panel
      ═══════════════════════════════════════ */}
      <div className="hidden sm:flex h-full w-full bg-white">

        {/* ── Left sidebar ── */}
        <aside className="w-64 shrink-0 border-r border-gray-100 flex flex-col h-full bg-white">

          {/* Brand header */}
          <div className="px-5 py-4 border-b border-gray-100 shrink-0">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <svg viewBox="0 0 48 48" fill="none" className="w-6 h-6 shrink-0">
                  <circle cx="24" cy="24" r="22" stroke="#1e3a5f" strokeWidth="3" />
                  <circle cx="14" cy="20" r="3.5" fill="#1e3a5f" />
                  <circle cx="24" cy="14" r="3.5" fill="#1e3a5f" />
                  <circle cx="34" cy="20" r="3.5" fill="#1e3a5f" />
                  <circle cx="30" cy="31" r="3.5" fill="#1e3a5f" />
                  <circle cx="18" cy="31" r="3.5" fill="#1e3a5f" />
                  <path d="M14 20 L24 14 L34 20 L30 31 L18 31 Z" stroke="#1e3a5f" strokeWidth="1.5" fill="none" />
                </svg>
                <span className="text-xs font-bold text-gray-700 tracking-tight">News Cards</span>
              </div>
              {onClose && (
                <button onClick={onClose} className="text-gray-300 hover:text-gray-600 transition-colors cursor-pointer">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>

            <h2 className="text-sm font-bold text-gray-900 leading-snug mb-2">{article.title}</h2>

            <div className="flex flex-wrap gap-1.5">
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-brand-50 text-brand-600 border border-brand-100 capitalize">
                {article.category}
              </span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
                {article.reading_time} min · {article.difficulty}
              </span>
            </div>
          </div>

          {/* Scene list */}
          <nav className="flex-1 overflow-y-auto py-3 px-3">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-2 mb-2">Scenes</p>
            {article.scenes.map((s, i) => {
              const isActive = i === scene;
              const isDone   = i < scene;
              return (
                <button
                  key={i}
                  onClick={() => goTo(i)}
                  className={`w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-xl mb-0.5 transition-all cursor-pointer ${
                    isActive ? 'bg-brand-600 text-white shadow-sm' : isDone ? 'text-gray-400 hover:bg-gray-50' : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <span className={`w-6 h-6 rounded-full text-[10px] font-bold flex items-center justify-center shrink-0 transition-all ${
                    isActive ? 'bg-white/20 text-white' : isDone ? 'bg-gray-100 text-gray-400' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {isDone ? (
                      <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    ) : i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <span className={`text-xs font-semibold block truncate ${isActive ? 'text-white' : ''}`}>
                      {SCENE_LABELS[s.type]}
                    </span>
                  </div>
                  <span className="text-sm shrink-0">{SCENE_ICONS[s.type]}</span>
                </button>
              );
            })}
          </nav>

          {/* Progress footer */}
          <div className="px-5 py-4 border-t border-gray-100 shrink-0">
            <div className="flex justify-between text-[11px] text-gray-400 mb-2">
              <span>{scene + 1} of {total} scenes</span>
              <span className="font-semibold text-brand-600">{Math.round(pct)}%</span>
            </div>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-brand-600 rounded-full transition-all duration-300" style={{ width: `${pct}%` }} />
            </div>
            <p className="text-[10px] text-gray-400 mt-2 text-center">← → arrow keys to navigate</p>
          </div>
        </aside>

        {/* ── Right content panel ── */}
        <div className="flex-1 flex flex-col h-full min-w-0 bg-gray-50">

          {/* Content header */}
          <div className="shrink-0 h-14 bg-white border-b border-gray-100 px-8 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-lg">{sceneIcon}</span>
              <span className="text-sm font-bold text-gray-700">{sceneLabel}</span>
              <span className="text-[10px] text-gray-400 font-medium">{scene + 1}/{total}</span>
            </div>
            <div className="flex items-center gap-2">
              {article.ssb_tags?.map(tag => (
                <span key={tag} className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-brand-50 text-brand-600 border border-brand-100">
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Scene content — scrollable */}
          <div className="flex-1 overflow-y-auto relative">
            <AnimatePresence mode="wait" custom={dir}>
              <motion.div
                key={scene}
                custom={dir}
                variants={desktopVariants}
                initial="enter" animate="center" exit="exit"
                transition={{ duration: 0.2, ease: 'easeOut' }}
                className="absolute inset-0 overflow-y-auto"
              >
                <div className="max-w-2xl mx-auto px-8 py-8">
                  <SceneRenderer scene={currentScene} article={article} />
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Content footer */}
          <div className="shrink-0 h-14 bg-white border-t border-gray-100 px-8 flex items-center justify-between">
            <button
              onClick={prev} disabled={scene === 0}
              className="flex items-center gap-2 text-sm font-semibold text-brand-600 hover:text-brand-700 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              {scene > 0 ? SCENE_LABELS[article.scenes[scene - 1]?.type] : 'Previous'}
            </button>

            {/* Dot row */}
            <div className="flex items-center gap-1">
              {article.scenes.map((_, i) => (
                <button key={i} onClick={() => goTo(i)}
                  className={`rounded-full transition-all duration-200 cursor-pointer ${
                    i === scene ? 'w-4 h-1.5 bg-brand-600' : 'w-1.5 h-1.5 bg-gray-200 hover:bg-gray-300'
                  }`}
                />
              ))}
            </div>

            <button
              onClick={next} disabled={scene === total - 1}
              className="flex items-center gap-2 text-sm font-semibold text-brand-600 hover:text-brand-700 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
            >
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
