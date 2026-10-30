import { useState, useEffect } from 'react';
import { MapPin, ChevronUp, Check, X } from 'lucide-react';
import { trackEvent } from '../analytics';

// "You are here" for the long home page.
//
// Wide screens (xl and up, where the page has empty margins): a vertical line
// on the left with a dot and label for each section. It fills as you scroll,
// the current section is highlighted, and every label jumps to its section.
//
// Phones and tablets: no room beside the content, so a thin reading-progress
// bar under the header, and — once past the top of the page — a small pill
// above the tab bar naming the current section. Tapping it lists every
// section to jump to. (A line down the left edge read as a glitch on phones.)
//
// sections: [{ id, label }] in page order. Sections that render nothing (a
// block with no data yet) are skipped.

const NAV_OFFSET = 64;   // sticky header height plus a little air

export default function HomeRail({ sections }) {
  const [present, setPresent] = useState(sections);
  // Some blocks (community, mentors) fill in after their data loads, so which
  // sections exist is re-checked on every update rather than once.
  const exists = s => document.getElementById(s.id)?.offsetHeight > 0;
  const [active, setActive] = useState(sections[0]?.id);
  const [progress, setProgress] = useState(0);
  const [sheet, setSheet] = useState(false);

  useEffect(() => {
    let raf = 0;
    function update() {
      raf = 0;
      const doc = document.documentElement;
      const max = doc.scrollHeight - window.innerHeight;
      setProgress(max > 0 ? Math.min(1, window.scrollY / max) : 0);
      // The current section is the last one whose top has passed a line a
      // third of the way down the screen
      const line = window.innerHeight / 3;
      let current = present[0]?.id;
      for (const s of present) {
        const el = document.getElementById(s.id);
        if (el && el.getBoundingClientRect().top <= line) current = s.id;
      }
      setActive(current);
      const now = sections.filter(exists);
      setPresent(prev => (prev.length === now.length && prev.every((s, i) => s.id === now[i].id) ? prev : now));
    }
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update); };
    update();
    // Blocks that fill in after their data loads change the page's height
    const ro = new ResizeObserver(onScroll);
    ro.observe(document.body);
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => { ro.disconnect(); window.removeEventListener('scroll', onScroll); window.removeEventListener('resize', onScroll); cancelAnimationFrame(raf); };
  }, [present, sections]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!sheet) return;
    const onKey = e => { if (e.key === 'Escape') setSheet(false); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [sheet]);

  function go(id) {
    setSheet(false);
    const el = document.getElementById(id);
    if (!el) return;
    window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - NAV_OFFSET, behavior: 'smooth' });
    trackEvent('home_rail', { to: id });
  }

  if (present.length < 2) return null;
  const activeIndex = Math.max(0, present.findIndex(s => s.id === active));

  return (
    <>
      {/* Wide screens: labelled rail in the left margin */}
      <nav aria-label="On this page"
        className="hidden xl:block fixed left-6 2xl:left-10 top-1/2 -translate-y-1/2 z-30 w-36">
        <div className="relative pl-5">
          <span className="absolute left-[5px] top-1.5 bottom-1.5 w-0.5 bg-gray-200 rounded-full" aria-hidden="true" />
          <span className="absolute left-[5px] top-1.5 w-0.5 bg-brand-600 rounded-full transition-all duration-300" aria-hidden="true"
            style={{ height: `calc(${present.length > 1 ? activeIndex / (present.length - 1) : 0} * (100% - 12px))` }} />
          <ol className="space-y-3.5">
            {present.map((s, i) => {
              const on = s.id === active;
              const passed = i < activeIndex;
              return (
                <li key={s.id} className="relative">
                  <span className={`absolute -left-5 top-1/2 -translate-y-1/2 rounded-full border-2 transition-all ${on
                    ? 'w-3 h-3 bg-brand-600 border-brand-600 ring-4 ring-brand-100'
                    : passed ? 'w-3 h-3 bg-brand-600 border-brand-600' : 'w-3 h-3 bg-white border-gray-300'}`} aria-hidden="true" />
                  <button type="button" onClick={() => go(s.id)} aria-current={on ? 'true' : undefined}
                    className={`text-left text-[13px] leading-tight cursor-pointer transition-colors ${on ? 'font-bold text-gray-900' : 'text-gray-400 hover:text-gray-700'}`}>
                    {s.label}
                  </button>
                </li>
              );
            })}
          </ol>
        </div>
      </nav>

      {/* Phones and tablets: reading progress under the header */}
      <div className="xl:hidden fixed inset-x-0 top-14 h-[3px] z-40 pointer-events-none" aria-hidden="true">
        <div className="h-full bg-brand-600 rounded-r-full transition-[width] duration-150" style={{ width: `${progress * 100}%` }} />
      </div>

      {/* …and a "where am I" pill above the tab bar, once past the top */}
      {activeIndex > 0 && !sheet && (
        <button type="button" onClick={() => { setSheet(true); trackEvent('home_rail_open'); }}
          className="xl:hidden fixed left-1/2 -translate-x-1/2 bottom-[calc(4.75rem+env(safe-area-inset-bottom))] md:bottom-5 z-40 inline-flex items-center gap-1.5 bg-white/95 backdrop-blur border border-gray-200 shadow-lg rounded-full pl-3 pr-2.5 py-2 text-xs font-semibold text-gray-800 cursor-pointer">
          <MapPin className="w-3.5 h-3.5 text-brand-600" />
          {present[activeIndex]?.label}
          <span className="text-gray-400 tabular-nums font-medium">{activeIndex + 1}/{present.length}</span>
          <ChevronUp className="w-3.5 h-3.5 text-gray-400" />
        </button>
      )}

      {sheet && (
        <div className="xl:hidden fixed inset-0 z-[58] bg-black/30" onClick={() => setSheet(false)}>
          <div role="dialog" aria-modal="true" aria-label="On this page" onClick={e => e.stopPropagation()}
            className="absolute inset-x-0 bottom-0 bg-white rounded-t-3xl shadow-2xl px-4 pt-3"
            style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))' }}>
            <div className="mx-auto w-10 h-1 rounded-full bg-gray-200" />
            <div className="flex items-center justify-between mt-3 mb-2 px-1">
              <p className="text-base font-bold text-gray-900">On this page</p>
              <button type="button" onClick={() => setSheet(false)} aria-label="Close"
                className="w-10 h-10 -mr-2 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-100 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <ol>
              {present.map((s, i) => {
                const on = i === activeIndex;
                const passed = i < activeIndex;
                return (
                  <li key={s.id}>
                    <button type="button" onClick={() => go(s.id)} aria-current={on ? 'true' : undefined}
                      className={`w-full flex items-center gap-3 px-3 min-h-[48px] rounded-xl text-left cursor-pointer ${on ? 'bg-brand-50' : 'active:bg-gray-50'}`}>
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 ${on
                        ? 'bg-brand-600 text-white' : passed ? 'bg-brand-100 text-brand-700' : 'bg-gray-100 text-gray-500'}`}>
                        {passed ? <Check className="w-3.5 h-3.5" strokeWidth={3} /> : i + 1}
                      </span>
                      <span className={`text-[15px] ${on ? 'font-bold text-gray-900' : 'text-gray-700'}`}>{s.label}</span>
                      {on && <span className="ml-auto text-xs font-semibold text-brand-700">You are here</span>}
                    </button>
                  </li>
                );
              })}
            </ol>
          </div>
        </div>
      )}
    </>
  );
}
