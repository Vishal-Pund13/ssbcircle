import { useRef } from 'react';

export function useSwipe({ onSwipeUp, onSwipeDown, threshold = 50 }) {
  const startY = useRef(null);

  const onTouchStart = (e) => {
    startY.current = e.touches[0].clientY;
  };

  const onTouchEnd = (e) => {
    if (startY.current === null) return;
    const delta = startY.current - e.changedTouches[0].clientY;
    if (delta > threshold) onSwipeUp?.();
    else if (delta < -threshold) onSwipeDown?.();
    startY.current = null;
  };

  return { onTouchStart, onTouchEnd };
}
