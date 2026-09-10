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

function previewNoticiaImagenSuperior(event) {
    const file = event.target.files[0];
    if (!file) return;

    if (file.type !== 'image/webp') {
        alert('⚠️ Solo se permiten imágenes en formato .webp');
        event.target.value = '';
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        const preview = document.getElementById('noticiaImagenPreviewSuperior');
        if (preview) preview.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

async function createNoticiaSuperior() {
    try {
        const client = window.supabaseClient || window.dbClient;
        if (!client) throw new Error("Cliente de Supabase no disponible.");

        const { data: { user } } = await client.auth.getUser();
        if (!user) {
            alert('⚠️ Debes iniciar sesión para publicar.');
            return;
        }

        // 1. Obtener la ficha de autor vinculada al correo del usuario
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

        if (!titulo || !resumen || !cuerpo || !categorySlug) {
            alert('⚠️ Por favor completa todos los campos requeridos.');
            return;
        }

        // 2. Obtener la categoría por su slug
        const { data: catData, error: catErr } = await client
            .from('categorias')
            .select('id')
            .eq('slug', categorySlug)
            .single();

        if (catErr) throw catErr;

        // 3. Procesamiento de imagen en .webp
        let imagenId = null;
        if (file) {
            if (file.type !== 'image/webp') {
                alert('⚠️ La imagen debe estar en formato .webp');
                return;
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

        // 4. Inserción con estado publicado (Rol Superior publica directamente)
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

        alert('🚀 ¡Noticia publicada con éxito!');

        const form = document.getElementById('crearNoticiaFormSuperior');
        if (form) form.reset();
        if (fileInput) fileInput.value = '';

        const preview = document.getElementById('noticiaImagenPreviewSuperior');
        if (preview) preview.src = 'https://placehold.co/600x300?text=Previsualizaci%C3%B3n+de+Imagen';

        if (typeof loadMisNoticiasSuperior === 'function') {
            loadMisNoticiasSuperior();
        }

    } catch (error) {
        console.error('Error al crear noticia (Superior):', error);
        alert('❌ Error al publicar la noticia: ' + error.message);
    }
}