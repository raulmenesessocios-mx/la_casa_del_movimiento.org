document.addEventListener('DOMContentLoaded', () => {
    cargarCategoriasCrearNoticia();

    const form = document.getElementById('crearNoticiaForm');
    if (form && !form.dataset.listenerAttached) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            await createNoticiaTallerista();
        });
        form.dataset.listenerAttached = 'true';
    }
});

function getSupabaseClient() {
    return window.supabaseClient || window.dbClient;
}

// 1. CARGA DINÁMICA DE CATEGORÍAS DE LA DB
async function cargarCategoriasCrearNoticia() {
    const selectCategoria = document.getElementById('noticiaCategoria');
    const client = getSupabaseClient();
    
    if (!selectCategoria || !client) return;

    try {
        const { data: categorias, error } = await client
            .from('categorias')
            .select('id, nombre, slug')
            .order('nombre', { ascending: true });

        if (error) throw error;

        selectCategoria.innerHTML = '<option value="">-- Selecciona una categoría --</option>';

        (categorias || []).forEach(cat => {
            const option = document.createElement('option');
            option.value = cat.id; // Asigna UUID directo
            option.textContent = cat.nombre;
            selectCategoria.appendChild(option);
        });
    } catch (err) {
        console.error('❌ Error al obtener categorías:', err.message);
        selectCategoria.innerHTML = '<option value="">Error al cargar categorías</option>';
    }
}

// 2. PREVISUALIZACIÓN DE IMAGEN LOCAL
async function previewnoticiaImagen(event) {
    const file = event.target.files[0];
    if (!file) return;

    if (file.type !== 'image/webp') {
        await Modal.alert('Solo se permiten imágenes en formato .webp', 'Formato no permitido');
        event.target.value = '';
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        const preview = document.getElementById('noticiaImagenPreview');
        if (preview) preview.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

// 3. FLUJO COMPLETO DE CREACIÓN (STORAGE + DB)
async function createNoticiaTallerista() {
    try {
        const client = getSupabaseClient();
        if (!client) throw new Error("Cliente de Supabase no disponible.");

        const { data: { user } } = await client.auth.getUser();

        if (!user) {
            await Modal.alert('Debes iniciar sesión para publicar.', 'Sesión requerida');
            return;
        }

        // Obtener ID del autor autenticado
        const { data: autor, error: autorErr } = await client
            .from('autores')
            .select('id')
            .eq('email', user.email)
            .single();

        if (autorErr || !autor) {
            await Modal.alert('No se encontró la ficha de autor asociada a tu cuenta.', 'Error de Autor');
            return;
        }

        const titulo = document.getElementById('noticiaTitle')?.value.trim();
        const resumen = document.getElementById('noticiaResumen')?.value.trim();
        const cuerpo = document.getElementById('noticiaCuerpo')?.value.trim();
        const categoryVal = document.getElementById('noticiaCategoria')?.value;
        const destacada = document.getElementById('noticiaDedicada')?.checked || false;
        
        // Input del archivo
        const fileInput = document.getElementById('noticiaImagenFile');
        const file = fileInput ? fileInput.files[0] : null;

        if (!titulo || !resumen || !cuerpo || !categoryVal) {
            await Modal.alert('Por favor completa todos los campos requeridos.', 'Campos incompletos');
            return;
        }

        // A. PROCESAMIENTO Y SUBIDA DE LA IMAGEN
        let imagenId = null;

        if (file) {
            if (file.type !== 'image/webp') {
                await Modal.alert('La imagen debe estar en formato .webp', 'Formato no permitido');
                return;
            }

            const fileName = `noticia-${Date.now()}.webp`;
            const filePath = `noticias/${fileName}`;

            // 1. Cargar imagen al bucket de Storage
            const { error: uploadErr } = await client.storage
                .from('IMAGENES')
                .upload(filePath, file, { upsert: true, contentType: 'image/webp' });

            if (uploadErr) throw uploadErr;

            // 2. Extraer URL pública
            const { data: publicUrlData } = client.storage
                .from('IMAGENES')
                .getPublicUrl(filePath);

            // 3. Crear registro en la tabla "imagenes" para obtener su UUID
            const { data: imgRecord, error: imgErr } = await client
                .from('imagenes')
                .insert({ url: publicUrlData.publicUrl, alt_texto: `Imagen noticia: ${titulo}` })
                .select('id')
                .single();

            if (imgErr) throw imgErr;
            imagenId = imgRecord.id;
        }

        // B. RESOLVER CATEGORIA_ID
        let targetCategoriaId = categoryVal;
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(categoryVal);

        if (!isUuid) {
            const { data: catData, error: catErr } = await client
                .from('categorias')
                .select('id')
                .eq('slug', categoryVal)
                .single();

            if (catErr) throw catErr;
            targetCategoriaId = catData.id;
        }

        // C. INSERCIÓN DE LA NOTICIA VINCULADA AL IMAGEN_ID
        const { error: insertErr } = await client
            .from('noticias')
            .insert({
                titulo,
                resumen,
                cuerpo,
                autor_id: autor.id,
                categoria_id: targetCategoriaId,
                imagen_id: imagenId, // Se asigna la clave foránea procesada
                publicado: false,
                estado: 'en_revision',
                destacada
            });

        if (insertErr) throw insertErr;

        await Modal.alert('Noticia enviada a revisión exitosamente.', 'Éxito');
        
        // Reset de interfaz
        const form = document.getElementById('crearNoticiaForm');
        if (form) form.reset();

        const preview = document.getElementById('noticiaImagenPreview');
        if (preview) preview.src = 'https://placehold.co/600x400?text=Sin+Imagen';

        if (typeof loadMyNoticias === 'function') {
            loadMyNoticias(autor.id);
        }
    } catch (error) {
        console.error('❌ Error al crear noticia:', error);
        await Modal.alert('Error al enviar noticia: ' + error.message, 'Error');
    }
}