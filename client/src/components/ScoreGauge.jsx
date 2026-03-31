import { motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';

export default function ScoreGauge({ score, size = 140 }) {
  const grade =
    score >= 90 ? 'A+' : score >= 80 ? 'A' : score >= 70 ? 'B' : score >= 60 ? 'C' : 'D';

  const color =
    score >= 80
      ? '#22c55e'
      : score >= 60
      ? '#f59e0b'
      : '#ef4444';

  const radius = (size - 20) / 2;
  const circumference = 2 * Math.PI * radius;
  const [displayScore, setDisplayScore] = useState(score);
  const prevScore = useRef(score);
  useEffect(() => {
    if (prevScore.current !== score) {
      const start = prevScore.current;
      const end = score;
      const duration = 700;
      const startTime = performance.now();
      function animate(now) {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        setDisplayScore(Math.round(start + (end - start) * progress));
        if (progress < 1) requestAnimationFrame(animate);
      }
      requestAnimationFrame(animate);
      prevScore.current = score;
    }
  }, [score]);
  const offset = circumference - (displayScore / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-2" style={{ position: 'relative' }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="10" />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ filter: `drop-shadow(0 0 6px ${color})` }}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
        />
      </svg>
      <motion.div
        className="absolute flex flex-col items-center"
        style={{ marginTop: -(size / 2 + 18) }}
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        <motion.span
          className="text-3xl font-bold"
          style={{ color }}
          key={displayScore}
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.32 }}
        >
          {displayScore}
        </motion.span>
        <span className="text-xs text-gray-500">/ 100</span>
        <motion.span
          className="text-sm font-semibold mt-0.5"
          style={{ color }}
          key={grade}
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.32 }}
        >
          Grade {grade}
        </motion.span>
      </motion.div>
    </div>
  );
}
