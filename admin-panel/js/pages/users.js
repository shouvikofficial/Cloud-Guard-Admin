// ============================================================
// Users Page
// ============================================================
Router.register('users', async (container) => {
    let allUsers = [];
    let currentPage = 1;
    const perPage = 15;
    let searchQuery = '';

    async function fetchUsers() {
        const { data, error } = await db
            .from('profiles')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) { console.error(error); return []; }
        return data || [];
    }

    function getFilteredUsers() {
        if (!searchQuery) return allUsers;
        const q = searchQuery.toLowerCase();
        return allUsers.filter(u =>
            (u.name || '').toLowerCase().includes(q) ||
            (u.email || '').toLowerCase().includes(q) ||
            (u.id || '').toLowerCase().includes(q)
        );
    }

    function render() {
        const filtered = getFilteredUsers();
        const totalPages = Math.ceil(filtered.length / perPage);
        const start = (currentPage - 1) * perPage;
        const pageUsers = filtered.slice(start, start + perPage);

        container.innerHTML = `
            <div class="card">
                <div class="card-header">
                    <h2>All Users (${filtered.length})</h2>
                    <div class="search-bar">
                        <span class="material-icons-round">search</span>
                        <input type="text" placeholder="Search users..." id="user-search" value="${escapeHtml(searchQuery)}">
                    </div>
                </div>

                <div class="table-wrapper">
                    <table>
                        <thead>
                            <tr>
                                <th>User</th>
                                <th>User ID</th>
                                <th>Joined</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${pageUsers.map(u => `
                                <tr>
                                    <td style="display:flex;align-items:center;gap:10px;">
                                        <div class="user-avatar" style="background:${stringToColor(u.name || 'U')}">
                                            ${(u.name || 'U')[0].toUpperCase()}
                                        </div>
                                        <div>
                                            <div style="font-weight:600;">${escapeHtml(u.name || 'Unknown')}</div>
                                            <div style="font-size:0.78rem;color:var(--text-secondary)">${escapeHtml(u.email || '')}</div>
                                        </div>
                                    </td>
                                    <td style="font-size:0.78rem;font-family:monospace;color:var(--text-secondary)">${u.id.slice(0, 12)}...</td>
                                    <td>${timeAgo(u.created_at)}</td>
                                    <td>
                                        <button class="btn btn-blue btn-sm view-user-btn" data-id="${u.id}">
                                            <span class="material-icons-round">visibility</span> View
                                        </button>
                                        <button class="btn btn-red btn-sm delete-user-btn" data-id="${u.id}" data-name="${escapeHtml(u.name || 'Unknown')}">
                                            <span class="material-icons-round">delete</span>
                                        </button>
                                    </td>
                                </tr>
                            `).join('')}
                            ${pageUsers.length === 0 ? '<tr><td colspan="4" style="text-align:center;color:var(--text-secondary);padding:40px">No users found</td></tr>' : ''}
                        </tbody>
                    </table>
                </div>

                ${totalPages > 1 ? `
                <div class="pagination">
                    ${Array.from({ length: totalPages }, (_, i) => `
                        <button class="page-btn ${i + 1 === currentPage ? 'active' : ''}" data-page="${i + 1}">${i + 1}</button>
                    `).join('')}
                </div>` : ''}
            </div>
        `;

        // Event listeners
        document.getElementById('user-search')?.addEventListener('input', (e) => {
            searchQuery = e.target.value;
            currentPage = 1;
            render();
        });

        document.querySelectorAll('.page-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                currentPage = parseInt(btn.dataset.page);
                render();
            });
        });

        document.querySelectorAll('.view-user-btn').forEach(btn => {
            btn.addEventListener('click', () => showUserDetail(btn.dataset.id));
        });

        document.querySelectorAll('.delete-user-btn').forEach(btn => {
            btn.addEventListener('click', () => showDeleteConfirm(btn.dataset.id, btn.dataset.name));
        });
    }

    async function showUserDetail(userId) {
        const user = allUsers.find(u => u.id === userId);
        if (!user) return;

        // Fetch user's files
        const { data: userFiles } = await db
            .from('files')
            .select('id, name, size, type, created_at')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(10);

        const files = userFiles || [];
        const totalSize = files.reduce((s, f) => s + (f.size || 0), 0);

        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay';
        overlay.innerHTML = `
            <div class="modal" style="max-width:560px;">
                <h3 style="display:flex;align-items:center;gap:10px">
                    <div class="user-avatar" style="background:${stringToColor(user.name || 'U')};width:42px;height:42px;font-size:1rem">
                        ${(user.name || 'U')[0].toUpperCase()}
                    </div>
                    ${escapeHtml(user.name || 'Unknown')}
                </h3>
                <div style="margin:16px 0;display:grid;gap:8px">
                    <div style="display:flex;justify-content:space-between"><span style="color:var(--text-secondary)">Email</span><span>${escapeHtml(user.email || '-')}</span></div>
                    <div style="display:flex;justify-content:space-between"><span style="color:var(--text-secondary)">User ID</span><span style="font-family:monospace;font-size:0.82rem">${user.id}</span></div>
                    <div style="display:flex;justify-content:space-between"><span style="color:var(--text-secondary)">Joined</span><span>${new Date(user.created_at).toLocaleDateString()}</span></div>
                    <div style="display:flex;justify-content:space-between"><span style="color:var(--text-secondary)">Files</span><span>${files.length}</span></div>
                    <div style="display:flex;justify-content:space-between"><span style="color:var(--text-secondary)">Storage</span><span>${formatBytes(totalSize)}</span></div>
                </div>

                ${files.length > 0 ? `
                <h4 style="margin-top:16px;font-size:0.9rem;color:var(--text-secondary)">Recent Files</h4>
                <div class="table-wrapper" style="margin-top:8px;max-height:200px;overflow-y:auto">
                    <table>
                        <thead><tr><th>Name</th><th>Type</th><th>Size</th></tr></thead>
                        <tbody>
                            ${files.map(f => `
                                <tr>
                                    <td style="font-size:0.85rem">${escapeHtml(f.name || '-')}</td>
                                    <td><span class="badge ${f.type || ''}">${f.type || '-'}</span></td>
                                    <td style="font-size:0.85rem">${formatBytes(f.size || 0)}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>` : ''}

                <div class="modal-actions">
                    <button class="btn btn-blue close-modal">Close</button>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);
        overlay.querySelector('.close-modal').addEventListener('click', () => overlay.remove());
        overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
    }

    function showDeleteConfirm(userId, userName) {
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay';
        overlay.innerHTML = `
            <div class="modal">
                <h3>Delete User?</h3>
                <p style="color:var(--text-secondary);margin-bottom:8px">
                    Are you sure you want to delete <strong>${escapeHtml(userName)}</strong>? 
                    This will remove their profile data. Files may remain in Telegram storage.
                </p>
                <div class="modal-actions">
                    <button class="btn btn-blue cancel-btn">Cancel</button>
                    <button class="btn btn-red confirm-delete-btn">Delete</button>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);
        overlay.querySelector('.cancel-btn').addEventListener('click', () => overlay.remove());
        overlay.querySelector('.confirm-delete-btn').addEventListener('click', async () => {
            await db.from('profiles').delete().eq('id', userId);
            overlay.remove();
            showToast('User deleted', 'success');
            allUsers = await fetchUsers();
            render();
        });
    }

    // Initial load
    allUsers = await fetchUsers();
    render();
});

