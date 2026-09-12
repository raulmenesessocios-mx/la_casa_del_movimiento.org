(function () {
    // 1. Core Config (Single Source of Truth)
    const CONFIG = {
        URL: 'https://ilmkmivwhfjlvznrsgoc.supabase.co',
        ANON_KEY: import.meta.env.ANON_KEY
    };

    // Exponer credenciales globalmente de forma controlada para flujos paralelos
    window.AppConfig = CONFIG;

    // 2. Inicialización Blindada (Patrón Singleton)
    window.initSupabase = function() {
        if (window.supabaseClient) return window.supabaseClient;

        // Validación de infraestructura (SDK del CDN)
        if (!window.supabase || typeof window.supabase.createClient !== 'function') {
            console.error('🚨 Falla de infraestructura: El SDK de Supabase no está inyectado en el DOM.');
            return null;
        }

        // ✅ Instanciamos SIN destruir el namespace original de window.supabase
        window.supabaseClient = window.supabase.createClient(CONFIG.URL, CONFIG.ANON_KEY);
        window.dbClient = window.supabaseClient; // Alias por retrocompatibilidad para tus otros scripts
        
        return window.supabaseClient;
    };

    // Auto-ejecución controlada
    initSupabase();

    // 3. Obtener perfil del usuario desde DB
    window.getUserRole = async function (userId) {
        try {
            const client = window.supabaseClient;
            if (!client) throw new Error("Cliente DB no disponible.");

            const { data, error } = await client
                .from('autores')
                .select('id, nombre, email, rol')
                .eq('id', userId)
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('❌ Error en fetch de perfil:', error.message);
            return null;
        }
    };

    // 4. Logout Centralizado (Purga total)
    window.logout = async function () {
        if (window.supabaseClient?.auth) {
            await window.supabaseClient.auth.signOut();
        }
        // Purga agresiva de caché local para evitar sesiones fantasma
        localStorage.clear();
        sessionStorage.clear();
        window.location.href = '../../index.html';
    };

    // 5. Gestión de Sesión (Caché Unificada)
    // Se consolida en un solo JSON para evitar accesos múltiples al disco
    window.saveSessionToLocalStorage = function (user, role, userName) {
        const sessionPayload = {
            user: user,
            role: role,
            userName: userName,
            userId: user?.id,
            timestamp: new Date().getTime() // Útil para validaciones de caducidad futuras
        };
        localStorage.setItem('app_session_cache', JSON.stringify(sessionPayload));
    };

    window.getSessionFromLocalStorage = function () {
        try {
            const cached = localStorage.getItem('app_session_cache');
            if (!cached) return null;
            return JSON.parse(cached);
        } catch (e) {
            console.error('⚠️ Corrupción en caché de sesión detectada. Purgando...', e);
            localStorage.removeItem('app_session_cache');
            return null;
        }
    };

    // 6. Firewall de Rutas (Middleware de Frontend)
    window.protectRoute = function (requiredRole = null) {
        const session = window.getSessionFromLocalStorage();
        
        if (!session) {
            console.warn("🛡️ Firewall: Intento de acceso sin sesión activa.");
            window.location.href = '../../index.html';
            return null;
        }

        const currentRole = session.role;

        // Override absoluto: Management tiene pase libre
        if (currentRole === 'superior') {
            return session;
        }

        // Validación estricta de Roles (RBAC)
        if (requiredRole) {
            const allowedRoles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
            if (!allowedRoles.includes(currentRole)) {
                alert('⛔ Privilegios insuficientes para este módulo.');
                window.location.href = '../../index.html'; 
                return null;
            }
        }

        return session;
    };
})();