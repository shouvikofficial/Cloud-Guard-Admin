// ============================================================
// Files Page
// ============================================================
Router.register('files', async (container) => {
    let allFiles = [];
    let currentPage = 1;
    const perPage = 20;
    let searchQuery = '';
    let filterType = '';

    async function fetchFiles() {
        const { data, error } = await db
            .from('files')
            .select('*, profiles(name)')
            .order('created_at', { ascending: false });

        if (error) {
            console.error(error);
            // Fallback: fetch without join
            const { data: fallback } = await db
                .from('files')
                .select('*')
                .order('created_at', { ascending: false });
            return fallback || [];
        }
        return data || [];
    }

    function getFiltered() {
        let result = allFiles;
        if (filterType) result = result.filter(f => f.type === filterType);
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            result = result.filter(f =>
                (f.name || '').toLowerCase().includes(q) ||
                (f.type || '').toLowerCase().includes(q)
            );
        }
        return result;
    }

    function render() {
        const filtered = getFiltered();
        const totalPages = Math.ceil(filtered.length / perPage);
        const start = (currentPage - 1) * perPage;
        const pageFiles = filtered.slice(start, start + perPage);

        const typeIcons = {
            image: 'image', video: 'videocam', music: 'music_note', document: 'article'
        };

        container.innerHTML = `
            <div class="card">
                <div class="card-header" style="flex-wrap:wrap;gap:12px">
                    <h2>All Files (${filtered.length})</h2>
                    <div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center">
                        <div class="search-bar" style="max-width:280px">
                            <span class="material-icons-round">search</span>
                            <input type="text" placeholder="Search files..." id="file-search" value="${escapeHtml(searchQuery)}">
                        </div>
                        <select id="file-type-filter" style="padding:8px 12px;border-radius:8px;border:1.5px solid var(--border);font-family:inherit;font-size:0.85rem;background:var(--bg);cursor:pointer">
                            <option value="">All Types</option>
                            <option value="image" ${filterType === 'image' ? 'selected' : ''}>Photos</option>
                            <option value="video" ${filterType === 'video' ? 'selected' : ''}>Videos</option>
                            <option value="music" ${filterType === 'music' ? 'selected' : ''}>Music</option>
                            <option value="document" ${filterType === 'document' ? 'selected' : ''}>Documents</option>
                        </select>
                    </div>
                </div>

                <div class="table-wrapper">
                    <table>
                        <thead>
                            <tr>
                                <th>File</th>
                                <th>Type</th>
                                <th>Size</th>
                                <th>Owner</th>
                                <th>Uploaded</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${pageFiles.map(f => `
                                <tr>
                                    <td style="display:flex;align-items:center;gap:10px;">
                                        <span class="material-icons-round" style="color:var(--${f.type === 'image' ? 'blue' : f.type === 'video' ? 'purple' : f.type === 'music' ? 'green' : 'teal'})">${typeIcons[f.type] || 'description'}</span>
                                        <span style="max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;display:block">${escapeHtml(f.name || 'Untitled')}</span>
                                    </td>
                                    <td><span class="badge ${f.type || ''}">${f.type || '-'}</span></td>
                                    <td>${formatBytes(f.size || 0)}</td>
                                    <td style="font-size:0.85rem">${escapeHtml(f.profiles?.name || f.user_id?.slice(0, 8) + '...' || '-')}</td>
                                    <td style="font-size:0.85rem">${timeAgo(f.created_at)}</td>
                                    <td>
                                        <button class="btn btn-red btn-sm delete-file-btn" data-id="${f.id}" data-name="${escapeHtml(f.name || 'File')}" data-mid="${f.message_id || ''}">
                                            <span class="material-icons-round">delete</span>
                                        </button>
                                    </td>
                                </tr>
                            `).join('')}
                            ${pageFiles.length === 0 ? '<tr><td colspan="6" style="text-align:center;color:var(--text-secondary);padding:40px">No files found</td></tr>' : ''}
                        </tbody>
                    </table>
                </div>

                ${totalPages > 1 ? `
                <div class="pagination">
                    ${currentPage > 1 ? `<button class="page-btn" data-page="${currentPage - 1}">‹</button>` : ''}
                    ${Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                        let p;
                        if (totalPages <= 7) p = i + 1;
                        else if (currentPage <= 4) p = i + 1;
                        else if (currentPage >= totalPages - 3) p = totalPages - 6 + i;
                        else p = currentPage - 3 + i;
                        return `<button class="page-btn ${p === currentPage ? 'active' : ''}" data-page="${p}">${p}</button>`;
                    }).join('')}
                    ${currentPage < totalPages ? `<button class="page-btn" data-page="${currentPage + 1}">›</button>` : ''}
                </div>` : ''}
            </div>
        `;

        // Events
        document.getElementById('file-search')?.addEventListener('input', (e) => {
            searchQuery = e.target.value;
            currentPage = 1;
            render();
        });

        document.getElementById('file-type-filter')?.addEventListener('change', (e) => {
            filterType = e.target.value;
            currentPage = 1;
            render();
        });

        document.querySelectorAll('.page-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                currentPage = parseInt(btn.dataset.page);
                render();
            });
        });

        document.querySelectorAll('.delete-file-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                showDeleteFileConfirm(btn.dataset.id, btn.dataset.name, btn.dataset.mid);
            });
        });
    }

    function showDeleteFileConfirm(fileId, fileName, messageId) {
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay';
        overlay.innerHTML = `
            <div class="modal">
                <h3>Delete File?</h3>
                <p style="color:var(--text-secondary)">
                    Delete <strong>${escapeHtml(fileName)}</strong>? This removes it from the database.
                </p>
                <div class="modal-actions">
                    <button class="btn btn-blue cancel-btn">Cancel</button>
                    <button class="btn btn-red confirm-btn">Delete</button>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);
        overlay.querySelector('.cancel-btn').addEventListener('click', () => overlay.remove());
        overlay.querySelector('.confirm-btn').addEventListener('click', async () => {
            // Try backend delete (Telegram + DB)
            if (messageId) {
                try {
                    await fetch(`${BACKEND_URL}/api/delete`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ message_id: parseInt(messageId), supabase_id: fileId }),
                    });
                } catch (e) {
                    // Fallback: just delete from DB
                    await db.from('files').delete().eq('id', fileId);
                }
            } else {
                await db.from('files').delete().eq('id', fileId);
            }

            overlay.remove();
            showToast('File deleted', 'success');
            allFiles = await fetchFiles();
            render();
        });
    }

    // Initial load
    allFiles = await fetchFiles();
    render();
});

