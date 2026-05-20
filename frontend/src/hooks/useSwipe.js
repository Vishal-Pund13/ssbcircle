import { useRef, useEffect } from 'react';

export function useSwipe({ onSwipeUp, onSwipeDown, threshold = 80, elementRef }) {
  const startY        = useRef(null);
  const isScrolling   = useRef(false);   // true once committed to native scroll
  const swipeUpRef    = useRef(onSwipeUp);
  const swipeDownRef  = useRef(onSwipeDown);

  useEffect(() => { swipeUpRef.current   = onSwipeUp;   });
  useEffect(() => { swipeDownRef.current = onSwipeDown; });

  useEffect(() => {
    const el = elementRef?.current;
    if (!el) return;

    const handleStart = (e) => {
      startY.current      = e.touches[0].clientY;
      isScrolling.current = false;
    };

    const handleMove = (e) => {
      if (startY.current === null) return;

      // Once committed to scroll, never block it
      if (isScrolling.current) return;

      const deltaY = startY.current - e.touches[0].clientY;

      // Walk up from touch target looking for a scrollable ancestor inside the reader
      let node = e.target;
      while (node && node !== el) {
        if (node.scrollHeight > node.clientHeight + 2) {
          const atTop    = node.scrollTop <= 0;
          const atBottom = node.scrollTop >= node.scrollHeight - node.clientHeight - 2;

          // Content can scroll in this direction — commit to scroll, never navigate
          if (!(atTop && deltaY < 0) && !(atBottom && deltaY > 0)) {
            isScrolling.current = true;
            return;
          }
          break; // at boundary → fall through to swipe navigation
        }
        node = node.parentElement;
      }

      // No scrollable content (or at scroll boundary) — block pull-to-refresh
      e.preventDefault();
    };

    const handleEnd = (e) => {
      if (startY.current === null) return;

      // Skip navigation entirely if the gesture was a content scroll
      if (!isScrolling.current) {
        const delta = startY.current - e.changedTouches[0].clientY;
        if (delta > threshold)       swipeUpRef.current?.();
        else if (delta < -threshold) swipeDownRef.current?.();
      }

      startY.current      = null;
      isScrolling.current = false;
    };

    el.addEventListener('touchstart', handleStart, { passive: true });
    el.addEventListener('touchmove',  handleMove,  { passive: false });
    el.addEventListener('touchend',   handleEnd,   { passive: true });

    return () => {
      el.removeEventListener('touchstart', handleStart);
      el.removeEventListener('touchmove',  handleMove);
      el.removeEventListener('touchend',   handleEnd);
    };
  }, [threshold, elementRef]);
}
