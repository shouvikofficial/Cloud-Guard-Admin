// ============================================================
// Analytics Page
// ============================================================
Router.register('analytics', async (container) => {
    // Fetch all data
    const [filesRes, usersRes, foldersRes] = await Promise.all([
        db.from('files').select('id, size, type, created_at, user_id'),
        db.from('profiles').select('id, created_at'),
        db.from('folders').select('id, created_at'),
    ]);

    const files = filesRes.data || [];
    const users = usersRes.data || [];
    const folders = foldersRes.data || [];

    // Storage by type
    const storageByType = { image: 0, video: 0, music: 0, document: 0 };
    files.forEach(f => {
        if (storageByType[f.type] !== undefined) storageByType[f.type] += (f.size || 0);
    });

    const totalBytes = files.reduce((s, f) => s + (f.size || 0), 0);

    // Files per day (last 30 days)
    const last30 = getLast30Days();
    const filesPerDay = {};
    const usersPerDay = {};
    last30.forEach(d => { filesPerDay[d] = 0; usersPerDay[d] = 0; });

    files.forEach(f => {
        const day = f.created_at?.split('T')[0];
        if (filesPerDay[day] !== undefined) filesPerDay[day]++;
    });

    users.forEach(u => {
        const day = u.created_at?.split('T')[0];
        if (usersPerDay[day] !== undefined) usersPerDay[day]++;
    });

    // Top uploaders
    const userFileCount = {};
    files.forEach(f => {
        userFileCount[f.user_id] = (userFileCount[f.user_id] || 0) + 1;
    });
    const topUploaders = Object.entries(userFileCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);

    // Map user IDs to names
    const userMap = {};
    users.forEach(u => { userMap[u.id] = u.name || u.id.slice(0, 8); });

    container.innerHTML = `
        <!-- STORAGE STATS -->
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-icon blue"><span class="material-icons-round">cloud</span></div>
                <div class="stat-info">
                    <h3>${formatBytes(totalBytes)}</h3>
                    <p>Total Storage</p>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon blue"><span class="material-icons-round">image</span></div>
                <div class="stat-info">
                    <h3>${formatBytes(storageByType.image)}</h3>
                    <p>Photos</p>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon purple"><span class="material-icons-round">videocam</span></div>
                <div class="stat-info">
                    <h3>${formatBytes(storageByType.video)}</h3>
                    <p>Videos</p>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon green"><span class="material-icons-round">music_note</span></div>
                <div class="stat-info">
                    <h3>${formatBytes(storageByType.music)}</h3>
                    <p>Music</p>
                </div>
            </div>
        </div>

        <!-- CHARTS -->
        <div class="charts-grid">
            <div class="card">
                <div class="card-header"><h2>Uploads (Last 30 Days)</h2></div>
                <div class="chart-container">
                    <canvas id="uploadsChart"></canvas>
                </div>
            </div>
            <div class="card">
                <div class="card-header"><h2>New Users (Last 30 Days)</h2></div>
                <div class="chart-container">
                    <canvas id="usersChart"></canvas>
                </div>
            </div>
        </div>

        <div class="grid-2">
            <!-- STORAGE BREAKDOWN -->
            <div class="card">
                <div class="card-header"><h2>Storage Breakdown</h2></div>
                <div class="chart-container" style="height:250px">
                    <canvas id="storageChart"></canvas>
                </div>
            </div>

            <!-- TOP UPLOADERS -->
            <div class="card">
                <div class="card-header"><h2>Top Uploaders</h2></div>
                <div class="table-wrapper">
                    <table>
                        <thead><tr><th>#</th><th>User</th><th>Files</th></tr></thead>
                        <tbody>
                            ${topUploaders.map(([uid, count], i) => `
                                <tr>
                                    <td style="font-weight:700;color:var(--text-secondary)">${i + 1}</td>
                                    <td style="display:flex;align-items:center;gap:8px">
                                        <div class="user-avatar" style="background:${stringToColor(userMap[uid] || 'U')};width:32px;height:32px;font-size:0.8rem">${(userMap[uid] || 'U')[0].toUpperCase()}</div>
                                        ${escapeHtml(userMap[uid] || uid.slice(0, 12))}
                                    </td>
                                    <td><strong>${count}</strong></td>
                                </tr>
                            `).join('')}
                            ${topUploaders.length === 0 ? '<tr><td colspan="3" style="text-align:center;color:var(--text-secondary)">No data</td></tr>' : ''}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;

    // Chart: Uploads per day
    const uploadsCtx = document.getElementById('uploadsChart');
    if (uploadsCtx) {
        new Chart(uploadsCtx, {
            type: 'bar',
            data: {
                labels: last30.map(d => d.slice(5)), // MM-DD
                datasets: [{
                    label: 'Files Uploaded',
                    data: last30.map(d => filesPerDay[d]),
                    backgroundColor: 'rgba(90, 108, 255, 0.5)',
                    borderColor: '#5A6CFF',
                    borderWidth: 1,
                    borderRadius: 4,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    y: { beginAtZero: true, ticks: { stepSize: 1, font: { family: 'Inter', size: 11 } }, grid: { color: 'rgba(0,0,0,0.04)' } },
                    x: { ticks: { font: { family: 'Inter', size: 10 }, maxRotation: 45 }, grid: { display: false } },
                }
            }
        });
    }

    // Chart: Users per day
    const usersCtx = document.getElementById('usersChart');
    if (usersCtx) {
        new Chart(usersCtx, {
            type: 'line',
            data: {
                labels: last30.map(d => d.slice(5)),
                datasets: [{
                    label: 'New Users',
                    data: last30.map(d => usersPerDay[d]),
                    borderColor: '#8B7CF6',
                    backgroundColor: 'rgba(139, 124, 246, 0.1)',
                    fill: true,
                    tension: 0.4,
                    pointRadius: 3,
                    pointBackgroundColor: '#8B7CF6',
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    y: { beginAtZero: true, ticks: { stepSize: 1, font: { family: 'Inter', size: 11 } }, grid: { color: 'rgba(0,0,0,0.04)' } },
                    x: { ticks: { font: { family: 'Inter', size: 10 }, maxRotation: 45 }, grid: { display: false } },
                }
            }
        });
    }

    // Chart: Storage breakdown
    const storageCtx = document.getElementById('storageChart');
    if (storageCtx) {
        new Chart(storageCtx, {
            type: 'doughnut',
            data: {
                labels: ['Photos', 'Videos', 'Music', 'Documents'],
                datasets: [{
                    data: [storageByType.image, storageByType.video, storageByType.music, storageByType.document],
                    backgroundColor: ['#5A6CFF', '#8B7CF6', '#4CAF50', '#14B8A6'],
                    borderWidth: 0,
                    borderRadius: 4,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '65%',
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: { padding: 14, usePointStyle: true, font: { family: 'Inter', weight: '600', size: 12 } }
                    },
                    tooltip: {
                        callbacks: {
                            label: (ctx) => `${ctx.label}: ${formatBytes(ctx.parsed)}`
                        }
                    }
                }
            }
        });
    }
});

function getLast30Days() {
    const days = [];
    for (let i = 29; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        days.push(d.toISOString().split('T')[0]);
    }
    return days;
}

