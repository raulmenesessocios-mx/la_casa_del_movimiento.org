document.addEventListener('DOMContentLoaded', () => {
    loadTalleristasForSelect();

    const form = document.getElementById('crearNoticiaAdminForm');
    if (form) {
        form.addEventListener('submit', createNoticiaAdmin);
    }
});

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
    const categorySlug = document.getElementById('noticiaAdminCategoria').value;
    const destacada = document.getElementById('noticiaAdminDestacada').checked;
    const fileInput = document.getElementById('noticiaAdminImagen');
    const file = fileInput ? fileInput.files[0] : null;

    try {
        let imagenId = null;

        // 1. Subida de Imagen a Storage y Tabla 'imagenes'
        if (file) {
            if (file.type !== 'image/webp') {
                alert('⚠️ La imagen debe estar en formato .webp');
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

        // 2. Obtener la ID de la categoría por su slug
// En crear-noticia.js, dentro de createNoticiaAdmin:
        console.log('Categoría seleccionada (slug):', categorySlug);

        if (!categorySlug) {
            alert('⚠️ Por favor selecciona una categoría válida.');
            return;
        }

        const { data: catData, error: catError } = await window.dbClient
            .from('categorias')
            .select('id')
            .eq('slug', categorySlug)
            .maybeSingle();

        // 3. Insertar Noticia
        const { error } = await window.dbClient
            .from('noticias')
            .insert({
                titulo,
                resumen,
                cuerpo,
                autor_id: autorId,
                categoria_id: catData.id,
                imagen_id: imagenId,
                publicado: true,
                destacada
            });

        if (error) throw error;

        alert('✅ Noticia creada y publicada correctamente');
        document.getElementById('crearNoticiaAdminForm').reset();
        if (typeof loadAllNoticias === 'function') loadAllNoticias();
        if (typeof loadDashboardStats === 'function') loadDashboardStats();
    } catch (error) {
        console.error('Error:', error);
        alert('❌ Error al crear noticia: ' + error.message);
    }
}

function previewcreatenoticiaImagen(event) {
    const file = event.target.files[0];
    if (!file) return;

    if (file.type !== 'image/webp') {
        alert('⚠️ Solo se permiten imágenes en formato .webp');
        event.target.value = '';
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        document.getElementById('noticiaAdminImagenPreview').src = e.target.result;
    };
    reader.readAsDataURL(file);
}