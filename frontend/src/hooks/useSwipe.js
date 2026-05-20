import { useRef, useEffect } from 'react';

export function useSwipe({
  onSwipeUp, onSwipeDown,
  onSwipeLeft, onSwipeRight,
  threshold = 80,
  elementRef,
}) {
  const startX        = useRef(null);
  const startY        = useRef(null);
  const committed     = useRef(null);   // 'h' | 'v' | null
  const isScrolling   = useRef(false);

  const upRef    = useRef(onSwipeUp);
  const downRef  = useRef(onSwipeDown);
  const leftRef  = useRef(onSwipeLeft);
  const rightRef = useRef(onSwipeRight);

  useEffect(() => { upRef.current    = onSwipeUp;    });
  useEffect(() => { downRef.current  = onSwipeDown;  });
  useEffect(() => { leftRef.current  = onSwipeLeft;  });
  useEffect(() => { rightRef.current = onSwipeRight; });

  useEffect(() => {
    const el = elementRef?.current;
    if (!el) return;

    const handleStart = (e) => {
      startX.current    = e.touches[0].clientX;
      startY.current    = e.touches[0].clientY;
      committed.current = null;
      isScrolling.current = false;
    };

    const handleMove = (e) => {
      if (startX.current === null || startY.current === null) return;

      const dx = e.touches[0].clientX - startX.current;
      const dy = e.touches[0].clientY - startY.current;

      // Commit to a direction once we have 8px of movement
      if (!committed.current) {
        if (Math.abs(dx) > 8 || Math.abs(dy) > 8) {
          committed.current = Math.abs(dx) > Math.abs(dy) ? 'h' : 'v';
        } else {
          return; // not enough movement yet
        }
      }

      if (committed.current === 'h') {
        // Horizontal — block any accidental horizontal browser scroll
        e.preventDefault();
        return;
      }

      // Vertical — check for scrollable content (existing logic)
      if (isScrolling.current) return;

      let node = e.target;
      while (node && node !== el) {
        if (node.scrollHeight > node.clientHeight + 2) {
          const atTop    = node.scrollTop <= 0;
          const atBottom = node.scrollTop >= node.scrollHeight - node.clientHeight - 2;
          if (!(atTop && dy > 0) && !(atBottom && dy < 0)) {
            isScrolling.current = true;
            return;
          }
          break;
        }
        node = node.parentElement;
      }

      // No scrollable content blocking — prevent pull-to-refresh
      e.preventDefault();
    };

    const handleEnd = (e) => {
      if (startX.current === null || startY.current === null) return;

      const dx = e.changedTouches[0].clientX - startX.current;
      const dy = e.changedTouches[0].clientY - startY.current;

      if (committed.current === 'h') {
        if (dx < -threshold)      leftRef.current?.();
        else if (dx > threshold)  rightRef.current?.();
      } else if (committed.current === 'v' && !isScrolling.current) {
        if (dy < -threshold)      upRef.current?.();
        else if (dy > threshold)  downRef.current?.();
      }

      startX.current      = null;
      startY.current      = null;
      committed.current   = null;
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
