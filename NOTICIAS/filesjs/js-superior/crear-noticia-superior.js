// Variable de control global para evitar doble ejecución en milisegundos
let isSubmittingNoticia = false;

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('crearNoticiaFormSuperior');
    if (form && !form.dataset.listenerAttached) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            await createNoticiaSuperior();
        });
        form.dataset.listenerAttached = 'true';
    }
});

// --- AQUÍ ESTÁ TU PREVISUALIZACIÓN RESTAURADA ---
function previewNoticiaImagenSuperior(event) {
    const file = event.target.files[0];
    if (!file) return;

    if (file.type !== 'image/webp') {
        alert('⚠️ Solo se permiten imágenes en formato .webp');
        event.target.value = ''; // Resetea el input
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        const preview = document.getElementById('noticiaImagenPreviewSuperior');
        if (preview) {
            preview.src = e.target.result;
            preview.style.display = 'block'; // Asegura que se vea
        }
    };
    reader.readAsDataURL(file);
}
// ------------------------------------------------

async function createNoticiaSuperior() {
    // 1. Bloqueo inmediato síncrono si ya hay un envío en curso
    if (isSubmittingNoticia) return;

    const form = document.getElementById('crearNoticiaFormSuperior');
    const submitBtn = form?.querySelector('button[type="submit"]');
    const originalBtnText = submitBtn ? submitBtn.innerText : 'Publicar Noticia';

    try {
        // Activamos el flag y bloqueamos el botón INMEDIATAMENTE
        isSubmittingNoticia = true;
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerText = 'Publicando noticia...';
        }

        const client = window.supabaseClient || window.dbClient;
        if (!client) throw new Error("Cliente de Supabase no disponible.");

        const { data: { user } } = await client.auth.getUser();
        if (!user) {
            alert('⚠️ Debes iniciar sesión para publicar.');
            return;
        }

        // Obtener la ficha de autor vinculada al correo del usuario
        const { data: autor, error: autorErr } = await client
            .from('autores')
            .select('id')
            .eq('email', user.email)
            .single();

        if (autorErr || !autor) {
            alert('⚠️ No se encontró la ficha de autor asociada a tu usuario.');
            return;
        }

        const titulo = document.getElementById('noticiaTitleSuperior')?.value.trim();
        const resumen = document.getElementById('noticiaResumenSuperior')?.value.trim();
        const cuerpo = document.getElementById('noticiaCuerpoSuperior')?.value.trim();
        const categorySlug = document.getElementById('noticiaCategoriaSuperior')?.value;
        const destacada = document.getElementById('noticiaDestacadaSuperior')?.checked || false;
        const fileInput = document.getElementById('noticiaImagenFileSuperior');
        const file = fileInput ? fileInput.files[0] : null;

        // Validaciones básicas antes de procesar imagen
        if (!titulo || !resumen || !cuerpo || !categorySlug) {
            alert('⚠️ Por favor completa todos los campos requeridos.');
            // En validaciones manuales, reactivamos manualmente aquí o dejamos que finally lo haga
            return; 
        }

        // Obtener la categoría por su slug
        const { data: catData, error: catErr } = await client
            .from('categorias')
            .select('id')
            .eq('slug', categorySlug)
            .single();

        if (catErr) throw catErr;

        // 2. Procesamiento de imagen en .webp
        let imagenId = null;
        if (file) {
            if (file.type !== 'image/webp') {
                throw new Error('La imagen debe estar en formato .webp');
            }

            const fileName = `noticia-superior-${Date.now()}.webp`;
            const filePath = `noticias/${fileName}`;

            const { error: uploadError } = await client.storage
                .from('IMAGENES')
                .upload(filePath, file, { upsert: true, contentType: 'image/webp' });

            if (uploadError) throw uploadError;

            const { data: publicUrlData } = client.storage
                .from('IMAGENES')
                .getPublicUrl(filePath);

            const { data: imgRecord, error: imgError } = await client
                .from('imagenes')
                .insert({ url: publicUrlData.publicUrl, alt_texto: `Imagen noticia: ${titulo}` })
                .select('id')
                .single();

            if (imgError) throw imgError;
            imagenId = imgRecord.id;
        }

        // 3. Inserción con estado publicado (Rol Superior publica directamente)
        const insertPayload = {
            titulo,
            resumen,
            cuerpo,
            autor_id: autor.id,
            categoria_id: catData.id,
            publicado: true,
            estado: 'publicado',
            destacada,
            fecha_publicacion: new Date().toISOString()
        };

        if (imagenId) {
            insertPayload.imagen_id = imagenId;
        }

        const { error: insertErr } = await client
            .from('noticias')
            .insert(insertPayload);

        if (insertErr) throw insertErr;

        // ÚNICA ALERTA DE ÉXITO
        alert('🚀 ¡Noticia publicada con éxito!');

        // 4. Limpieza del formulario
        if (form) form.reset();
        if (fileInput) fileInput.value = '';

        // Resetear la previsualización al estado por defecto
        const preview = document.getElementById('noticiaImagenPreviewSuperior');
        if (preview) {
            preview.src = 'https://placehold.co/600x300?text=Previsualizaci%C3%B3n+de+Imagen';
        }

        // 5. Recargar la tabla (si existe la función)
        if (typeof loadMisNoticiasSuperior === 'function') {
            await loadMisNoticiasSuperior();
        }

    } catch (error) {
        console.error('Error al crear noticia (Superior):', error);
        alert('❌ Error al publicar la noticia: ' + error.message);
    } finally {
        // Desbloquear bandera y botón SIEMPRE al finalizar (éxito o error)
        isSubmittingNoticia = false;
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerText = originalBtnText;
        }
    }
}