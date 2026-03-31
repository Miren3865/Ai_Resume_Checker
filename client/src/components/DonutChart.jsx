
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import { motion, useAnimation } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';

ChartJS.register(ArcElement, Tooltip, Legend);

const getColor = (score) =>
  score >= 80 ? '#22c55e' : score >= 60 ? '#f59e0b' : '#ef4444';

export default function DonutChart({ score, label = 'Match Score' }) {
  const color = getColor(score);

  const data = {
    datasets: [
      {
        data: [score, 100 - score],
        backgroundColor: [color, 'rgba(255,255,255,0.07)'],
        borderWidth: 0,
        hoverOffset: 4,
      },
    ],
  };

  const options = {
    cutout: '72%',
    plugins: {
      legend: { display: false },
      tooltip: { enabled: false },
    },
  };

  const grade =
    score >= 90 ? 'A+' : score >= 80 ? 'A' : score >= 70 ? 'B' : score >= 60 ? 'C' : 'D';

  // Animate the score number
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

  return (
    <div className="relative flex flex-col items-center">
      <div className="relative" style={{ width: 160, height: 160 }}>
        <Doughnut data={data} options={options} />
        <motion.div
          className="absolute inset-0 flex flex-col items-center justify-center"
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
          <span className="text-xs text-gray-400">/100</span>
          <motion.span
            className="text-sm font-semibold"
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
      <p className="text-sm text-gray-600 mt-2 font-medium">{label}</p>
    </div>
  );
}
