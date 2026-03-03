// ============================================================
// Settings Page
// ============================================================
Router.register('settings', async (container) => {
    // Load saved settings from localStorage
    const settings = {
        darkMode: localStorage.getItem('admin_dark_mode') === 'true',
        backendUrl: localStorage.getItem('admin_backend_url') || BACKEND_URL,
        notifyOnNewUser: localStorage.getItem('admin_notify_new_user') !== 'false',
    };

    container.innerHTML = `
        <!-- BACKEND STATUS -->
        <div class="card">
            <div class="card-header">
                <h2>Backend Status</h2>
                <button class="btn btn-blue btn-sm" id="check-health-btn">
                    <span class="material-icons-round">refresh</span> Check
                </button>
            </div>
            <div id="health-status" style="display:flex;align-items:center;gap:10px;padding:8px 0;">
                <div class="spinner" style="width:20px;height:20px;border-width:2px"></div>
                <span style="color:var(--text-secondary)">Checking...</span>
            </div>
        </div>

        <!-- GENERAL SETTINGS -->
        <div class="card">
            <div class="card-header"><h2>General</h2></div>

            <div class="setting-row">
                <div class="setting-info">
                    <h4>Backend API URL</h4>
                    <p>The FastAPI backend endpoint</p>
                </div>
                <div style="display:flex;gap:8px;align-items:center">
                    <input type="text" id="backend-url-input" value="${escapeHtml(settings.backendUrl)}" 
                        style="padding:8px 12px;border-radius:8px;border:1.5px solid var(--border);font-family:inherit;font-size:0.85rem;width:320px;background:var(--bg)">
                    <button class="btn btn-green btn-sm" id="save-url-btn">Save</button>
                </div>
            </div>

            <div class="setting-row">
                <div class="setting-info">
                    <h4>Notify on New User</h4>
                    <p>Show browser notification when a new user signs up</p>
                </div>
                <button class="toggle ${settings.notifyOnNewUser ? 'on' : ''}" id="toggle-notify"></button>
            </div>
        </div>

        <!-- DATABASE INFO -->
        <div class="card">
            <div class="card-header"><h2>Database Info</h2></div>
            <div id="db-info" style="display:grid;gap:12px;">
                <div class="loading-spinner" style="padding:20px"><div class="spinner"></div></div>
            </div>
        </div>

        <!-- DANGER ZONE -->
        <div class="card" style="border:1.5px solid rgba(239,68,68,0.2)">
            <div class="card-header">
                <h2 style="color:var(--red)">Danger Zone</h2>
            </div>

            <div class="setting-row">
                <div class="setting-info">
                    <h4>Clear All Notifications</h4>
                    <p>Remove all notification records from the database</p>
                </div>
                <button class="btn btn-red btn-sm" id="clear-notifs-btn">
                    <span class="material-icons-round">notifications_off</span> Clear
                </button>
            </div>

            <div class="setting-row">
                <div class="setting-info">
                    <h4>Purge Orphaned Files</h4>
                    <p>Remove file records with no associated user (cleanup)</p>
                </div>
                <button class="btn btn-red btn-sm" id="purge-orphans-btn">
                    <span class="material-icons-round">cleaning_services</span> Purge
                </button>
            </div>
        </div>
    `;

    // ── Check backend health ──
    async function checkHealth() {
        const el = document.getElementById('health-status');
        el.innerHTML = `<div class="spinner" style="width:20px;height:20px;border-width:2px"></div>
            <span style="color:var(--text-secondary)">Checking...</span>`;

        try {
            const res = await fetch(settings.backendUrl + '/', { signal: AbortSignal.timeout(8000) });
            const data = await res.json();
            el.innerHTML = `
                <span class="material-icons-round" style="color:var(--green);font-size:28px">check_circle</span>
                <div>
                    <div style="font-weight:600;color:var(--green)">Online</div>
                    <div style="font-size:0.82rem;color:var(--text-secondary)">
                        Telegram: ${data.connected ? '✅ Connected' : '❌ Disconnected'} • ${data.info || ''}
                    </div>
                </div>
            `;
        } catch (e) {
            el.innerHTML = `
                <span class="material-icons-round" style="color:var(--red);font-size:28px">error</span>
                <div>
                    <div style="font-weight:600;color:var(--red)">Offline / Unreachable</div>
                    <div style="font-size:0.82rem;color:var(--text-secondary)">${e.message}</div>
                </div>
            `;
        }
    }
    checkHealth();
    document.getElementById('check-health-btn').addEventListener('click', checkHealth);

    // ── DB Info ──
    async function loadDbInfo() {
        const [files, users, folders, notifs] = await Promise.all([
            db.from('files').select('id', { count: 'exact', head: true }),
            db.from('profiles').select('id', { count: 'exact', head: true }),
            db.from('folders').select('id', { count: 'exact', head: true }),
            db.from('notifications').select('id', { count: 'exact', head: true }),
        ]);

        document.getElementById('db-info').innerHTML = `
            <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:12px">
                <div style="padding:14px;background:var(--bg);border-radius:12px;text-align:center">
                    <div style="font-size:1.3rem;font-weight:800">${files.count ?? '?'}</div>
                    <div style="font-size:0.8rem;color:var(--text-secondary)">Files</div>
                </div>
                <div style="padding:14px;background:var(--bg);border-radius:12px;text-align:center">
                    <div style="font-size:1.3rem;font-weight:800">${users.count ?? '?'}</div>
                    <div style="font-size:0.8rem;color:var(--text-secondary)">Users</div>
                </div>
                <div style="padding:14px;background:var(--bg);border-radius:12px;text-align:center">
                    <div style="font-size:1.3rem;font-weight:800">${folders.count ?? '?'}</div>
                    <div style="font-size:0.8rem;color:var(--text-secondary)">Folders</div>
                </div>
                <div style="padding:14px;background:var(--bg);border-radius:12px;text-align:center">
                    <div style="font-size:1.3rem;font-weight:800">${notifs.count ?? '?'}</div>
                    <div style="font-size:0.8rem;color:var(--text-secondary)">Notifications</div>
                </div>
            </div>
            <div style="font-size:0.8rem;color:var(--text-secondary);margin-top:4px">
                Supabase: <code style="background:var(--bg);padding:2px 6px;border-radius:4px;font-size:0.78rem">${SUPABASE_URL}</code>
            </div>
        `;
    }
    loadDbInfo();

    // ── Save URL ──
    document.getElementById('save-url-btn').addEventListener('click', () => {
        const url = document.getElementById('backend-url-input').value.trim();
        localStorage.setItem('admin_backend_url', url);
        settings.backendUrl = url;
        showToast('Backend URL saved', 'success');
        checkHealth();
    });

    // ── Toggle notify ──
    document.getElementById('toggle-notify').addEventListener('click', (e) => {
        const btn = e.currentTarget;
        btn.classList.toggle('on');
        const on = btn.classList.contains('on');
        localStorage.setItem('admin_notify_new_user', on);
    });

    // ── Clear Notifications ──
    document.getElementById('clear-notifs-btn').addEventListener('click', async () => {
        if (!confirm('Clear all notifications? This cannot be undone.')) return;
        const { error } = await db.from('notifications').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        if (error) { showToast('Failed: ' + error.message, 'error'); return; }
        showToast('All notifications cleared', 'success');
        loadDbInfo();
    });

    // ── Purge Orphans ──
    document.getElementById('purge-orphans-btn').addEventListener('click', async () => {
        if (!confirm('Purge orphaned file records? This cannot be undone.')) return;
        
        const { data: allFiles } = await db.from('files').select('id, user_id');
        const { data: allUsers } = await db.from('profiles').select('id');
        
        if (!allFiles || !allUsers) { showToast('Failed to fetch data', 'error'); return; }
        
        const userIds = new Set(allUsers.map(u => u.id));
        const orphans = allFiles.filter(f => !userIds.has(f.user_id));
        
        if (orphans.length === 0) { showToast('No orphaned files found', 'success'); return; }
        
        for (const orphan of orphans) {
            await db.from('files').delete().eq('id', orphan.id);
        }
        
        showToast(`Purged ${orphans.length} orphaned files`, 'success');
        loadDbInfo();
    });
});

