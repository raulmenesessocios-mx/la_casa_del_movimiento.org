document.addEventListener('DOMContentLoaded', () => {
    loadUserProfile();

    const btnCambiarFoto = document.getElementById('btnCambiarFoto');
    const fileInput = document.getElementById('profileAvatarFile');

    if (btnCambiarFoto && fileInput) {
        btnCambiarFoto.addEventListener('click', () => fileInput.click());
    }

    const perfilForm = document.getElementById('perfilForm') || document.querySelector('#perfil form');
    if (perfilForm && !perfilForm.dataset.listenerAttached) {
        perfilForm.addEventListener('submit', (e) => {
            e.preventDefault();
            updateProfile();
        });
        perfilForm.dataset.listenerAttached = 'true';
    }
});

function getAdminClient() {
    return window.supabaseClient || window.dbClient || window.supabase;
}

async function loadUserProfile() {
    try {
        const client = getAdminClient();
        if (!client) return;

        const { data: { user }, error: authError } = await client.auth.getUser();
        if (authError || !user) return;

        const { data, error } = await client
            .from('autores')
            .select(`
                nombre, 
                email, 
                biografia,
                foto:foto_id(url)
            `)
            .eq('id', user.id)
            .single();

        if (error) throw error;

        const elName = document.getElementById('profileName');
        const elEmail = document.getElementById('profileEmail');
        const elBio = document.getElementById('profileBio');
        const preview = document.getElementById('profileAvatarPreview');

        if (elName) elName.value = data.nombre || '';
        if (elEmail) elEmail.value = data.email || user.email || '';
        if (elBio) elBio.value = data.biografia || '';

        if (preview) {
            preview.src = data.foto?.url || 'https://placehold.co/150x150?text=Sin+Foto';
        }
    } catch (error) {
        console.error('❌ Error cargando perfil:', error.message);
    }
}

async function updateProfile() {
    const submitBtn = document.querySelector('#perfil .btn-primary') || document.getElementById('btnGuardarPerfil');
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Guardando...';
    }

    try {
        const client = getAdminClient();
        if (!client) throw new Error('No se encontró el cliente de Supabase.');

        const { data: { user }, error: authError } = await client.auth.getUser();
        if (authError || !user) throw new Error('No se encontró sesión activa.');

        const bio = document.getElementById('profileBio')?.value.trim();
        const nombreVal = document.getElementById('profileName')?.value.trim();
        const fileInput = document.getElementById('profileAvatarFile');
        const file = fileInput ? fileInput.files[0] : null;

        let fotoId = null;

        if (file) {
            if (file.type !== 'image/webp') {
                alert('⚠️ El archivo debe estar en formato .webp');
                return;
            }

            const fileName = `perfil-${Date.now()}.webp`;
            const filePath = `perfiles/${fileName}`;

            const { error: uploadError } = await client.storage
                .from('IMAGENES')
                .upload(filePath, file, { upsert: true, contentType: 'image/webp' });

            if (uploadError) throw uploadError;

            const { data: publicUrlData } = client.storage
                .from('IMAGENES')
                .getPublicUrl(filePath);

            const { data: imgRecord, error: imgError } = await client
                .from('imagenes')
                .insert({ url: publicUrlData.publicUrl, alt_texto: `Avatar de usuario ${user.id}` })
                .select('id')
                .single();

            if (imgError) throw imgError;
            fotoId = imgRecord.id;
        }

        const updateData = { 
            biografia: bio,
            actualizado_en: new Date().toISOString()
        };

        if (nombreVal) updateData.nombre = nombreVal;
        if (fotoId) updateData.foto_id = fotoId;

        const { error } = await client
            .from('autores')
            .update(updateData)
            .eq('id', user.id);

        if (error) throw error;
        alert('✅ Perfil actualizado correctamente');
        await loadUserProfile();

    } catch (error) {
        console.error('❌ Error al actualizar perfil:', error);
        alert('❌ Error al actualizar perfil: ' + error.message);
    } finally {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Guardar Cambios';
        }
    }
}

function previewAvatar(event) {
    const file = event.target.files[0];
    if (!file) return;

    if (file.type !== 'image/webp') {
        alert('⚠️ Solo se permiten imágenes en formato .webp');
        event.target.value = '';
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        const preview = document.getElementById('profileAvatarPreview');
        if (preview) preview.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

async function solicitarRestablecimiento() {
    if (!confirm("¿Estás seguro de restablecer la contraseña? Te llegará un correo para confirmar que eres tú.")) return;

    try {
        const client = getAdminClient();
        if (!client) throw new Error("No se encontró el cliente de Supabase.");

        const { data: { user }, error: userError } = await client.auth.getUser();
        if (userError || !user) throw new Error("No se pudo identificar la sesión activa.");

        // Redirección dinámica basada en la ubicación del entorno actual
        const redirectUrl = `${window.location.origin}/noticias/pages/actualizar-contrasena.html`;

        const { error } = await client.auth.resetPasswordForEmail(user.email, {
            redirectTo: redirectUrl
        });

        if (error) throw error;

        alert("✅ ¡Listo! Revisa tu correo electrónico para restablecer tu contraseña.");

    } catch (error) {
        console.error("❌ Error al enviar correo de restablecimiento:", error);
        alert("❌ Error: " + error.message);
    }
}