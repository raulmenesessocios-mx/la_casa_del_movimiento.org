document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('loginForm');
    const errorDiv = document.getElementById('errorMessage');
    const loadingDiv = document.getElementById('loadingMessage');
    const submitBtn = document.getElementById('submitBtn');

    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;

        errorDiv.classList.add('is-hidden');
        loadingDiv.classList.remove('is-hidden');
        submitBtn.disabled = true;

        try {
            // 1. Autenticar en Supabase Auth
            const { data: authData, error: authError } = await window.supabaseClient.auth.signInWithPassword({
                email,
                password
            });

            // Manejo de error de credenciales sin lanzar excepción (evita ensuciar el stack trace)
            if (authError) {
                errorDiv.textContent = 'Email o contraseña incorrectos.';
                errorDiv.classList.remove('is-hidden');
                return;
            }

            // 2. Obtener rol desde la tabla 'autores'
            const userProfile = await getUserRole(authData.user.id);

            if (!userProfile) {
                errorDiv.textContent = 'El perfil de usuario no está registrado en la base de datos.';
                errorDiv.classList.remove('is-hidden');
                return;
            }

            // 3. Guardar estado y redirigir
            saveSessionToLocalStorage(authData.user, userProfile.rol, userProfile.nombre);
            redirectByRole(userProfile.rol);

        } catch (error) {
            // Este bloque ahora solo procesará fallos críticos de red o sintaxis insalvables
            errorDiv.textContent = 'Ocurrió un error inesperado al procesar la solicitud.';
            errorDiv.classList.remove('is-hidden');
        } finally {
            loadingDiv.classList.add('is-hidden');
            submitBtn.disabled = false;
        }
    });
});

function redirectByRole(role) {
    if (role === 'superior') {
        window.location.href = 'pages/perfil-superior.html';
    } else if (role === 'administrativo') {
        window.location.href = 'pages/admin-dashboard.html';
    } else if (role === 'tallerista') {
        window.location.href = 'pages/perfil-tallerista.html';
    } else {
        window.location.href = '../../index.html';
    }
}