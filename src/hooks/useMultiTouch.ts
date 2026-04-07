import { useState, useEffect } from 'react';
import type { RefObject } from 'react';

export interface TouchInfo {
  id: number;
  x: number;
  y: number;
  color: string;
}

const COLORS = [
  '#ef4444', // red-500
  '#3b82f6', // blue-500
  '#22c55e', // green-500
  '#eab308', // yellow-500
  '#a855f7', // purple-500
  '#ec4899', // pink-500
  '#06b6d4', // cyan-500
  '#f97316', // orange-500
  '#84cc16', // lime-500
  '#6366f1', // indigo-500
];

export function useMultiTouch(containerRef: RefObject<HTMLElement | null>) {
  const [touches, setTouches] = useState<Map<number, TouchInfo>>(new Map());

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const getAvailableColor = (currentTouches: Map<number, TouchInfo>) => {
      const usedColors = Array.from(currentTouches.values()).map(t => t.color);
      const availableColors = COLORS.filter(c => !usedColors.includes(c));
      return availableColors.length > 0 
        ? availableColors[Math.floor(Math.random() * availableColors.length)]
        : COLORS[Math.floor(Math.random() * COLORS.length)];
    };

    const handleTouchStart = (e: TouchEvent) => {
      e.preventDefault();
      setTouches(prev => {
        const next = new Map(prev);
        for (let i = 0; i < e.changedTouches.length; i++) {
          const touch = e.changedTouches[i];
          if (!next.has(touch.identifier)) {
            next.set(touch.identifier, {
              id: touch.identifier,
              x: touch.clientX,
              y: touch.clientY,
              color: getAvailableColor(next),
            });
          }
        }
        return next;
      });
    };

    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      setTouches(prev => {
        const next = new Map(prev);
        for (let i = 0; i < e.changedTouches.length; i++) {
          const touch = e.changedTouches[i];
          if (next.has(touch.identifier)) {
            const existing = next.get(touch.identifier)!;
            next.set(touch.identifier, { ...existing, x: touch.clientX, y: touch.clientY });
          }
        }
        return next;
      });
    };

    const handleTouchEnd = (e: TouchEvent) => {
      e.preventDefault();
      setTouches(prev => {
        const next = new Map(prev);
        for (let i = 0; i < e.changedTouches.length; i++) {
          next.delete(e.changedTouches[i].identifier);
        }
        return next;
      });
    };

    container.addEventListener('touchstart', handleTouchStart, { passive: false });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd, { passive: false });
    container.addEventListener('touchcancel', handleTouchEnd, { passive: false });

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
      container.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, [containerRef]);

  return Array.from(touches.values());
}
