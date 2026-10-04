import {
    ArcElement, BarElement, CategoryScale, Chart as ChartJS, Filler, Legend, LinearScale, LineElement, PointElement, Tooltip,
} from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Filler, Tooltip, Legend);
ChartJS.defaults.font.family = "'Plus Jakarta Sans', system-ui, sans-serif";
ChartJS.defaults.color = '#94a3b8';

export const PALETTE = ['#0b5ed7', '#20c997', '#fab005', '#fa5252', '#7950f2', '#15aabf', '#fd7e14'];

const baseOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: { legend: { labels: { usePointStyle: true, boxWidth: 8 } } },
    scales: { x: { grid: { display: false } }, y: { grid: { color: 'rgba(148,163,184,.15)' }, beginAtZero: true } },
};

/** Line/area chart. datasets: [{ label, data, color, yAxisID? }] */
export function LineChart({ labels, datasets, height = 280, options = {} }) {
    return (
        <div style={{ height }}>
            <Line
                data={{
                    labels,
                    datasets: datasets.map((d, i) => ({
                        tension: 0.35, fill: true, pointRadius: 0, borderWidth: 2,
                        borderColor: d.color ?? PALETTE[i], backgroundColor: `${d.color ?? PALETTE[i]}1f`, ...d,
                    })),
                }}
                options={{ ...baseOptions, ...options }}
            />
        </div>
    );
}

export function BarChart({ labels, datasets, height = 260, options = {} }) {
    return (
        <div style={{ height }}>
            <Bar data={{ labels, datasets: datasets.map((d, i) => ({ borderRadius: 6, backgroundColor: d.color ?? PALETTE[i], ...d })) }} options={{ ...baseOptions, ...options }} />
        </div>
    );
}

export function DoughnutChart({ labels, data, height = 240 }) {
    return (
        <div style={{ height }}>
            <Doughnut
                data={{ labels, datasets: [{ data, backgroundColor: PALETTE, borderWidth: 0 }] }}
                options={{ responsive: true, maintainAspectRatio: false, cutout: '68%', plugins: { legend: { position: 'bottom', labels: { usePointStyle: true, boxWidth: 8 } } } }}
            />
        </div>
    );
}
