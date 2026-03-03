// ============================================================
// SPA Hash Router
// ============================================================
const Router = {
    pages: {},
    
    register(name, renderFn) {
        this.pages[name] = renderFn;
    },

    async navigate(page) {
        const container = document.getElementById('page-content');
        const titleEl = document.getElementById('page-title');

        // Update sidebar active state
        document.querySelectorAll('.nav-item').forEach(el => {
            el.classList.toggle('active', el.dataset.page === page);
        });

        // Update page title
        const titles = {
            dashboard: 'Dashboard',
            users: 'Users',
            files: 'Files',
            analytics: 'Analytics',
            settings: 'Settings',
        };
        titleEl.textContent = titles[page] || 'Dashboard';

        // Show loading
        container.innerHTML = `<div class="loading-spinner"><div class="spinner"></div></div>`;

        // Render page
        if (this.pages[page]) {
            try {
                await this.pages[page](container);
            } catch (err) {
                console.error('Page render error:', err);
                container.innerHTML = `<div class="empty-state">
                    <span class="material-icons-round">error_outline</span>
                    <p>Failed to load page. Check console.</p>
                </div>`;
            }
        } else {
            container.innerHTML = `<div class="empty-state">
                <span class="material-icons-round">help_outline</span>
                <p>Page not found</p>
            </div>`;
        }

        // Close mobile sidebar
        document.getElementById('sidebar').classList.remove('open');
        const overlay = document.querySelector('.sidebar-overlay');
        if (overlay) overlay.remove();
    },

    init() {
        window.addEventListener('hashchange', () => {
            const page = location.hash.replace('#', '') || 'dashboard';
            this.navigate(page);
        });
    },

    start() {
        const page = location.hash.replace('#', '') || 'dashboard';
        this.navigate(page);
    }
};
