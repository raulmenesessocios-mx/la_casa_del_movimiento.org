document.addEventListener('DOMContentLoaded', () => {
    try {
        // Carga preventiva de categorías al iniciar la vista
        cargarCategoriasEditTallerista();

        const formReenviar = document.getElementById('formEditarTallerista');
        if (formReenviar && !formReenviar.dataset.listenerAttached) {
            formReenviar.addEventListener('submit', volverAMandarNoticia);
            formReenviar.dataset.listenerAttached = 'true';
        }

        setTimeout(() => {
            loadMisNoticias();
        }, 150);
    } catch (e) {
        console.error('Error al inicializar eventos de noticias:', e);
    }
});

function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// 1. CARGA DINÁMICA DE CATEGORÍAS PARA EL MODAL TALLERISTA
async function cargarCategoriasEditTallerista(selectedVal = null) {
    const client = window.supabaseClient || window.dbClient;
    const selectCategoria = document.getElementById('editTalleristaCategoria');
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
            option.value = cat.id; // Guarda el UUID exigido por la DB
            option.textContent = cat.nombre;

            if (selectedVal && (cat.id === selectedVal || cat.slug === selectedVal)) {
                option.selected = true;
            }
            selectCategoria.appendChild(option);
        });
    } catch (err) {
        console.error('❌ Error al cargar categorías en modal tallerista:', err.message);
    }
}

// 2. CONSULTA Y RENDERIZADO DE MIS NOTICIAS
async function loadMisNoticias() {
    try {
        const client = window.supabaseClient || window.dbClient;
        const container = document.getElementById('noticiasGrid');

        if (!client || !client.auth || !container) return;

        const { data: authData } = await client.auth.getUser();
        const user = authData?.user;
        if (!user) return;

        const { data: autor } = await client
            .from('autores')
            .select('id')
            .eq('email', user.email)
            .maybeSingle();

        if (!autor) return;

        const { data, error } = await client
            .from('noticias')
            .select('*, categorias(id, slug, nombre), imagenes(url)')
            .eq('autor_id', autor.id)
            .order('fecha_publicacion', { ascending: false });

        if (error) {
            console.warn('Consulta principal falló, intentando consulta directa:', error);
            const { data: fallback } = await client
                .from('noticias')
                .select('*')
                .eq('autor_id', autor.id);
            window.misNoticiasCache = fallback || [];
        } else {
            window.misNoticiasCache = data || [];
        }

        renderMisNoticias(window.misNoticiasCache);
    } catch (err) {
        console.error('Error controlado en loadMisNoticias:', err);
    }
}

window.loadMisNoticias = loadMisNoticias;
window.loadMyNoticias = loadMisNoticias;

