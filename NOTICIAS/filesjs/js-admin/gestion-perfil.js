document.addEventListener('DOMContentLoaded', () => {
    loadUserProfile();

    // Conectar el botón "Cambiar foto" con el input oculto
    const btnCambiarFoto = document.getElementById('btnCambiarFoto');
    const fileInput = document.getElementById('profileAvatarFile');

    if (btnCambiarFoto && fileInput) {
        btnCambiarFoto.addEventListener('click', () => fileInput.click());
    }
});

// Función auxiliar para obtener la instancia activa de Supabase
function getSupabaseClient() {
    return window.supabaseClient || window.dbClient || window.supabase;
}

// ============================
// CARGAR DATOS DEL PERFIL
// ============================
async function loadUserProfile() {
    try {
        const client = getSupabaseClient();
        if (!client) return;

        const { data: { user }, error: authError } = await client.auth.getUser();
        if (authError || !user) return;

        // Consultar los datos personales y la relación con la foto de perfil
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
        console.error('Error cargando perfil:', error.message);
    }
}

// ============================
// ACTUALIZAR PERFIL Y SUBIR FOTO
// ============================
async function updateProfile() {
    const submitBtn = document.querySelector('#perfil .btn-primary');
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Guardando...';
    }

    try {
        const client = getSupabaseClient();
        if (!client) throw new Error('No se encontró el cliente de Supabase.');

        const { data: { user }, error: authError } = await client.auth.getUser();
        if (authError || !user) throw new Error('No se encontró sesión activa.');

        const bio = document.getElementById('profileBio').value.trim();
        const fileInput = document.getElementById('profileAvatarFile');
        const file = fileInput ? fileInput.files[0] : null;

        let fotoId = null;

        // Subir nueva foto si el usuario seleccionó un archivo
        if (file) {
            if (file.type !== 'image/webp') {
                alert('⚠️ El archivo debe estar en formato .webp');
                return;
            }

            const fileName = `perfil-${Date.now()}.webp`;
            const filePath = `perfiles/${fileName}`;

            // 1. Subir al bucket 'IMAGENES'
            const { error: uploadError } = await client.storage
                .from('IMAGENES')
                .upload(filePath, file, { upsert: true, contentType: 'image/webp' });

            if (uploadError) throw uploadError;

            // 2. Obtener URL pública
            const { data: publicUrlData } = client.storage
                .from('IMAGENES')
                .getPublicUrl(filePath);

            // 3. Crear registro en la tabla 'imagenes'
            const { data: imgRecord, error: imgError } = await client
                .from('imagenes')
                .insert({ url: publicUrlData.publicUrl, alt_texto: `Avatar de usuario ${user.id}` })
                .select('id')
                .single();

            if (imgError) throw imgError;
            fotoId = imgRecord.id;
        }

        // Actualizar datos en la tabla 'autores'
        const updateData = { biografia: bio };
        if (fotoId) {
            updateData.foto_id = fotoId;
        }

        const { error } = await client
            .from('autores')
            .update(updateData)
            .eq('id', user.id);

        if (error) throw error;
        alert('✅ Perfil actualizado correctamente');
    } catch (error) {
        console.error('Error al actualizar perfil:', error);
        alert('❌ Error al actualizar perfil: ' + error.message);
    } finally {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Guardar Cambios';
        }
    }
}

// ============================
// PREVISUALIZAR IMAGEN
// ============================
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
        if (preview) {
            preview.src = e.target.result;
        }
    };
    reader.readAsDataURL(file);
}

// ============================
// RESTABLECER CONTRASEÑA
// ============================
async function solicitarRestablecimiento() {
    const confirmacion = confirm("¿Estás seguro de restablecer la contraseña? Te llegará un correo para confirmar que eres tú.");
    if (!confirmacion) return;

    try {
        const client = getSupabaseClient();
        if (!client) throw new Error("No se encontró el cliente de Supabase cargado.");

        const { data: { user }, error: userError } = await client.auth.getUser();
        if (userError || !user) throw new Error("No se pudo identificar la sesión activa.");

        const redirectUrl = 'https://la-casa-del-movimiento.netlify.app/noticias/pages/actualizar-contrasena.html';

        const { error } = await client.auth.resetPasswordForEmail(user.email, {
            redirectTo: redirectUrl
        });

        if (error) throw error;

        alert("✅ ¡Listo! Revisa tu correo electrónico para restablecer tu contraseña.");

    } catch (error) {
        console.error("Error al enviar correo de restablecimiento:", error);
        alert("❌ Error: " + error.message);
    }
}