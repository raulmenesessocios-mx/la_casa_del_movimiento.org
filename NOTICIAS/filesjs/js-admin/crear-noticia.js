document.addEventListener('DOMContentLoaded', () => {
    loadTalleristasForSelect();
    cargarCategoriasCrearNoticiaSuperior();

    const form = document.getElementById('crearNoticiaAdminForm');
    if (form) {
        form.addEventListener('submit', createNoticiaAdmin);
    }
});

function getSupabaseClient() {
    return window.supabaseClient || window.dbClient;
}

async function cargarCategoriasCrearNoticiaSuperior() {
    const selectCategoria = document.getElementById('noticiaCategoriaAdmin');
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

async function loadTalleristasForSelect() {
    try {
        const { data, error } = await window.dbClient
            .from('autores')
            .select('id, nombre');

        if (error) throw error;

        const select = document.getElementById('noticiaAutor');
        if (!select) return;

        select.innerHTML = '<option value="">Selecciona un autor/tallerista</option>';
        if (data) {
            data.forEach(tallerista => {
                const option = document.createElement('option');
                option.value = tallerista.id;
                option.textContent = tallerista.nombre;
                select.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Error al cargar autores:', error);
    }
}

async function createNoticiaAdmin(e) {
    e.preventDefault();

    const autorId = document.getElementById('noticiaAutor').value;
    const titulo = document.getElementById('noticiaAdminTitulo').value.trim();
    const resumen = document.getElementById('noticiaAdminResumen').value.trim();
    const cuerpo = document.getElementById('noticiaAdminCuerpo').value.trim();
    const categoriaId = document.getElementById('noticiaCategoriaAdmin')?.value; // Contiene directamente el UUID
    const destacada = document.getElementById('noticiaAdminDestacada').checked;
    const fileInput = document.getElementById('noticiaAdminImagen');
    const file = fileInput ? fileInput.files[0] : null;

    try {
        let imagenId = null;

        // 1. Subida de Imagen a Storage y Tabla 'imagenes'
        if (file) {
            if (file.type !== 'image/webp') {
                await Modal.alert('⚠️ La imagen debe estar en formato .webp');
                return;
            }

            const fileName = `noticia-${Date.now()}.webp`;
            const filePath = `noticias/${fileName}`;

            const { error: uploadError } = await window.dbClient.storage
                .from('IMAGENES')
                .upload(filePath, file, { upsert: true, contentType: 'image/webp' });

            if (uploadError) throw uploadError;

            const { data: publicUrlData } = window.dbClient.storage
                .from('IMAGENES')
                .getPublicUrl(filePath);

            const { data: imgRecord, error: imgError } = await window.dbClient
                .from('imagenes')
                .insert({ url: publicUrlData.publicUrl, alt_texto: `Imagen: ${titulo}` })
                .select('id')
                .single();

            if (imgError) throw imgError;
            imagenId = imgRecord.id;
        }

        // Validación de categoría seleccionada
        if (!categoriaId) {
            await Modal.alert('⚠️ Por favor selecciona una categoría válida.');
            return;
        }

        // 2. Insertar Noticia usando directamente el UUID de la categoría
        const { error } = await window.dbClient
            .from('noticias')
            .insert({
                titulo,
                resumen,
                cuerpo,
                autor_id: autorId,
                categoria_id: categoriaId, // Usamos el UUID directo del select
                imagen_id: imagenId,
                publicado: true,
                destacada
            });

        if (error) throw error;

        await Modal.alert('✅ Noticia creada y publicada correctamente');
        document.getElementById('crearNoticiaAdminForm').reset();
        
        // Resetear la previsualización de imagen si existe
        const preview = document.getElementById('noticiaAdminImagenPreview');
        if (preview) preview.src = 'https://placehold.co/600x400?text=Sin+Imagen';

        if (typeof loadAllNoticias === 'function') loadAllNoticias();
        if (typeof loadDashboardStats === 'function') loadDashboardStats();
    } catch (error) {
        console.error('Error:', error);
        await Modal.alert('❌ Error al crear noticia: ' + error.message);
    }
}

function previewcreatenoticiaImagen(event) {
    const file = event.target.files[0];
    if (!file) return;

    if (file.type !== 'image/webp') {
        Modal.alert('Solo se permiten imágenes en formato .webp');
        event.target.value = '';
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        document.getElementById('noticiaAdminImagenPreview').src = e.target.result;
    };
    reader.readAsDataURL(file);
}