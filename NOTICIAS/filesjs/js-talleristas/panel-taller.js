// Protección de ruta (solo talleristas)
const session = protectRoute('tallerista');

if (session) {
    document.getElementById('userName').textContent = session.userName;

    // Navegación entre pestañas
    // (Se registra ANTES de las cargas de datos para que el menú
    // funcione aunque alguna carga falle)
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const sectionId = link.getAttribute('href').substring(1);
            showSection(sectionId);
            document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
            link.classList.add('active');
        });
    });

    // Enlace del evento para enviar noticias
    const noticiaForm = document.getElementById('crearNoticiaForm');
    if (noticiaForm) {
        noticiaForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await createNoticia(session.userId);
        });
    }

    // Inicializar cargas de datos desde sus respectivos archivos .js
    // Cada una en su propio try/catch: si una falla, no tumba a las demás
    // ni interrumpe el registro de eventos de arriba.
    try { loadProfileData(session.userId); } catch (e) { console.error('Error en loadProfileData:', e); }
    try { loadMyTaller(session.userId); } catch (e) { console.error('Error en loadMyTaller:', e); }
    try { loadInteresados(session.userId); } catch (e) { console.error('Error en loadInteresados:', e); }
    try {
        // loadMisNoticias (definida en mis-noticias.js) no recibe userId:
        // obtiene el usuario internamente vía Supabase auth.
        loadMisNoticias();
    } catch (e) {
        console.error('Error en loadMisNoticias:', e);
    }
}

function showSection(sectionId) {
    document.querySelectorAll('.section').forEach(s => s.style.display = 'none');
    const targetSection = document.getElementById(sectionId);
    if (targetSection) targetSection.style.display = 'block';
}

async function logout() {
    try {
        if (window.supabaseClient && window.supabaseClient.auth) {
            await window.supabaseClient.auth.signOut();
        }
    } catch (error) {
        console.error('Error al cerrar sesión:', error.message);
    } finally {
        localStorage.clear();
        sessionStorage.clear();
        window.location.href = '../../index.html';
    }
}

function toggleMenu() {
    const nav = document.querySelector('.sidebar-nav');
    const user = document.querySelector('.sidebar-user');

    nav.classList.toggle('active');
    if (user) user.classList.toggle('active');
}

// Cerrar el menú automáticamente al hacer clic en cualquier opción
document.querySelectorAll('.sidebar-nav a, .logout-btn').forEach(item => {
    item.addEventListener('click', () => {
        document.querySelector('.sidebar-nav')?.classList.remove('active');
        document.querySelector('.sidebar-user')?.classList.remove('active');
    });
});