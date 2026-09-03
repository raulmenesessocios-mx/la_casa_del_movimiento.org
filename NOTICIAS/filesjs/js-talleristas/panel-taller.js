// Protección de ruta (solo talleristas)
const session = protectRoute('tallerista');

if (session) {
    const userNameElem = document.getElementById('userName');
    if (userNameElem) {
        userNameElem.textContent = session.userName;
    }

    // Navegación entre pestañas
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const sectionId = link.getAttribute('href').substring(1);
            showSection(sectionId);
            document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
            link.classList.add('active');
        });
    });

    // Enlace del formulario para crear noticias
    const noticiaForm = document.getElementById('crearNoticiaForm');
    if (noticiaForm) {
        noticiaForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (typeof createNoticia === 'function') {
                await createNoticia(session.userId);
            } else {
                console.error('La función createNoticia no está definida.');
            }
        });
    }

    // Inicializar cargas de datos con comprobación previa
    try {
        if (typeof loadProfileData === 'function') {
            loadProfileData(session.userId);
        }
    } catch (e) {
        console.error('Error en loadProfileData:', e);
    }

    try {
        if (typeof loadMyTaller === 'function') {
            loadMyTaller(session.userId);
        }
    } catch (e) {
        console.error('Error en loadMyTaller:', e);
    }

    try {
        if (typeof loadInteresados === 'function') {
            loadInteresados(session.userId);
        }
    } catch (e) {
        console.error('Error en loadInteresados:', e);
    }

    try {
        if (typeof loadMisNoticias === 'function') {
            loadMisNoticias();
        } else {
            console.warn('⚠️ loadMisNoticias no está definida. Revisa si mis-noticias.js está importado en el HTML.');
        }
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

    if (nav) nav.classList.toggle('active');
    if (user) user.classList.toggle('active');
}

// Cerrar el menú automáticamente al hacer clic en cualquier opción
document.querySelectorAll('.sidebar-nav a, .logout-btn').forEach(item => {
    item.addEventListener('click', () => {
        document.querySelector('.sidebar-nav')?.classList.remove('active');
        document.querySelector('.sidebar-user')?.classList.remove('active');
    });
});