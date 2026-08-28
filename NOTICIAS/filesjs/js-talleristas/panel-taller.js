// Protección de ruta (solo talleristas)
const session = protectRoute('tallerista');

if (session) {
    document.getElementById('userName').textContent = session.userName;

    // Inicializar cargas de datos desde sus respectivos archivos .js
    loadProfileData(session.userId);
    loadMyTaller(session.userId);
    loadInteresados(session.userId);
    loadMyNoticias(session.userId);

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

    // Enlace del evento para enviar noticias
    const noticiaForm = document.getElementById('crearNoticiaForm');
    if (noticiaForm) {
        noticiaForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await createNoticia(session.userId);
        });
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
        window.location.href = '../index.html';
    }
}