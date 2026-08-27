document.addEventListener('DOMContentLoaded', () => {
    loadUserProfile();
});

// Carga los datos del usuario autenticado en el formulario de perfil
async function loadUserProfile() {
    try {
        const { data: { user }, error: authError } = await window.dbClient.auth.getUser();
        if (authError || !user) return;

        // Obtener el perfil completo desde la tabla 'autores'
        const { data: profile, error: dbError } = await window.dbClient
            .from('autores')
            .select('nombre, email, biografia')
            .eq('id', user.id)
            .single();

        if (dbError) throw dbError;

        if (profile) {
            const elName = document.getElementById('profileName');
            const elEmail = document.getElementById('profileEmail');
            const elBio = document.getElementById('profileBio');

            if (elName) elName.value = profile.nombre || '';
            if (elEmail) elEmail.value = profile.email || user.email || '';
            if (elBio) elBio.value = profile.biografia || '';
        }
    } catch (error) {
        console.error('Error al cargar datos del perfil:', error.message);
    }
}

// Guarda la biografía y actualización de datos del perfil
async function updateProfile() {
    const submitBtn = document.querySelector('#perfil .btn-primary');
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Guardando...';
    }

    try {
        const { data: { user } } = await window.dbClient.auth.getUser();
        if (!user) throw new Error('No se encontró sesión activa.');

        const biografia = document.getElementById('profileBio').value.trim();

        const { error } = await window.dbClient
            .from('autores')
            .update({ biografia })
            .eq('id', user.id);

        if (error) throw error;

        alert('✅ Perfil actualizado correctamente');
    } catch (error) {
        console.error('Error al actualizar perfil:', error);
        alert('❌ Error al guardar perfil: ' + error.message);
    } finally {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Guardar Cambios';
        }
    }
}