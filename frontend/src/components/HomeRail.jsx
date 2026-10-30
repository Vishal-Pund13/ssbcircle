import { useState, useEffect, useRef } from 'react';
import { trackEvent } from '../analytics';

// "You are here" for the long home page.
//
// Wide screens (xl and up, where the page has empty margins): a vertical line
// on the left with a dot and label for each section. It fills as you scroll,
// the current section is highlighted, and every label jumps to its section.
//
// Phones and tablets: no room for labels beside the content, so a thin
// progress line on the left edge, and the section's name shown briefly as you
// scroll into it.
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
  const [flash, setFlash] = useState(null);
  const flashTimer = useRef(null);
  const first = useRef(true);

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

  // Phones: name the section for a moment when you enter it
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    const s = present.find(x => x.id === active);
    if (!s) return;
    setFlash(s.label);
    clearTimeout(flashTimer.current);
    flashTimer.current = setTimeout(() => setFlash(null), 1400);
  }, [active]); // eslint-disable-line react-hooks/exhaustive-deps

  function go(id) {
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

      {/* Phones and tablets: thin progress line on the left edge */}
      <div className="xl:hidden fixed left-0 top-14 bottom-0 w-[3px] z-30 pointer-events-none" aria-hidden="true">
        <div className="absolute inset-x-0 top-0 bg-brand-600/80 rounded-b-full transition-[height] duration-150" style={{ height: `${progress * 100}%` }} />
      </div>
      <div aria-live="polite"
        className={`xl:hidden fixed left-2 top-16 z-30 pointer-events-none text-[11px] font-semibold text-white bg-brand-600/90 px-2.5 py-1 rounded-full shadow transition-opacity duration-300 ${flash ? 'opacity-100' : 'opacity-0'}`}>
        {flash || present[activeIndex]?.label}
      </div>
    </>
  );
}
