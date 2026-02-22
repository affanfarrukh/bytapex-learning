/**
 * Chart.js Configurations
 * Handles Visibility Line Chart and Readiness Doughnut Charts.
 */

// Global Chart Instances
let visibilityChartInstance = null;
let techChartInstance = null;
let commChartInstance = null;
let execChartInstance = null;

const accentColor = '#00e5ff';
const secondaryColor = '#007bff';
const textColor = '#aaaaaa';

function initCharts() {
    initVisibilityChart();
    initReadinessCharts();
}

function initVisibilityChart() {
    const ctx = document.getElementById('visibilityChart').getContext('2d');

    // Gradient fill
    const gradient = ctx.createLinearGradient(0, 0, 0, 400);
    gradient.addColorStop(0, 'rgba(0, 229, 255, 0.4)');
    gradient.addColorStop(1, 'rgba(0, 229, 255, 0)');

    visibilityChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
            datasets: [{
                label: 'Market Visibility Score',
                data: [10, 25, 30, 45, 40, 60, 75], // Mock initial data
                borderColor: accentColor,
                backgroundColor: gradient,
                borderWidth: 2,
                pointBackgroundColor: '#fff',
                pointBorderColor: accentColor,
                pointHoverRadius: 6,
                fill: true,
                tension: 0.4 // Smooth curve
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: 'rgba(0,0,0,0.8)',
                    titleColor: '#fff',
                    bodyColor: '#fff',
                    borderColor: accentColor,
                    borderWidth: 1
                }
            },
            scales: {
                x: {
                    grid: { color: 'rgba(255,255,255,0.05)' },
                    ticks: { color: textColor }
                },
                y: {
                    grid: { color: 'rgba(255,255,255,0.05)' },
                    ticks: { color: textColor },
                    beginAtZero: true
                }
            }
        }
    });
}

function initReadinessCharts() {
    const config = (ctxId, val, color) => {
        const ctx = document.getElementById(ctxId).getContext('2d');
        return new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Ready', 'Gap'],
                datasets: [{
                    data: [val, 100 - val],
                    backgroundColor: [color, 'rgba(255,255,255,0.05)'],
                    borderWidth: 0,
                    hoverOffset: 4
                }]
            },
            options: {
                cutout: '75%', // Thinner ring
                responsive: true,
                plugins: { legend: { display: false } }
            }
        });
    };

    techChartInstance = config('techChart', 65, accentColor);     // Cyan
    commChartInstance = config('commChart', 80, '#00ff88');       // Green
    execChartInstance = config('execChart', 40, '#ff4444');       // Red
}

function updateVisibilityChart(newData, newLabels) {
    if (visibilityChartInstance) {
        visibilityChartInstance.data.datasets[0].data = newData;
        if (newLabels) {
            visibilityChartInstance.data.labels = newLabels;
        }
        visibilityChartInstance.update();
    }
}

function updateReadiness(tech, comm, exec) {
    if (techChartInstance) {
        techChartInstance.data.datasets[0].data = [tech, 100 - tech];
        techChartInstance.update();
    }
    if (commChartInstance) {
        commChartInstance.data.datasets[0].data = [comm, 100 - comm];
        commChartInstance.update();
    }
    if (execChartInstance) {
        execChartInstance.data.datasets[0].data = [exec, 100 - exec];
        execChartInstance.update();
    }
}
