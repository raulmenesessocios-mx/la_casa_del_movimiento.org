async function loadProfileData(userId) {
    try {
        const { data, error } = await window.supabaseClient
            .from('autores')
            .select('nombre, email, biografia')
            .eq('id', userId)
            .single();

        if (error) throw error;

        document.getElementById('profileName').value = data.nombre;
        document.getElementById('profileEmail').value = data.email;
        document.getElementById('profileBio').value = data.biografia || '';
    } catch (error) {
        console.error('Error cargando perfil:', error);
    }
}

async function updateProfile() {
    const userId = localStorage.getItem('userId');
    const bio = document.getElementById('profileBio').value;

    try {
        const { error } = await window.supabaseClient
            .from('autores')
            .update({ biografia: bio })
            .eq('id', userId);

        if (error) throw error;
        alert('✅ Perfil actualizado correctamente');
    } catch (error) {
        console.error('Error:', error);
        alert('❌ Error al actualizar perfil');
    }
}