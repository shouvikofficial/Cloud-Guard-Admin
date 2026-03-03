// This file contains JavaScript specific to the dashboard functionality, including dynamic data loading and chart rendering.

document.addEventListener('DOMContentLoaded', function() {
    loadDashboardData();
    initializeCharts();
});

function loadDashboardData() {
    // Fetch data from the sample data JSON file
    fetch('../data/sample-data.json')
        .then(response => response.json())
        .then(data => {
            // Process and display the data on the dashboard
            displayMetrics(data.metrics);
            displayRecentActivities(data.activities);
        })
        .catch(error => console.error('Error loading dashboard data:', error));
}

function displayMetrics(metrics) {
    // Update the dashboard metrics section with the fetched data
    document.getElementById('metric1').textContent = metrics.metric1;
    document.getElementById('metric2').textContent = metrics.metric2;
    document.getElementById('metric3').textContent = metrics.metric3;
}

function displayRecentActivities(activities) {
    const activitiesList = document.getElementById('recent-activities');
    activitiesList.innerHTML = '';
    activities.forEach(activity => {
        const listItem = document.createElement('li');
        listItem.textContent = activity;
        activitiesList.appendChild(listItem);
    });
}

function initializeCharts() {
    // Initialize charts using the charts.js library
    const ctx = document.getElementById('myChart').getContext('2d');
    const myChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['January', 'February', 'March', 'April', 'May', 'June', 'July'],
            datasets: [{
                label: 'Monthly Sales',
                data: [65, 59, 80, 81, 56, 55, 40],
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1
            }]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}