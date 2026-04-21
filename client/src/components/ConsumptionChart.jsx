import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend, Filler);

const baseOptions = {
  responsive: true,
  maintainAspectRatio: true,
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: '#1a1a2e',
      borderColor: 'rgba(255,255,255,0.08)',
      borderWidth: 1,
      titleColor: '#e8e8e8',
      bodyColor: '#888',
    },
  },
  scales: {
    x: {
      grid: { color: 'rgba(255,255,255,0.04)' },
      ticks: { color: '#888', font: { size: 11 } },
    },
    y: {
      grid: { color: 'rgba(255,255,255,0.04)' },
      ticks: { color: '#888', font: { size: 11 } },
    },
  },
};

export function SpendChart({ data }) {
  const labels = data?.map((d) => d._id?.slice(5)) || [];
  const amounts = data?.map((d) => d.amount / 100) || [];

  return (
    <Bar
      data={{
        labels,
        datasets: [{
          data: amounts,
          backgroundColor: 'rgba(0, 212, 170, 0.3)',
          borderColor: '#00d4aa',
          borderWidth: 2,
          borderRadius: 6,
        }],
      }}
      options={{ ...baseOptions, plugins: { ...baseOptions.plugins, title: { display: true, text: 'Daily Spend (₹)', color: '#888', font: { size: 12 } } } }}
    />
  );
}

export function CountChart({ data }) {
  const labels = data?.map((d) => d._id?.slice(5)) || [];
  const counts = data?.map((d) => d.count) || [];

  return (
    <Line
      data={{
        labels,
        datasets: [{
          data: counts,
          borderColor: '#ffa502',
          backgroundColor: 'rgba(255, 165, 2, 0.1)',
          borderWidth: 2,
          pointBackgroundColor: '#ffa502',
          fill: true,
          tension: 0.4,
        }],
      }}
      options={{ ...baseOptions, plugins: { ...baseOptions.plugins, title: { display: true, text: 'Daily Count', color: '#888', font: { size: 12 } } } }}
    />
  );
}
