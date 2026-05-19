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
      // Prevent pull-to-refresh and page scroll while a swipe is in progress
      if (startY.current !== null) e.preventDefault();
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
