import { useState, useEffect, useRef } from 'react';
import type { RefObject } from 'react';

export interface TouchInfo {
  id: number;
  x: number;
  y: number;
  color: string;
  isStamped?: boolean;
  isPhysical?: boolean;
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

export function useMultiTouch(containerRef: RefObject<HTMLElement | null>, mode: 'STANDARD' | 'LARGE_GROUP') {
  const [physicalTouches, setPhysicalTouches] = useState<Map<number, TouchInfo>>(new Map());
  const [stampedTouches, setStampedTouches] = useState<Map<number, TouchInfo>>(new Map());
  const stampTimers = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());

  const stampedRef = useRef(stampedTouches);
  
  useEffect(() => {
    stampedRef.current = stampedTouches;
  }, [stampedTouches]);

  // Clear when mode changes
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPhysicalTouches(new Map());
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setStampedTouches(new Map());
    stampTimers.current.forEach(t => clearTimeout(t));
    stampTimers.current.clear();
  }, [mode]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const getAvailableColor = (currentPhysical: Map<number, TouchInfo>) => {
      const usedPhysical = Array.from(currentPhysical.values()).map(t => t.color);
      const usedStamped = Array.from(stampedRef.current.values()).map(t => t.color);
      const usedColors = [...usedPhysical, ...usedStamped];
      
      const availableColors = COLORS.filter(c => !usedColors.includes(c));
      return availableColors.length > 0 
        ? availableColors[Math.floor(Math.random() * availableColors.length)]
        : COLORS[Math.floor(Math.random() * COLORS.length)];
    };

    const handleTouchStart = (e: TouchEvent) => {
      if ((e.target as HTMLElement).closest('button')) return;
      e.preventDefault();
      setPhysicalTouches(prev => {
        const next = new Map(prev);
        for (let i = 0; i < e.changedTouches.length; i++) {
          const touch = e.changedTouches[i];
          if (!next.has(touch.identifier)) {
            const tInfo = {
              id: touch.identifier,
              x: touch.clientX,
              y: touch.clientY,
              color: getAvailableColor(next),
              isPhysical: true,
            };
            next.set(touch.identifier, tInfo);

            if (mode === 'LARGE_GROUP') {
              const timer = setTimeout(() => {
                setStampedTouches(s => {
                  const ns = new Map(s);
                  ns.set(touch.identifier, { ...tInfo, isStamped: true, isPhysical: false });
                  return ns;
                });
              }, 1000);
              stampTimers.current.set(touch.identifier, timer);
            }
          }
        }
        return next;
      });
    };

    const handleTouchMove = (e: TouchEvent) => {
      if ((e.target as HTMLElement).closest('button')) return;
      e.preventDefault();
      setPhysicalTouches(prev => {
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
      if ((e.target as HTMLElement).closest('button')) return;
      e.preventDefault();
      setPhysicalTouches(prev => {
        const next = new Map(prev);
        for (let i = 0; i < e.changedTouches.length; i++) {
          const id = e.changedTouches[i].identifier;
          next.delete(id);
          if (stampTimers.current.has(id)) {
            clearTimeout(stampTimers.current.get(id)!);
            stampTimers.current.delete(id);
          }
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
  }, [containerRef, mode]);

  const combined = new Map<number, TouchInfo>();
  stampedTouches.forEach((v, k) => combined.set(k, v));
  physicalTouches.forEach((v, k) => {
    if (combined.has(k)) {
      combined.set(k, { ...v, isStamped: true });
    } else {
      combined.set(k, v);
    }
  });

  return { activeTouches: Array.from(combined.values()), clearStamped: () => setStampedTouches(new Map()) };
}
