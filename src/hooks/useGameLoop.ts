import { useState, useEffect } from 'react';
import type { TouchInfo } from './useMultiTouch';

export type GameState = 'WAITING' | 'READY_TIMER' | 'ROULETTE' | 'FINISHED';

export function useGameLoop(activeTouches: TouchInfo[], mode: 'STANDARD' | 'LARGE_GROUP') {
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
    const physicalCount = activeTouches.filter(t => t.isPhysical).length;
    const stampedCount = activeTouches.filter(t => t.isStamped).length;

    if (mode === 'STANDARD') {
      if (gameState === 'READY_TIMER') {
        const isMissing = lockedIds.some(id => !activeIds.includes(id)) || activeTouches.length < 2;
        
        if (isMissing || activeTouches.length === 0) {
          setGameState('WAITING');
          setLockedIds([]);
          setLockedTouches([]);
          setHighlightedId(null);
          setLoserId(null);
          setTimeLeft(null);
        } else if (activeIds.length > lockedIds.length) {
          setLockedIds(activeIds);
          setLockedTouches([...activeTouches]);
        }
      } else if (gameState === 'WAITING') {
        if (activeTouches.length >= 2) {
          setLockedIds(activeIds);
          setLockedTouches([...activeTouches]);
          setGameState('READY_TIMER');
        }
      }
    } else {
      // LARGE_GROUP Mode
      if (gameState === 'READY_TIMER') {
        if (physicalCount > 0) {
           // Any physical touch breaks the timer back to WAITING so they can stamp
           setGameState('WAITING');
           setLockedIds([]);
           setLockedTouches([]);
           setHighlightedId(null);
           setLoserId(null);
           setTimeLeft(null);
        } else {
           setLockedIds(activeTouches.filter(t => t.isStamped).map(t => t.id));
           setLockedTouches([...activeTouches]);
        }
      } else if (gameState === 'WAITING') {
        if (stampedCount >= 2 && physicalCount === 0) {
           // Everyone let go, minimum 2 stamped fingers
           setLockedIds(activeTouches.filter(t => t.isStamped).map(t => t.id));
           setLockedTouches([...activeTouches]);
           setGameState('READY_TIMER');
        }
      }
    }
  }, [activeIdsStr, gameState, mode]);

  // 2. Ready Timer with Countdown
  useEffect(() => {
    if (gameState === 'READY_TIMER') {
      const waitTime = mode === 'LARGE_GROUP' ? 5 : 3;
      setTimeLeft(waitTime);
      const countdownInterval = setInterval(() => {
        setTimeLeft(prev => (prev !== null && prev > 1 ? prev - 1 : prev));
      }, 750);

      const timer = setTimeout(() => {
        setGameState('ROULETTE');
        setTimeLeft(null);
      }, waitTime * 750 + 250);
      
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
