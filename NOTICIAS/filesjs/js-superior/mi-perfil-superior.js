async function loadProfileDataSuperior(userId) {
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
        console.error('Error cargando perfil del usuario Superior:', error);
    }
}

async function updateProfileSuperior() {
        const { data: { user }, error: userError } = await window.supabaseClient.auth.getUser();
if (userError || !user) throw new Error("No hay una sesión activa de usuario.");
const userId = user.id;
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

            const fileName = `perfil-superior-${Date.now()}.webp`;
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
                .insert({ url: publicUrlData.publicUrl, alt_texto: `Avatar de usuario Superior ${userId}` })
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
        alert('✅ Perfil Superior actualizado correctamente');
    } catch (error) {
        console.error('Error al actualizar perfil Superior:', error);
        alert('❌ Error al actualizar perfil: ' + error.message);
    }
}

function previewAvatarSuperior(event) {
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

document.addEventListener('DOMContentLoaded', () => {
    const btnCambiarFoto = document.getElementById('btnCambiarFoto');
    const fileInput = document.getElementById('profileAvatarFile');

    if (btnCambiarFoto && fileInput) {
        btnCambiarFoto.addEventListener('click', () => fileInput.click());
    }
});

async function solicitarRestablecimientoSuperior() {
    const confirmacion = confirm("¿Estás seguro de restablecer la contraseña? Te llegará un correo para confirmar que eres tú.");
    if (!confirmacion) return;

    try {
        const client = window.supabaseClient || window.dbClient || window.supabase;
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