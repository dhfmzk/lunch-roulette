import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { playTick, playResult } from '../utils/audio';

interface TouchPointProps {
  x: number;
  y: number;
  color: string;
  isHighlighted: boolean;
  isLoser: boolean;
  isStamped?: boolean;
  isLargeGroup?: boolean;
  gameState: 'WAITING' | 'READY_TIMER' | 'ROULETTE' | 'FINISHED';
}

export function TouchPoint({ x, y, color, isHighlighted, isLoser, isStamped, isLargeGroup, gameState }: TouchPointProps) {
  const size = 96; // 6rem

  // Frame-perfect sync: Audio triggers precisely when the visual highlight is rendered!
  useEffect(() => {
    if (gameState === 'ROULETTE' && isHighlighted) {
      playTick();
    }
  }, [gameState, isHighlighted]);

  useEffect(() => {
    if (gameState === 'FINISHED' && isLoser) {
      playResult();
    }
  }, [gameState, isLoser]);

  let opacity = 1;
  let zIndex = 10;
  let glow = '0 0 0px 0px white, 0 0 0px 0px rgba(0,0,0,0)';

  if (gameState === 'WAITING' || gameState === 'READY_TIMER') {
    opacity = 1;
    glow = `0 0 0px 0px white, 0 0 20px 0px ${color}`;
  } else if (gameState === 'ROULETTE') {
    opacity = isHighlighted ? 1 : 0.4;
    zIndex = isHighlighted ? 20 : 10;
    glow = isHighlighted ? `0 0 0px 8px white, 0 0 60px 20px ${color}` : `0 0 0px 0px white, 0 0 0px 0px ${color}`;
  } else if (gameState === 'FINISHED') {
    opacity = isLoser ? 1 : 0;
    zIndex = isLoser ? 30 : 0;
    glow = isLoser ? `0 0 0px 16px white, 0 0 100px 40px ${color}` : `0 0 0px 0px white, 0 0 0px 0px ${color}`;
  }

  const isInstant = gameState === 'ROULETTE';

  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ 
        scale: isStamped ? [1, 1.15, 1] : 1, 
        opacity, 
        x: x - size / 2, 
        y: y - size / 2,
        boxShadow: glow
      }}
      exit={{ scale: 0, opacity: 0 }}
      className={`absolute rounded-full border-4 ${isStamped ? 'border-white/80 shadow-[0_0_20px_rgba(255,255,255,0.4)]' : 'border-transparent'} flex items-center justify-center`}
      transition={{ 
        scale: { type: 'spring', bounce: 0.4 },
        opacity: { duration: isInstant ? 0 : 0.2 },
        left: { type: 'spring', bounce: 0, duration: 0.2 },
        top: { type: 'spring', bounce: 0, duration: 0.2 },
        boxShadow: { duration: isInstant ? 0 : 0.2 }
      }}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: size,
        height: size,
        borderRadius: '50%',
        backgroundColor: color,
        zIndex,
        pointerEvents: 'none'
      }}
    >
      {!isStamped && isLargeGroup && gameState === 'WAITING' && (
        <svg className="absolute overflow-visible pointer-events-none" style={{ width: 130, height: 130 }} viewBox="0 0 100 100">
          <motion.circle
            cx="50"
            cy="50"
            r="44"
            fill="none"
            stroke="white"
            strokeWidth="4"
            className="opacity-70 drop-shadow-md"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 3, ease: "linear" }}
            style={{ rotate: -90, transformOrigin: 'center' }}
          />
        </svg>
      )}
      {(gameState === 'WAITING' || gameState === 'READY_TIMER') && (
        <motion.div
          animate={{ scale: [1, 1.4, 1], opacity: [0.5, 0, 0.5] }}
          transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
          style={{ width: '100%', height: '100%', borderRadius: '50%', border: `4px solid ${color}` }}
        />
      )}
    </motion.div>
  );
}
