(function () {
    const SUPABASE_URL = 'https://ilmkmivwhfjlvznrsgoc.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlsbWttaXZ3aGZqbHZ6bnJzZ29jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc3MTA1NzcsImV4cCI6MjEwMzI4NjU3N30.YXKAm5Zxeb1tm_YiVdc2myntJXDjq62biHY27XSG4-g';

    if (!window.supabaseClient) {
        // Guardamos la función original de la librería antes de sobrescribir el objeto global
        window.createSupabaseClient = window.supabase ? window.supabase.createClient : null;

        const createClient = window.createSupabaseClient;
        window.supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        window.supabase = window.supabaseClient; // Alias para compatibilidad global
    }

    // Obtener perfil del usuario desde DB
    window.getUserRole = async function (userId) {
        try {
            const { data, error } = await window.supabaseClient
                .from('autores')
                .select('id, nombre, email, rol')
                .eq('id', userId)
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error al obtener perfil:', error.message);
            return null;
        }
    };

    // Logout centralizado
    window.logout = async function () {
        localStorage.clear();
        await window.supabaseClient.auth.signOut();
        window.location.href = 'index.html';
    };

    // Gestión de Sesión Local
    window.saveSessionToLocalStorage = function (user, role, userName) {
        localStorage.setItem('userSession', JSON.stringify(user));
        localStorage.setItem('userRole', role);
        localStorage.setItem('userName', userName);
        localStorage.setItem('userId', user.id);
    };

    window.getSessionFromLocalStorage = function () {
        const session = localStorage.getItem('userSession');
        if (!session) return null;
        return {
            user: JSON.parse(session),
            role: localStorage.getItem('userRole'),
            userName: localStorage.getItem('userName'),
            userId: localStorage.getItem('userId')
        };
    };

    window.protectRoute = function (requiredRole = null) {
        const session = window.getSessionFromLocalStorage();
        if (!session) {
            window.location.href = 'index.html';
            return null;
        }
        if (requiredRole && session.role !== requiredRole) {
            alert('Acceso no autorizado.');
            window.location.href = 'index.html';
            return null;
        }
        return session;
    };
})();