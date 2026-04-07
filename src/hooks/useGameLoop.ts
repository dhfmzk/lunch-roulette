import { useState, useEffect } from 'react';
import type { TouchInfo } from './useMultiTouch';

export type GameState = 'WAITING' | 'READY_TIMER' | 'ROULETTE' | 'FINISHED';

export function useGameLoop(activeTouches: TouchInfo[]) {
  const [gameState, setGameState] = useState<GameState>('WAITING');
  const [lockedIds, setLockedIds] = useState<number[]>([]);
  const [lockedTouches, setLockedTouches] = useState<TouchInfo[]>([]);
  const [highlightedId, setHighlightedId] = useState<number | null>(null);
  const [loserId, setLoserId] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  
  const activeIds = activeTouches.map(t => t.id);
  const activeIdsStr = activeIds.sort().join(',');

  // 1. Abort logic or Start
  useEffect(() => {
    if (gameState === 'READY_TIMER') {
      const isMissing = lockedIds.some(id => !activeIds.includes(id)) || activeTouches.length < 2;
      
      if (isMissing || activeTouches.length === 0) {
        setGameState('WAITING');
        setLockedIds([]);
        setLockedTouches([]);
        setHighlightedId(null);
        setLoserId(null);
        setTimeLeft(null);
      }
    } else if (gameState === 'WAITING') {
      if (activeTouches.length >= 2) {
        setLockedIds(activeIds);
        setLockedTouches([...activeTouches]);
        setGameState('READY_TIMER');
      }
    }
    // Once in ROULETTE or FINISHED, releasing fingers no longer aborts the sequence.
  }, [activeIdsStr, gameState]);

  // 2. Ready Timer with Countdown
  useEffect(() => {
    if (gameState === 'READY_TIMER') {
      setTimeLeft(3);
      const countdownInterval = setInterval(() => {
        setTimeLeft(prev => (prev !== null && prev > 1 ? prev - 1 : prev));
      }, 750);

      const timer = setTimeout(() => {
        setGameState('ROULETTE');
        setTimeLeft(null);
      }, 2500);
      
      return () => {
        clearInterval(countdownInterval);
        clearTimeout(timer);
      };
    } else {
      setTimeLeft(null);
    }
  }, [gameState, activeIdsStr]);

  // 3. Roulette Animation
  useEffect(() => {
    if (gameState === 'ROULETTE') {
      let ticks = 0;
      const maxTicks = 20;
      const baseDelay = 50;
      let localTimer: ReturnType<typeof setTimeout>;
      let previousId: number | null = null;

      // Ensure every ID is visited at least once initially
      const initialSequence = [...lockedIds].sort(() => Math.random() - 0.5);

      const runTick = () => {
        if (ticks >= maxTicks) {
           const survivor = lockedIds[Math.floor(Math.random() * lockedIds.length)];
           setLoserId(survivor);
           setHighlightedId(null);
           setGameState('FINISHED');
           return;
        }
        
        let randomId;
        if (ticks < initialSequence.length) {
          // Play sequence ensuring all are seen at least once
          randomId = initialSequence[ticks];
        } else {
          // Completely random, but prefer avoiding same color twice in a row visually
          do {
            randomId = lockedIds[Math.floor(Math.random() * lockedIds.length)];
          } while (lockedIds.length > 1 && randomId === previousId);
        }
        
        previousId = randomId;
        setHighlightedId(randomId);
        
        ticks++;
        localTimer = setTimeout(runTick, baseDelay + (ticks * 15));
      };

      runTick();
      return () => clearTimeout(localTimer);
    }
  }, [gameState, lockedIds]);

  return { gameState, highlightedId, loserId, timeLeft, lockedTouches };
}
