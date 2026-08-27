// Instancia global unificada de cliente
window.dbClient = window.supabaseClient || window.supabase;

document.addEventListener('DOMContentLoaded', () => {
    // 1. Cargar nombre del usuario autenticado
    loadAdminUserName();

    // 2. Inicialización del Dashboard
    if (typeof loadDashboardStats === 'function') loadDashboardStats();

    // 3. Navegación entre pestañas/secciones
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const sectionId = link.getAttribute('href').substring(1);
            showSection(sectionId);
            document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
            link.classList.add('active');
        });
    });
});

// Función para obtener y mostrar el nombre en #userName
async function loadAdminUserName() {
    try {
        const elUserName = document.getElementById('userName');
        if (!elUserName) return;

        // Obtener usuario autenticado actual
        const { data: { user }, error: authError } = await window.dbClient.auth.getUser();
        if (authError || !user) return;

        // Consultar el nombre registrado en la tabla 'autores'
        const { data: profile } = await window.dbClient
            .from('autores')
            .select('nombre')
            .eq('id', user.id)
            .single();

        if (profile && profile.nombre) {
            elUserName.textContent = profile.nombre;
        } else {
            // Respaldos por si no encuentra el nombre en la tabla
            elUserName.textContent = localStorage.getItem('userName') || user.email;
        }
    } catch (error) {
        console.error('Error al cargar nombre del usuario:', error);
    }
}

function showSection(sectionId) {
    document.querySelectorAll('.section').forEach(s => s.style.display = 'none');
    const target = document.getElementById(sectionId);
    if (target) target.style.display = 'block';
}

async function logout() {
    try {
        if (window.dbClient && window.dbClient.auth) {
            await window.dbClient.auth.signOut();
        }
    } catch (error) {
        console.error('Error al cerrar sesión:', error.message);
    } finally {
        localStorage.clear();
        sessionStorage.clear();
        window.location.href = '../../index.html';
    }
}