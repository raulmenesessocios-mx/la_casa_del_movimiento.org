// Variable de control global para evitar doble ejecución en milisegundos
let isSubmittingNoticia = false;

document.addEventListener('DOMContentLoaded', () => {
    // 1. Carga inicial de categorías
    cargarCategoriasCrearNoticiaSuperior();



    // 3. Registrar listener del formulario
    const form = document.getElementById('crearNoticiaFormSuperior');
    if (form && !form.dataset.listenerAttached) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            await createNoticiaSuperior();
        });
        form.dataset.listenerAttached = 'true';
    }
});

function getSupabaseClient() {
    return window.supabaseClient || window.dbClient;
}

// 1. OBTENER Y POBLAR CATEGORÍAS
async function cargarCategoriasCrearNoticiaSuperior() {
    const selectCategoria = document.getElementById('noticiaCategoriaSuperior');
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
            option.value = cat.id; // Guarda el UUID directo para la FK
            option.textContent = cat.nombre;
            selectCategoria.appendChild(option);
        });
    } catch (err) {
        console.error('❌ Error al obtener categorías:', err.message);
        selectCategoria.innerHTML = '<option value="">Error al cargar categorías</option>';
    }
}

// 2. PREVISUALIZACIÓN DE IMAGEN
async function previewNoticiaImagenSuperiorcreate(event) {
    const file = event.target.files[0];
    if (!file) return;

    if (file.type !== 'image/webp') {
        await Modal.alert('Solo se permiten imágenes en formato .webp', 'Formato no permitido');
        event.target.value = '';
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        const preview = document.getElementById('noticiaImagenPreviewSuperiorcreate');
        if (preview) preview.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

// 3. CREAR Y PUBLICAR NOTICIA (ROLE: SUPERIOR)
async function createNoticiaSuperior() {
    if (isSubmittingNoticia) return;

    const form = document.getElementById('crearNoticiaFormSuperior');
    const submitBtn = form?.querySelector('button[type="submit"]');
    const originalBtnText = submitBtn ? submitBtn.innerText : 'Publicar Noticia';

    try {
        isSubmittingNoticia = true;
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerText = 'Publicando noticia...';
        }

        const client = getSupabaseClient();
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
        const categoryVal = document.getElementById('noticiaCategoriaSuperior')?.value;
        const destacada = document.getElementById('noticiaDestacadaSuperior')?.checked || false;
        const fileInput = document.getElementById('noticiaImagenFileSuperiorcreate');
        const file = fileInput ? fileInput.files[0] : null;

        if (!titulo || !resumen || !cuerpo || !categoryVal) {
            alert('⚠️ Por favor completa todos los campos requeridos.');
            return; 
        }

        // RESOLUCIÓN DE CATEGORIA_ID
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

        // A. PROCESAMIENTO DE IMAGEN DE ALMACENAMIENTO
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

        // B. INSERCIÓN DE LA NOTICIA PUBLICADA
        const insertPayload = {
            titulo,
            resumen,
            cuerpo,
            autor_id: autor.id,
            categoria_id: targetCategoriaId,
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

        // C. RESET DE VISTA Y CONTROLES
        if (form) form.reset();
        if (fileInput) fileInput.value = '';

        const preview = document.getElementById('noticiaImagenPreviewSuperiorcreate');
        if (preview) {
            preview.src = 'https://placehold.co/600x400?text=Sin+Imagen';
        }

        if (typeof loadMisNoticiasSuperior === 'function') {
            await loadMisNoticiasSuperior();
        }

    } catch (error) {
        console.error('Error al crear noticia (Superior):', error);
        alert('❌ Error al publicar la noticia: ' + error.message);
    } finally {
        isSubmittingNoticia = false;
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerText = originalBtnText;
        }
    }
}