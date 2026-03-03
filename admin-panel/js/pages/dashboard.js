// ============================================================
// Dashboard Page
// ============================================================
Router.register('dashboard', async (container) => {
    // Fetch all stats in parallel
    const [usersRes, filesRes, foldersRes, notifRes] = await Promise.all([
        db.from('profiles').select('id, name, created_at', { count: 'exact' }),
        db.from('files').select('id, size, type, created_at', { count: 'exact' }),
        db.from('folders').select('id', { count: 'exact' }),
        db.from('notifications').select('id', { count: 'exact' }),
    ]);

    // Debug: log any errors
    console.log('Dashboard queries:', {
        users: { data: usersRes.data?.length, error: usersRes.error },
        files: { data: filesRes.data?.length, error: filesRes.error },
        folders: { data: foldersRes.data?.length, error: foldersRes.error },
        notifs: { data: notifRes.data?.length, error: notifRes.error },
    });

    const totalUsers = usersRes.data?.length || 0;
    const totalFiles = filesRes.data?.length || 0;
    const totalFolders = foldersRes.data?.length || 0;
    const totalNotifs = notifRes.data?.length || 0;

    // Storage calculation
    const files = filesRes.data || [];
    const totalBytes = files.reduce((sum, f) => sum + (f.size || 0), 0);
    const totalStorage = formatBytes(totalBytes);

    // File type breakdown
    const typeCounts = { image: 0, video: 0, music: 0, document: 0 };
    files.forEach(f => {
        if (typeCounts[f.type] !== undefined) typeCounts[f.type]++;
    });

    // Recent users (last 5)
    const recentUsers = (usersRes.data || [])
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 5);

    container.innerHTML = `
        <!-- STATS ROW -->
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-icon blue"><span class="material-icons-round">people</span></div>
                <div class="stat-info">
                    <h3>${totalUsers}</h3>
                    <p>Total Users</p>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon purple"><span class="material-icons-round">description</span></div>
                <div class="stat-info">
                    <h3>${totalFiles}</h3>
                    <p>Total Files</p>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon green"><span class="material-icons-round">folder</span></div>
                <div class="stat-info">
                    <h3>${totalFolders}</h3>
                    <p>Total Folders</p>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon orange"><span class="material-icons-round">cloud</span></div>
                <div class="stat-info">
                    <h3>${totalStorage}</h3>
                    <p>Storage Used</p>
                </div>
            </div>
        </div>

        <!-- GRID: CHART + RECENT -->
        <div class="grid-2">
            <!-- FILE TYPE CHART -->
            <div class="card">
                <div class="card-header"><h2>File Types</h2></div>
                <div class="chart-container" style="height: 250px;">
                    <canvas id="fileTypeChart"></canvas>
                </div>
            </div>

            <!-- RECENT USERS -->
            <div class="card">
                <div class="card-header">
                    <h2>Recent Users</h2>
                    <a href="#users" class="btn btn-blue btn-sm">View All</a>
                </div>
                <div class="table-wrapper">
                    <table>
                        <thead>
                            <tr><th>User</th><th>Joined</th></tr>
                        </thead>
                        <tbody>
                            ${recentUsers.map(u => `
                                <tr>
                                    <td style="display:flex;align-items:center;gap:10px;">
                                        <div class="user-avatar" style="background:${stringToColor(u.name || 'U')}">
                                            ${(u.name || 'U')[0].toUpperCase()}
                                        </div>
                                        ${escapeHtml(u.name || 'Unknown')}
                                    </td>
                                    <td>${timeAgo(u.created_at)}</td>
                                </tr>
                            `).join('')}
                            ${recentUsers.length === 0 ? '<tr><td colspan="2" style="text-align:center;color:var(--text-secondary)">No users yet</td></tr>' : ''}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

        <!-- QUICK STATS ROW -->
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-icon blue"><span class="material-icons-round">image</span></div>
                <div class="stat-info">
                    <h3>${typeCounts.image}</h3>
                    <p>Photos</p>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon purple"><span class="material-icons-round">videocam</span></div>
                <div class="stat-info">
                    <h3>${typeCounts.video}</h3>
                    <p>Videos</p>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon green"><span class="material-icons-round">music_note</span></div>
                <div class="stat-info">
                    <h3>${typeCounts.music}</h3>
                    <p>Music</p>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon teal"><span class="material-icons-round">article</span></div>
                <div class="stat-info">
                    <h3>${typeCounts.document}</h3>
                    <p>Documents</p>
                </div>
            </div>
        </div>
    `;

    // Render chart
    const ctx = document.getElementById('fileTypeChart');
    if (ctx) {
        new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Photos', 'Videos', 'Music', 'Documents'],
                datasets: [{
                    data: [typeCounts.image, typeCounts.video, typeCounts.music, typeCounts.document],
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
                        labels: { padding: 16, usePointStyle: true, pointStyleWidth: 10, font: { family: 'Inter', weight: '600', size: 12 } }
                    }
                }
            }
        });
    }
});

// ── Utility Functions ──
function formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function timeAgo(dateStr) {
    if (!dateStr) return '-';
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 30) return `${days}d ago`;
    return new Date(dateStr).toLocaleDateString();
}

function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

function stringToColor(str) {
    const colors = ['#5A6CFF', '#8B7CF6', '#4CAF50', '#FF9800', '#14B8A6', '#EF4444', '#EC4899'];
    let hash = 0;
    for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
    return colors[Math.abs(hash) % colors.length];
}

