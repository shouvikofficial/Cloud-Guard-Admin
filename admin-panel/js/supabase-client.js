// ============================================================
// Supabase Client Init
// ============================================================

// Auth client (anon key) — used for login / logout / session
let authClient;
// Data client (service_role key) — bypasses RLS, used for all data queries
let db;

try {
    authClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: { storageKey: 'admin-auth' }
    });
    db = window.supabase.createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
        auth: { storageKey: 'admin-db', persistSession: false }
    });
    console.log('Supabase clients ready (auth + admin)');
} catch(e) {
    console.error('Supabase init failed:', e);
    document.getElementById('login-error').textContent = 'Supabase init error: ' + e.message;
    document.getElementById('login-error').classList.remove('hidden');
}
