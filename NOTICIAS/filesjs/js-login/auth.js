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

        errorDiv.style.display = 'none';
        loadingDiv.style.display = 'block';
        submitBtn.disabled = true;

        try {
            // 1. Autenticar en Supabase Auth
            const { data: authData, error: authError } = await window.supabaseClient.auth.signInWithPassword({
                email,
                password
            });

            if (authError) throw authError;

            // 2. Obtener rol desde la tabla 'autores'
            const userProfile = await getUserRole(authData.user.id);

            if (!userProfile) {
                throw new Error('El perfil de usuario no está registrado en la base de datos.');
            }

            // 3. Guardar estado y redirigir
            saveSessionToLocalStorage(authData.user, userProfile.rol, userProfile.nombre);
            redirectByRole(userProfile.rol);

        } catch (error) {
            console.error('Login Error:', error);
            errorDiv.textContent = '❌ ' + (error.message || 'Error al iniciar sesión');
            errorDiv.style.display = 'block';
        } finally {
            loadingDiv.style.display = 'none';
            submitBtn.disabled = false;
        }
    });
});

function redirectByRole(role) {
    if (role === 'administrativo') {
        window.location.href = 'pages/admin-dashboard.html';
    } else if (role === 'tallerista') {
        window.location.href = 'pages/perfil-tallerista.html';
    } else {
        window.location.href = 'index.html';
    }
}