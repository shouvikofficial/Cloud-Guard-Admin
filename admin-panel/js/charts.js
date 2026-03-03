// This file contains functions for creating and managing charts using a charting library.

function createChart(ctx, chartType, data, options) {
    const chart = new Chart(ctx, {
        type: chartType,
        data: data,
        options: options
    });
    return chart;
}

function updateChart(chart, newData) {
    chart.data = newData;
    chart.update();
}

function destroyChart(chart) {
    chart.destroy();
}

// Example usage
// const ctx = document.getElementById('myChart').getContext('2d');
// const myChart = createChart(ctx, 'bar', chartData, chartOptions);