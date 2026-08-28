async function loadProfileData(userId) {
    try {
        const { data, error } = await window.supabaseClient
            .from('autores')
            .select(`
                nombre, 
                email, 
                biografia,
                foto:foto_id(url)
            `)
            .eq('id', userId)
            .single();

        if (error) throw error;

        document.getElementById('profileName').value = data.nombre;
        document.getElementById('profileEmail').value = data.email;
        document.getElementById('profileBio').value = data.biografia || '';

        const preview = document.getElementById('profileAvatarPreview');
        if (preview) {
            preview.src = data.foto?.url || 'https://placehold.co/150x150?text=Sin+Foto';
        }
    } catch (error) {
        console.error('Error cargando perfil:', error);
    }
}

async function updateProfile() {
    const userId = localStorage.getItem('userId');
    const bio = document.getElementById('profileBio').value;
    const fileInput = document.getElementById('profileAvatarFile');
    const file = fileInput ? fileInput.files[0] : null;

    try {
        let fotoId = null;

        if (file) {
            if (file.type !== 'image/webp') {
                alert('⚠️ El archivo debe estar en formato .webp');
                return;
            }

            const fileName = `perfil-${Date.now()}.webp`;
            const filePath = `perfiles/${fileName}`;

            const { error: uploadError } = await window.supabaseClient.storage
                .from('IMAGENES')
                .upload(filePath, file, { upsert: true, contentType: 'image/webp' });

            if (uploadError) throw uploadError;

            const { data: publicUrlData } = window.supabaseClient.storage
                .from('IMAGENES')
                .getPublicUrl(filePath);

            const { data: imgRecord, error: imgError } = await window.supabaseClient
                .from('imagenes')
                .insert({ url: publicUrlData.publicUrl, alt_texto: `Avatar de usuario ${userId}` })
                .select('id')
                .single();

            if (imgError) throw imgError;
            fotoId = imgRecord.id;
        }

        const updateData = { biografia: bio };
        if (fotoId) {
            updateData.foto_id = fotoId;
        }

        const { error } = await window.supabaseClient
            .from('autores')
            .update(updateData)
            .eq('id', userId);

        if (error) throw error;
        alert('✅ Perfil actualizado correctamente');
    } catch (error) {
        console.error('Error al actualizar perfil:', error);
        alert('❌ Error al actualizar perfil: ' + error.message);
    }
}

// ============================
// PREVISUALIZAR NUEVA FOTO
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
        document.getElementById('profileAvatarPreview').src = e.target.result;
    };
    reader.readAsDataURL(file);
}

// ============================
// CONECTAR BOTÓN "CAMBIAR FOTO" CON EL INPUT OCULTO
// ============================
document.addEventListener('DOMContentLoaded', () => {
    const btnCambiarFoto = document.getElementById('btnCambiarFoto');
    const fileInput = document.getElementById('profileAvatarFile');

    if (btnCambiarFoto && fileInput) {
        btnCambiarFoto.addEventListener('click', () => fileInput.click());
    }
});

async function solicitarRestablecimiento() {
    // 1. Mostrar la confirmación
    const confirmacion = confirm("¿Estás seguro de restablecer la contraseña? Le llegará un email para confirmar que eres tú.");
    
    if (!confirmacion) return; // Si el usuario cancela, no hacemos nada

    try {
        // 2. Obtener el usuario actual
        const { data: { user }, error: userError } = await window.dbClient.auth.getUser();
        if (userError || !user) throw new Error("No se pudo identificar tu sesión.");

        // 3. Enviar el correo de Supabase indicando a dónde debe redirigir el enlace del correo
        const { data, error } = await window.dbClient.auth.resetPasswordForEmail(user.email, {
            // ⚠️ IMPORTANTE: Cambia esto por la URL de tu página local o en producción
            redirectTo: 'https://la-casa-del-movimiento.netlify.app/noticias/actualizar-contrasena.html' 
        });

        if (error) throw error;

        alert("✅ ¡Listo! Te hemos enviado un correo con las instrucciones.");

    } catch (error) {
        console.error("Error al enviar correo de restablecimiento:", error);
        alert("❌ Error: " + error.message);
    }
}