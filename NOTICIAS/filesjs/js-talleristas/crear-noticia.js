document.addEventListener('DOMContentLoaded', () => {
    // Carga inicial de categorías desde DB
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

// 1. CARGA DINÁMICA DE CATEGORÍAS
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
            option.value = cat.id; // Almacenamos el UUID real de la DB
            option.textContent = cat.nombre;
            selectCategoria.appendChild(option);
        });
    } catch (err) {
        console.error('❌ Error al obtener categorías:', err.message);
        selectCategoria.innerHTML = '<option value="">Error al cargar categorías</option>';
    }
}

// 2. PREVISUALIZACIÓN DE IMAGEN
function previewnoticiaImagen(event) {
    const file = event.target.files[0];
    if (!file) return;

    if (file.type !== 'image/webp') {
        alert('⚠️ Solo se permiten imágenes en formato .webp');
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

// 3. PERSISTENCIA DE LA NOTICIA EN REVISIÓN
async function createNoticiaTallerista() {
    try {
        const client = getSupabaseClient();
        if (!client) throw new Error("Cliente de Supabase no disponible.");

        const { data: { user } } = await client.auth.getUser();

        if (!user) {
            alert('⚠️ Debes iniciar sesión para publicar.');
            return;
        }

        // Obtener el ID del autor asociado al usuario autenticado
        const { data: autor, error: autorErr } = await client
            .from('autores')
            .select('id')
            .eq('email', user.email)
            .single();

        if (autorErr || !autor) {
            alert('⚠️ No se encontró la ficha de autor asociada a tu cuenta.');
            return;
        }

        const titulo = document.getElementById('noticiaTitle')?.value.trim();
        const resumen = document.getElementById('noticiaResumen')?.value.trim();
        const cuerpo = document.getElementById('noticiaCuerpo')?.value.trim();
        const categoryVal = document.getElementById('noticiaCategoria')?.value;
        const destacada = document.getElementById('noticiaDedicada')?.checked || false;

        if (!titulo || !resumen || !cuerpo || !categoryVal) {
            alert('⚠️ Por favor completa todos los campos requeridos.');
            return;
        }

        // Resolver ID de la Categoría (Maneja UUID directo o Fallback por Slug)
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

        // Inserción del registro con estado 'en_revision'
        const { error: insertErr } = await client
            .from('noticias')
            .insert({
                titulo,
                resumen,
                cuerpo,
                autor_id: autor.id,
                categoria_id: targetCategoriaId,
                publicado: false,
                estado: 'en_revision',
                destacada
            });

        if (insertErr) throw insertErr;

        alert('📩 Noticia enviada a revisión exitosamente.');
        
        // Reset de formulario e imagen
        const form = document.getElementById('crearNoticiaForm');
        if (form) form.reset();

        const preview = document.getElementById('noticiaImagenPreview');
        if (preview) preview.src = 'https://placehold.co/600x400?text=Sin+Imagen';

        // Recargar el listado propio si existe la función de callback
        if (typeof loadMyNoticias === 'function') {
            loadMyNoticias(autor.id);
        }
    } catch (error) {
        console.error('❌ Error al crear noticia:', error);
        alert('❌ Error al enviar noticia: ' + error.message);
    }
}