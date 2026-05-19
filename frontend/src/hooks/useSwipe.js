import { useRef, useEffect } from 'react';

export function useSwipe({ onSwipeUp, onSwipeDown, threshold = 50, elementRef }) {
  const startY       = useRef(null);
  const swipeUpRef   = useRef(onSwipeUp);
  const swipeDownRef = useRef(onSwipeDown);

  useEffect(() => { swipeUpRef.current   = onSwipeUp;   });
  useEffect(() => { swipeDownRef.current = onSwipeDown; });

  useEffect(() => {
    const el = elementRef?.current;
    if (!el) return;

    const handleStart = (e) => {
      startY.current = e.touches[0].clientY;
    };

    const handleMove = (e) => {
      if (startY.current === null) return;

      const deltaY = startY.current - e.touches[0].clientY;

      // Walk up from the touch target to find a scrollable ancestor within the reader
      let node = e.target;
      while (node && node !== el) {
        if (node.scrollHeight > node.clientHeight + 2) {
          const atTop    = node.scrollTop <= 0;
          const atBottom = node.scrollTop >= node.scrollHeight - node.clientHeight - 2;
          // Allow native scroll unless we're already at the boundary in the swipe direction
          if (!(atTop && deltaY < 0) && !(atBottom && deltaY > 0)) return;
          break;
        }
        node = node.parentElement;
      }

      // No scrollable content in swipe direction — block pull-to-refresh / page scroll
      e.preventDefault();
    };

    const handleEnd = (e) => {
      if (startY.current === null) return;
      const delta = startY.current - e.changedTouches[0].clientY;
      if (delta > threshold)       swipeUpRef.current?.();
      else if (delta < -threshold) swipeDownRef.current?.();
      startY.current = null;
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