function renderMisNoticias(noticias) {
    const container = document.getElementById('noticiasGrid');
    if (!container) return;

    if (!noticias || noticias.length === 0) {
        container.innerHTML = '<p class="mis-noticias-empty">Aún no has redactado ninguna noticia.</p>';
        return;
    }

    container.innerHTML = noticias.map(n => {
        const esRechazada = n.estado === 'rechazado' || n.estado === 'no_aprobada';
        const titulo = escapeHtml(n.titulo);
        const resumen = escapeHtml(n.resumen);
        // Fallback si la noticia no tiene imagen asociada
        const imgUrl = n.imagenes?.url || 'https://placehold.co/600x400?text=Sin+Imagen';

        return `
            <div class="card mis-noticias-card">
                <div class="mis-noticias-content">
                    <img src="${imgUrl}" alt="${titulo}" class="mis-noticias-img">

                    <div class="mis-noticias-body">
                        <h3 class="mis-noticias-title">${titulo}</h3>
                        <p class="mis-noticias-text">${resumen}</p>
                        <p class="mis-noticias-text"><strong>Estado:</strong> ${getBadgeEstadoTallerista(n.estado)}</p>
                        
                        <div class="mis-noticias-footer">
                            ${esRechazada ? `
                                <button type="button" class="btn-tabla btn-regresar" onclick="abrirEditarNoticiaTallerista('${n.id}')">
                                    Editar y Reenviar
                                </button>
                            ` : ''}
                            <button type="button" class="btn-tabla btn-eliminar" onclick="deleteNoticiaTallerista('${n.id}')">
                                Eliminar
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function getBadgeEstadoTallerista(estado) {
    if (estado === 'publicado') return '<span class="badge-status badge-publicado">Publicada</span>';
    if (estado === 'rechazado' || estado === 'no_aprobada') return '<span class="badge-status badge-rechazado">No aprobada (Requiere cambios)</span>';
    return '<span class="badge-status badge-revision">⏳ En Revisión</span>';
}

// 3. APERTURA Y POBLADO DEL MODAL
async function abrirEditarNoticiaTallerista(noticiaId) {
    if (!window.misNoticiasCache) return;
    const noticia = window.misNoticiasCache.find(n => n.id === noticiaId);
    if (!noticia) return;

    // Sincroniza categorías y auto-selecciona el UUID de la noticia
    await cargarCategoriasEditTallerista(noticia.categoria_id || noticia.categorias?.id || noticia.categorias?.slug);

    const campoId = document.getElementById('editTalleristaId');
    const campoImagenId = document.getElementById('editTalleristaImagenIdActual');
    const campoTitulo = document.getElementById('editTalleristaTitulo');
    const campoResumen = document.getElementById('editTalleristaResumen');
    const campoCuerpo = document.getElementById('editTalleristaCuerpo');
    const modal = document.getElementById('modalEditarNoticiaTallerista');

    if (!campoId || !campoTitulo || !campoResumen || !campoCuerpo || !modal) {
        console.error('No se encontraron todos los campos del modal de edición.');
        return;
    }

    campoId.value = noticia.id;
    if (campoImagenId) campoImagenId.value = noticia.imagen_id || '';
    campoTitulo.value = noticia.titulo || '';
    campoResumen.value = noticia.resumen ?? '';
    campoCuerpo.value = noticia.cuerpo ?? '';

    // Preview de la imagen
    const imgPreview = document.getElementById('editTalleristaImagenPreview');
    if (imgPreview) {
        const defaultPlaceholder = 'https://placehold.co/600x400?text=Sin+Imagen';
        imgPreview.src = noticia.imagenes?.url || defaultPlaceholder;
    }

    modal.classList.remove('is-hidden');
}

async function previewnwenoticoaImagen(event) {
    const file = event.target.files[0];
    if (!file) return;

    if (file.type !== 'image/webp') {
        await Modal.alert('Solo se permiten imágenes en formato .webp', 'Formato no permitido');
        event.target.value = '';
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        document.getElementById('editTalleristaImagenPreview').src = e.target.result;
    };
    reader.readAsDataURL(file);
}

function cerrarModalTallerista() {
    const modal = document.getElementById('modalEditarNoticiaTallerista');
    if (modal) modal.classList.add('is-hidden');
    
    const form = document.getElementById('formEditarTallerista');
    if (form) form.reset();

    const imgPreview = document.getElementById('editTalleristaImagenPreview');
    if (imgPreview) {
        imgPreview.src = 'https://placehold.co/600x400?text=Sin+Imagen';
    }
}

// 4. REENVIAR A REVISIÓN (ACTUALIZACIÓN EN SUPABASE)
async function volverAMandarNoticia(e) {
    e.preventDefault();

    const client = window.supabaseClient || window.dbClient;
    if (!client) {
        await Modal.alert('Error: Cliente de base de datos no disponible.', 'Error');
        return;
    }

    const id = document.getElementById('editTalleristaId').value;
    const campoImagenId = document.getElementById('editTalleristaImagenIdActual');
    let imagenId = campoImagenId ? (campoImagenId.value || null) : null;
    const titulo = document.getElementById('editTalleristaTitulo').value.trim();
    const resumen = document.getElementById('editTalleristaResumen').value.trim();
    const cuerpo = document.getElementById('editTalleristaCuerpo').value.trim();
    const categoryVal = document.getElementById('editTalleristaCategoria').value;

    if (!titulo || !resumen || !cuerpo || !categoryVal) {
        await Modal.alert('Título, resumen, cuerpo y categoría son obligatorios.', 'Campos requeridos');
        return;
    }

    const fileInput = document.getElementById('editTalleristaImagen');
    const file = fileInput ? fileInput.files[0] : null;

    try {
        if (file) {
            if (file.type !== 'image/webp') {
                await Modal.alert('La imagen debe estar en formato .webp', 'Formato no permitido');
                return;
            }

            const fileName = `noticia-${Date.now()}.webp`;
            const filePath = `noticias/${fileName}`;

            const { error: uploadErr } = await client.storage
                .from('IMAGENES')
                .upload(filePath, file, { upsert: true, contentType: 'image/webp' });

            if (uploadErr) throw uploadErr;

            const { data: publicUrlData } = client.storage
                .from('IMAGENES')
                .getPublicUrl(filePath);

            const { data: imgRecord, error: imgErr } = await client
                .from('imagenes')
                .insert({ url: publicUrlData.publicUrl, alt_texto: `Imagen noticia: ${titulo}` })
                .select('id')
                .single();

            if (imgErr) throw imgErr;
            imagenId = imgRecord.id;
        }

        // Resolución de la Categoría (Fallback si es UUID o Slug)
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

        const { error: updateErr } = await client
            .from('noticias')
            .update({
                titulo,
                resumen,
                cuerpo,
                categoria_id: targetCategoriaId,
                imagen_id: imagenId,
                estado: 'en_revision',
                publicado: false,
                actualizado_en: new Date().toISOString()
            })
            .eq('id', id);

        if (updateErr) throw updateErr;

        await Modal.alert('Noticia actualizada y reenviada a revisión.', 'Éxito');
        cerrarModalTallerista();
        loadMisNoticias();
    } catch (error) {
        console.error('Error al reenviar noticia:', error);
        await Modal.alert('Error al reenviar noticia: ' + error.message, 'Error');
    }
}

async function deleteNoticiaTallerista(noticiaId) {
    const confirmado = await Modal.confirm('¿Seguro que deseas eliminar esta noticia?', 'Confirmar eliminación');
    if (!confirmado) return;

    try {
        const client = window.supabaseClient || window.dbClient;
        if (!client) {
            await Modal.alert('Error: Cliente de base de datos no disponible.', 'Error');
            return;
        }
        const { error } = await client.from('noticias').delete().eq('id', noticiaId);
        if (error) throw error;

        await Modal.alert('Noticia eliminada correctamente.', 'Éxito');
        loadMisNoticias();
    } catch (err) {
        console.error('Error al eliminar:', err);
        await Modal.alert('No se pudo eliminar la noticia.', 'Error');
    }
}