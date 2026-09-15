// Instancia global del cliente de Supabase
window.dbClient = window.dbClient || window.supabaseClient;

// Protección de ruta exclusiva para el rol Superior
const session = protectRoute('superior');

if (session) {
    document.addEventListener('DOMContentLoaded', () => {
        // Cargar el nombre en el header del panel
        const userNameElem = document.getElementById('userName');
        if (userNameElem) {
            userNameElem.textContent = session.userName || localStorage.getItem('userName') || 'Usuario Superior';
        }

        // Navegación dinámica entre pestañas (.nav-link)
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const sectionId = link.getAttribute('href').substring(1);
                showSection(sectionId);
                document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
                link.classList.add('active');
            });
        });

        // Listener para el formulario de creación de noticias
        const noticiaFormSuperior = document.getElementById('crearNoticiaFormSuperior');
        if (noticiaFormSuperior) {
            noticiaFormSuperior.addEventListener('submit', async (e) => {
                e.preventDefault();
                if (typeof createNoticiaSuperior === 'function') {
                    await createNoticiaSuperior();
                } else {
                    console.error('⚠️ La función createNoticiaSuperior no está disponible.');
                }
            });
        }

        // Inicialización segura de módulos del Superior
        initSuperiorModules(session.userId);

        // Configuración del menú móvil responsive
        setupMobileMenu();
    });
}

function initSuperiorModules(userId) {
    // 1. Carga de Mi Perfil Superior
    try {
        if (typeof loadProfileDataSuperior === 'function') {
            loadProfileDataSuperior(userId);
        }
    } catch (e) {
        console.error('Error al inicializar perfil Superior:', e);
    }

    // 2. Carga de Mis Noticias (Redactadas por el Superior)
    try {
        if (typeof loadMisNoticiasSuperior === 'function') {
            loadMisNoticiasSuperior();
        }
    } catch (e) {
        console.error('Error al inicializar mis noticias Superior:', e);
    }

    // 3. Carga de Interesados/Alumnos (Pasando el userId de Auth)
    try {
        if (typeof loadInteresadosSuperior === 'function') {
            loadInteresadosSuperior(userId);
        }
    } catch (e) {
        console.error('Error al cargar interesados:', e);
    }

    // 4. Carga del Taller Propio (Corregido: pasando userId)
    try {
        if (typeof loadMyTallerSuperior === 'function') {
            loadMyTallerSuperior(userId);
        }
    } catch (e) {
        console.error('Error al cargar taller propio:', e);
    }
}

function showSection(sectionId) {
    // 1. Ocultar TODAS las secciones agregando la clase 'is-hidden'
    document.querySelectorAll('.section').forEach(s => s.classList.add('is-hidden'));
    
    // 2. Mostrar únicamente la sección seleccionada removiendo 'is-hidden'
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.classList.remove('is-hidden');
    }
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

function toggleMenu() {
    const nav = document.querySelector('.sidebar-nav');
    const user = document.querySelector('.sidebar-user');

    if (nav) nav.classList.toggle('active');
    if (user) user.classList.toggle('active');
}

function setupMobileMenu() {
    document.querySelectorAll('.sidebar-nav a, .logout-btn').forEach(item => {
        item.addEventListener('click', () => {
            document.querySelector('.sidebar-nav')?.classList.remove('active');
            document.querySelector('.sidebar-user')?.classList.remove('active');
        });
    });
}