import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from 'chart.js';
import { Radar } from 'react-chartjs-2';

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

export default function RadarChart({ evaluation }) {
  if (!evaluation) return null;

  const data = {
    labels: ['Skills', 'Experience', 'Education', 'Keywords', 'Formatting'],
    datasets: [
      {
        label: 'Score',
        data: [
          evaluation.skillsCoverage   || 0,
          evaluation.experienceAlignment || 0,
          evaluation.educationMatch   || 0,
          evaluation.keywordScore     || 0,
          evaluation.formattingScore  || 0,
        ],
        backgroundColor: 'rgba(168, 85, 247, 0.12)',
        borderColor: 'rgba(168, 85, 247, 0.8)',
        pointBackgroundColor: '#a855f7',
        pointBorderColor: 'rgba(168,85,247,.4)',
        pointHoverBackgroundColor: '#c084fc',
        borderWidth: 2,
      },
    ],
  };

  const options = {
    responsive: true,
    scales: {
      r: {
        min: 0, max: 100,
        ticks: {
          stepSize: 20,
          font: { size: 9 },
          color: 'rgba(148,163,184,.5)',
          backdropColor: 'transparent',
        },
        pointLabels: {
          font: { size: 11.5, weight: '600' },
          color: 'rgba(203,213,225,.85)',
        },
        grid: { color: 'rgba(255,255,255,.07)' },
        angleLines: { color: 'rgba(255,255,255,.06)' },
      },
    },
    plugins: { legend: { display: false } },
  };

  return <Radar data={data} options={options} />;
}
