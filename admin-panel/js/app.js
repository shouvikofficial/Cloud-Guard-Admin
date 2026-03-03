// ============================================================
// Cloud Guard Admin — Main App Controller
// ============================================================

(function() {
    const loginScreen = document.getElementById('login-screen');
    const appShell = document.getElementById('app-shell');
    const loginForm = document.getElementById('login-form');
    const loginError = document.getElementById('login-error');
    const adminEmailEl = document.getElementById('admin-email');
    const sidebarToggle = document.getElementById('sidebar-toggle');
    const sidebar = document.getElementById('sidebar');
    const logoutBtn = document.getElementById('logout-btn');

    // Safety check
    if (!authClient || !db) {
        loginError.textContent = 'Supabase not loaded. Refresh the page.';
        loginError.classList.remove('hidden');
        return;
    }

    // ── AUTH: Check existing session ──
    authClient.auth.getSession().then(function({ data }) {
        if (data && data.session) {
            checkAdmin(data.session.user);
        }
    });

    // ── Check if user is admin ──
    function checkAdmin(user) {
        db.from('profiles').select('is_admin').eq('id', user.id).single()
            .then(function(result) {
                if (result.data && result.data.is_admin === true) {
                    showApp(user);
                } else {
                    // Not admin — sign out and show error
                    authClient.auth.signOut();
                    loginScreen.classList.remove('hidden');
                    appShell.classList.add('hidden');
                    loginError.textContent = 'Access denied. Admin privileges required.';
                    loginError.classList.remove('hidden');
                }
            })
            .catch(function() {
                authClient.auth.signOut();
                loginError.textContent = 'Failed to verify admin status.';
                loginError.classList.remove('hidden');
            });
    }

    // ── LOGIN ──
    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        e.stopPropagation();

        const email = document.getElementById('login-email').value.trim();
        const password = document.getElementById('login-password').value;
        const btn = document.getElementById('login-btn');

        // Show loading
        btn.querySelector('.btn-text').textContent = 'Signing in...';
        btn.querySelector('.btn-loader').classList.remove('hidden');
        loginError.classList.add('hidden');

        authClient.auth.signInWithPassword({ email: email, password: password })
            .then(function(result) {
                var data = result.data;
                var error = result.error;

                if (error) {
                    btn.querySelector('.btn-text').textContent = 'Sign In';
                    btn.querySelector('.btn-loader').classList.add('hidden');
                    loginError.textContent = error.message;
                    loginError.classList.remove('hidden');
                    return;
                }

                if (data && data.user) {
                    // Check admin before granting access
                    db.from('profiles').select('is_admin').eq('id', data.user.id).single()
                        .then(function(profileRes) {
                            btn.querySelector('.btn-text').textContent = 'Sign In';
                            btn.querySelector('.btn-loader').classList.add('hidden');

                            if (profileRes.data && profileRes.data.is_admin === true) {
                                showApp(data.user);
                            } else {
                                authClient.auth.signOut();
                                loginError.textContent = 'Access denied. Admin privileges required.';
                                loginError.classList.remove('hidden');
                            }
                        });
                } else {
                    btn.querySelector('.btn-text').textContent = 'Sign In';
                    btn.querySelector('.btn-loader').classList.add('hidden');
                    loginError.textContent = 'No user returned. Check credentials.';
                    loginError.classList.remove('hidden');
                }
            })
            .catch(function(err) {
                btn.querySelector('.btn-text').textContent = 'Sign In';
                btn.querySelector('.btn-loader').classList.add('hidden');
                loginError.textContent = 'Error: ' + err.message;
                loginError.classList.remove('hidden');
            });
    });

    // ── LOGOUT ──
    logoutBtn.addEventListener('click', function() {
        authClient.auth.signOut().then(function() {
            appShell.classList.add('hidden');
            loginScreen.classList.remove('hidden');
            document.getElementById('login-email').value = '';
            document.getElementById('login-password').value = '';
        });
    });

    // ── SIDEBAR TOGGLE (Mobile) ──
    sidebarToggle.addEventListener('click', function() {
        sidebar.classList.toggle('open');
        if (sidebar.classList.contains('open')) {
            var overlay = document.createElement('div');
            overlay.className = 'sidebar-overlay';
            overlay.addEventListener('click', function() {
                sidebar.classList.remove('open');
                overlay.remove();
            });
            document.body.appendChild(overlay);
        } else {
            var ov = document.querySelector('.sidebar-overlay');
            if (ov) ov.remove();
        }
    });

    // ── Show App ──
    function showApp(user) {
        loginScreen.classList.add('hidden');
        appShell.classList.remove('hidden');
        adminEmailEl.textContent = user.email || 'Admin';
        Router.init();
        Router.start();
    }
})();

// ── Toast Notification ──
function showToast(message, type) {
    type = type || '';
    var existing = document.querySelector('.toast');
    if (existing) existing.remove();
    var toast = document.createElement('div');
    toast.className = 'toast ' + type;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(function() { toast.remove(); }, 3500);
}