import { useRef, useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'framer-motion';
import { useMultiTouch } from './hooks/useMultiTouch';
import { useGameLoop } from './hooks/useGameLoop';
import { TouchPoint } from './components/TouchPoint';
import { initAudio } from './utils/audio';

const COLOR_NAMES: Record<string, string> = {
  '#ef4444': '빨강',
  '#3b82f6': '파랑',
  '#22c55e': '초록',
  '#eab308': '노랑',
  '#a855f7': '보라',
  '#ec4899': '분홍',
  '#06b6d4': '청록',
  '#f97316': '주황',
  '#84cc16': '연두',
  '#6366f1': '남색',
};

function App() {
  const containerRef = useRef<HTMLDivElement>(null);
  const activeTouches = useMultiTouch(containerRef);
  const { gameState, highlightedId, loserId, timeLeft, lockedTouches } = useGameLoop(activeTouches);
  const [simCount, setSimCount] = useState<number>(2);

  useEffect(() => {
    if (gameState === 'FINISHED') {
      confetti({
        particleCount: 200,
        spread: 100,
        scalar: 2.0, // Much larger confetti particles
        origin: { y: 0.6 },
        colors: ['#ef4444', '#3b82f6', '#22c55e', '#eab308', '#a855f7'],
        zIndex: 200,
        disableForReducedMotion: true
      });
    }
  }, [gameState]);

  // During WAITING and READY_TIMER use activeTouches, otherwise use lockedTouches so circles stay on screen
  const displayTouches = (gameState === 'WAITING' || gameState === 'READY_TIMER') ? activeTouches : lockedTouches;
  const loserTouch = displayTouches.find(t => t.id === loserId);

  return (
    <div 
      ref={containerRef}
      onPointerDown={() => initAudio()}
      className="w-full h-full bg-slate-900 relative overflow-hidden flex items-center justify-center select-none"
      style={{ touchAction: 'none' }}
    >
      {gameState === 'WAITING' && activeTouches.length === 0 && (
        <div className="pointer-events-none text-center transform transition-opacity duration-500 opacity-100">
          <h1 className="text-4xl text-white font-extrabold tracking-widest text-shadow-md uppercase">
            lunch-roulette
          </h1>
          <p className="text-slate-400 mt-4 text-sm font-medium px-8 opacity-80">
            손가락을 2개 이상 올리고 기다리면 게임이 시작됩니다.
          </p>
        </div>
      )}

      {/* Winning Text */}
      <AnimatePresence>
        {gameState === 'FINISHED' && loserTouch && (
          <motion.div 
            initial={{ scale: 0.5, opacity: 0, y: 50 }}
            animate={{ scale: 1, opacity: 1, y: -200 }}
            className="absolute z-50 flex flex-col items-center justify-center pointer-events-none"
          >
            <div className="text-5xl font-black text-white mix-blend-overlay drop-shadow-[0_0_20px_rgba(0,0,0,0.8)] tracking-tighter text-center">
              <div>
                <span style={{ color: loserTouch.color, textShadow: '0 0 20px #000' }}>
                  {COLOR_NAMES[loserTouch.color] || ''}
                </span>
                <span> 당첨!</span>
              </div>
              <p className="text-sm font-medium mt-6 tracking-normal drop-shadow-md text-white opacity-90 break-keep">
                당첨자는 식권대장 앱을 열고 메뉴를 큐레이션해주세요.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Countdown display */}
      <AnimatePresence>
        {gameState === 'READY_TIMER' && timeLeft !== null && (
          <motion.div 
            key={timeLeft}
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1.5, opacity: 1 }}
            exit={{ scale: 2, opacity: 0 }}
            className="absolute flex items-center justify-center pointer-events-none z-40 text-8xl font-black text-white mix-blend-overlay"
          >
            {timeLeft}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Touch points */}
      {displayTouches.map(touch => (
        <TouchPoint 
          key={touch.id}
          x={touch.x}
          y={touch.y}
          color={touch.color}
          gameState={gameState}
          isHighlighted={highlightedId === touch.id}
          isLoser={loserId === touch.id}
        />
      ))}

      {/* Debug Local Sim Button */}
      {import.meta.env.DEV && (
        <div className="absolute top-4 right-4 hidden md:flex gap-2 z-50 pointer-events-auto items-center">
          <select 
            value={simCount} 
            onChange={e => setSimCount(parseInt(e.target.value) || 2)}
            className="bg-white/20 text-white px-2 py-2 rounded text-center outline-none text-sm cursor-pointer"
          >
            {[2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
              <option key={n} value={n} className="bg-slate-800 text-white">{n}명</option>
            ))}
          </select>
          <button 
            onClick={() => {
              if (!containerRef.current) return;
              const newTouches = [];
              const w = window.innerWidth;
              const h = window.innerHeight;
              const count = Math.min(Math.max(simCount, 2), 10);
              
              for (let i = 0; i < count; i++) {
                // Generate random positions with some margin to keep them on screen
                const margin = 50;
                const tx = margin + Math.random() * (w - 2 * margin);
                const ty = margin + Math.random() * (h - 2 * margin);
                newTouches.push(new Touch({ identifier: i + 1, target: containerRef.current, clientX: tx, clientY: ty }));
              }
              const event = new TouchEvent('touchstart', { touches: newTouches as unknown as Touch[], changedTouches: newTouches as unknown as Touch[] });
              containerRef.current.dispatchEvent(event);
            }}
            className="bg-white/20 text-white px-4 py-2 rounded opacity-80 hover:opacity-100 text-sm tracking-wider"
          >
            로컬 시뮬레이션
          </button>
        </div>
      )}
    </div>
  );
}

export default App;
