let filterEstadoActualSuperior = 'todas';
let isSubmittingNoticiaSuperior = false;
let isChangingEstadoSuperior = false;
let isDeletingNoticiaSuperior = false;

document.addEventListener('DOMContentLoaded', () => {
    loadGestionarNoticiasSuperior();

    const formEdit = document.getElementById('editarNoticiaFormSuperior');
    if (formEdit && !formEdit.dataset.listenerAttached) {
        formEdit.addEventListener('submit', guardarEdicionNoticiaSuperior);
        formEdit.dataset.listenerAttached = 'true';
    }
});

function getClientSuperior() {
    return window.supabaseClient || window.dbClient;
}

function escapeHtmlSuperior(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

async function loadGestionarNoticiasSuperior() {
    try {
        const client = getClientSuperior();
        const container = document.getElementById('gestionarNoticiasTablaBodySuperior');
        if (!client || !container) return;

        const { data: noticias, error } = await client
            .from('noticias')
            .select(`
                id, 
                titulo, 
                resumen, 
                cuerpo, 
                publicado, 
                estado,
                destacada, 
                categoria_id,
                imagen_id,
                categorias(id, slug, nombre),
                autores(nombre),
                imagenes(url)
            `)
            .order('fecha_publicacion', { ascending: false });

        if (error) throw error;

        window.gestionarNoticiasSuperiorCache = noticias || [];
        renderGestionarNoticiasTablaSuperior();

    } catch (err) {
        console.error('❌ Error al cargar noticias (Superior):', err);
    }
}

// Cargar Categorías Dinámicamente en el Select
async function loadCategoriasSuperior() {
    try {
        const client = getClientSuperior();
        if (!client) return;

        const { data: categorias, error } = await client
            .from('categorias')
            .select('id, nombre')
            .order('nombre', { ascending: true });

        if (error) throw error;

        const select = document.getElementById('editNoticiaCategoriaSuperior');
        if (!select) return;

        select.innerHTML = '<option value="">Selecciona una categoría</option>' +
            (categorias || []).map(c => `<option value="${c.id}">${escapeHtmlSuperior(c.nombre)}</option>`).join('');
    } catch (err) {
        console.error('❌ Error al cargar categorías:', err);
    }
}

function setFilterNoticiasSuperior(estado) {
    filterEstadoActualSuperior = estado;
    renderGestionarNoticiasTablaSuperior();
}

function renderGestionarNoticiasTablaSuperior() {
    const container = document.getElementById('gestionarNoticiasTablaBodySuperior');
    if (!container) return;

    let filtradas = window.gestionarNoticiasSuperiorCache || [];
    if (filterEstadoActualSuperior === 'publicadas') {
        filtradas = filtradas.filter(n => n.estado === 'publicado');
    } else if (filterEstadoActualSuperior === 'revision') {
        filtradas = filtradas.filter(n => n.estado === 'en_revision');
    } else if (filterEstadoActualSuperior === 'rechazadas') {
        filtradas = filtradas.filter(n => n.estado === 'rechazado');
    }

    const html = `
        <div class="admin-tabs-wrapper">
            <div class="admin-tabs desktop-filters">
                <button class="admin-tab-btn ${filterEstadoActualSuperior === 'todas' ? 'active' : ''}" onclick="setFilterNoticiasSuperior('todas')">Todas</button>
                <button class="admin-tab-btn ${filterEstadoActualSuperior === 'revision' ? 'active' : ''}" onclick="setFilterNoticiasSuperior('revision')">En Revisión</button>
                <button class="admin-tab-btn ${filterEstadoActualSuperior === 'publicadas' ? 'active' : ''}" onclick="setFilterNoticiasSuperior('publicadas')">Publicadas</button>
                <button class="admin-tab-btn ${filterEstadoActualSuperior === 'rechazadas' ? 'active' : ''}" onclick="setFilterNoticiasSuperior('rechazadas')">Rechazadas</button>
            </div>

            <div class="mobile-filters-dropdown">
                <button onclick="toggleFiltrosMobileSuperior()" class="btn-tabla btn-filter-trigger">
                    <span></span> <strong>Filtrar:</strong> ${getNombreFiltroActualSuperior(filterEstadoActualSuperior)} ▾
                </button>

                <div id="dropdownFiltrosMobile" class="dropdown-filters-menu is-hidden">
                    <a href="javascript:void(0)" onclick="setFilterNoticiasSuperior('todas'); toggleFiltrosMobileSuperior();" class="dropdown-filter-link">Todas</a>
                    <a href="javascript:void(0)" onclick="setFilterNoticiasSuperior('revision'); toggleFiltrosMobileSuperior();" class="dropdown-filter-link">En Revisión</a>
                    <a href="javascript:void(0)" onclick="setFilterNoticiasSuperior('publicadas'); toggleFiltrosMobileSuperior();" class="dropdown-filter-link">Publicadas</a>
                    <a href="javascript:void(0)" onclick="setFilterNoticiasSuperior('rechazadas'); toggleFiltrosMobileSuperior();" class="dropdown-filter-link">Rechazadas</a>
                </div>
            </div>
        </div>

        <div class="admin-table-scroll-container">
            <table class="admin-table admin-table-min-width">
                <thead>
                    <tr>
                        <th class="text-left cell-padding">Título</th>
                        <th class="text-left cell-padding">Autor</th>
                        <th class="text-left cell-padding">Estado</th>
                        <th class="text-right cell-padding">Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    ${filtradas.length === 0 ? '<tr><td colspan="4" class="cell-empty-state">No hay noticias en esta sección.</td></tr>' : ''}
                    ${filtradas.map(n => {
                        const esPublicado = n.estado === 'publicado';
                        const esRechazado = n.estado === 'rechazado';

                        return `
                        <tr>
                            <td class="cell-title"><strong>${escapeHtmlSuperior(n.titulo)}</strong></td>
                            <td class="cell-padding">${escapeHtmlSuperior(n.autores?.nombre || 'Desconocido')}</td>
                            <td class="cell-nowrap">
                                ${getBadgeEstadoSuperior(n.estado)}${n.destacada ? 'Destacada' : ''}
                            </td>
                            <td class="cell-padding text-right">
                                <div class="actions-cell actions-cell-right">
                                    ${!esPublicado ? `<button class="btn-tabla btn-publicar" onclick="cambiarEstadoNoticiaSuperior('${n.id}', 'publicado', true, this)">Publicar</button>` : ''}
                                    ${!esPublicado && !esRechazado ? `<button class="btn-tabla btn-regresar" onclick="cambiarEstadoNoticiaSuperior('${n.id}', 'rechazado', false, this)">Rechazar</button>` : ''}
                                    <button class="btn-tabla btn-editar" onclick="abrirModalEditarNoticiaSuperior('${n.id}')">Editar</button>
                                    <button class="btn-tabla btn-eliminar" onclick="deleteNoticiaSuperior('${n.id}', this)">Eliminar</button>
                                </div>
                            </td>
                        </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        </div>
    `;

    container.innerHTML = html;
}

function toggleFiltrosMobileSuperior() {
    const dropdown = document.getElementById('dropdownFiltrosMobile');
    if (dropdown) dropdown.classList.toggle('is-hidden');
}

function getNombreFiltroActualSuperior(estado) {
    if (estado === 'revision') return 'En Revisión';
    if (estado === 'publicadas') return 'Publicadas';
    if (estado === 'rechazadas') return 'Rechazadas';
    return 'Todas';
}

function getBadgeEstadoSuperior(estado) {
    if (estado === 'publicado') return '<span class="badge-status badge-publicado">Publicada</span>';
    if (estado === 'rechazado') return '<span class="badge-status badge-rechazado">Rechazada</span>';
    return '<span class="badge-status badge-revision">En Revisión</span>';
}

async function cambiarEstadoNoticiaSuperior(noticiaId, nuevoEstado, esPublicado, targetBtn = null) {
    if (isChangingEstadoSuperior) return;

    const btn = targetBtn || document.activeElement;
    const originalText = btn ? btn.textContent : '';

    try {
        isChangingEstadoSuperior = true;
        if (btn && btn.tagName === 'BUTTON') {
            btn.disabled = true;
            btn.textContent = 'Procesando...';
        }

        const client = getClientSuperior();
        const { error } = await client
            .from('noticias')
            .update({ estado: nuevoEstado, publicado: esPublicado, actualizado_en: new Date().toISOString() })
            .eq('id', noticiaId);

        if (error) throw error;
        await loadGestionarNoticiasSuperior();
    } catch (err) {
        console.error('❌ Error cambiando estado:', err);
        await Modal.alert('Error al cambiar el estado: ' + err.message, 'Error');
    } finally {
        isChangingEstadoSuperior = false;
        if (btn && btn.tagName === 'BUTTON') {
            btn.disabled = false;
            btn.textContent = originalText;
        }
    }
}

// Abrir Modal y Cargar Datos de la Noticia
async function abrirModalEditarNoticiaSuperior(noticiaId) {
    const noticia = (window.gestionarNoticiasSuperiorCache || []).find(n => n.id === noticiaId);
    if (!noticia) return;

    // Cargar opciones del desplegable de categorías
    await loadCategoriasSuperior();

    const setVal = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.value = val ?? '';
    };

    setVal('editNoticiaIdSuperior', noticia.id);
    setVal('editImagenIdActualSuperior', noticia.imagen_id);
    setVal('editNoticiaTituloSuperior', noticia.titulo);
    setVal('editNoticiaResumenSuperior', noticia.resumen);
    setVal('editNoticiaCuerpoSuperior', noticia.cuerpo);

    const selectCat = document.getElementById('editNoticiaCategoriaSuperior');
    if (selectCat) {
        selectCat.value = noticia.categoria_id || '';
    }

    const checkPublicado = document.getElementById('editNoticiaPublicadoSuperior');
    if (checkPublicado) checkPublicado.checked = !!noticia.publicado;

    const checkDestacada = document.getElementById('editNoticiaDestacadaSuperior');
    if (checkDestacada) checkDestacada.checked = !!noticia.destacada;

    const fileInput = document.getElementById('editNoticiaImagenSuperior');
    if (fileInput) fileInput.value = '';

    // Cargar imagen actual guardada en la base de datos
    const imgPreview = document.getElementById('editNoticiaImagenPreviewSuperior');
    if (imgPreview) {
        imgPreview.src = noticia.imagenes?.url || 'https://placehold.co/600x400?text=Sin+Imagen';
    }

    const modal = document.getElementById('modalEditarNoticiaSuperior');
    if (modal) {
        modal.style.display = 'flex';
        modal.classList.remove('is-hidden');
    }
}

// Previsualizar la nueva imagen local elegida por el usuario
async function previewNoticiaImagenSuperior(event) {
    const file = event.target.files[0];
    if (!file) return;

    if (file.type !== 'image/webp') {
        await Modal.alert('Solo se permiten imágenes en formato .webp', 'Formato no permitido');
        event.target.value = '';
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        const preview = document.getElementById('editNoticiaImagenPreviewSuperior');
        if (preview) preview.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

function cerrarModalEditarNoticiaSuperior() {
    const modal = document.getElementById('modalEditarNoticiaSuperior');
    if (modal) {
        modal.style.display = 'none';
        modal.classList.add('is-hidden');
    }
}

async function guardarEdicionNoticiaSuperior(event) {
    if (event) event.preventDefault();

    if (isSubmittingNoticiaSuperior) return;

    const form = document.getElementById('editarNoticiaFormSuperior');
    const submitBtn = form ? form.querySelector('button[type="submit"]') : null;
    const cancelBtn = form ? form.querySelector('.btn-editar') : null;
    const originalSubmitText = submitBtn ? submitBtn.textContent : 'Guardar Cambios';

    try {
        isSubmittingNoticiaSuperior = true;

        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = 'Guardando...';
        }
        if (cancelBtn) cancelBtn.disabled = true;

        const client = getClientSuperior();
        const id = document.getElementById('editNoticiaIdSuperior')?.value;
        const titulo = document.getElementById('editNoticiaTituloSuperior')?.value.trim();
        const resumen = document.getElementById('editNoticiaResumenSuperior')?.value.trim();
        const cuerpo = document.getElementById('editNoticiaCuerpoSuperior')?.value.trim();
        const categoriaId = document.getElementById('editNoticiaCategoriaSuperior')?.value;
        const publicado = document.getElementById('editNoticiaPublicadoSuperior')?.checked || false;
        const destacada = document.getElementById('editNoticiaDestacadaSuperior')?.checked || false;

        if (!id) throw new Error('No se especificó la noticia a editar.');

        const fileInput = document.getElementById('editNoticiaImagenSuperior');
        const file = fileInput ? fileInput.files[0] : null;
        let imagenId = document.getElementById('editImagenIdActualSuperior')?.value || null;

        // Subir nueva imagen si se seleccionó una
        if (file) {
            if (file.type !== 'image/webp') {
                await Modal.alert('El archivo debe estar en formato .webp', 'Formato no permitido');
                return;
            }

            const fileName = `noticia-${id}-${Date.now()}.webp`;
            const filePath = `noticias/${fileName}`;

            const { error: uploadError } = await client.storage
                .from('IMAGENES')
                .upload(filePath, file, { upsert: true, contentType: 'image/webp' });

            if (uploadError) throw uploadError;

            const { data: urlData } = client.storage
                .from('IMAGENES')
                .getPublicUrl(filePath);

            const { data: imgRecord, error: imgError } = await client
                .from('imagenes')
                .insert({ url: urlData.publicUrl, alt_texto: titulo })
                .select('id')
                .single();

            if (imgError) throw imgError;
            imagenId = imgRecord.id;
        }

        const updatePayload = {
            titulo,
            resumen,
            cuerpo,
            publicado,
            destacada,
            estado: publicado ? 'publicado' : 'en_revision',
            actualizado_en: new Date().toISOString()
        };

        if (categoriaId) updatePayload.categoria_id = categoriaId;
        if (imagenId) updatePayload.imagen_id = imagenId;

        const { error } = await client
            .from('noticias')
            .update(updatePayload)
            .eq('id', id);

        if (error) throw error;

        await Modal.alert('Noticia actualizada con éxito.', 'Éxito');
        cerrarModalEditarNoticiaSuperior();
        await loadGestionarNoticiasSuperior();

    } catch (err) {
        console.error('❌ Error al actualizar noticia:', err);
        await Modal.alert('Error al guardar cambios: ' + err.message, 'Error');
    } finally {
        isSubmittingNoticiaSuperior = false;
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = originalSubmitText;
        }
        if (cancelBtn) cancelBtn.disabled = false;
    }
}

async function deleteNoticiaSuperior(noticiaId, targetBtn = null) {
    if (isDeletingNoticiaSuperior) return;

    const confirmado = await Modal.confirm('¿Estás seguro de eliminar esta noticia?', 'Confirmar eliminación');
    if (!confirmado) return;

    const btn = targetBtn || document.activeElement;
    const originalText = btn ? btn.textContent : '🗑️';

    try {
        isDeletingNoticiaSuperior = true;
        if (btn && btn.tagName === 'BUTTON') {
            btn.disabled = true;
            btn.textContent = 'Eliminando...';
        }

        const client = getClientSuperior();
        const { error } = await client.from('noticias').delete().eq('id', noticiaId);
        if (error) throw error;

        await Modal.alert('Noticia eliminada correctamente.', 'Éxito');
        await loadGestionarNoticiasSuperior();
    } catch (err) {
        console.error('❌ Error al eliminar noticia:', err);
        await Modal.alert('Error al eliminar la noticia.', 'Error');
    } finally {
        isDeletingNoticiaSuperior = false;
        if (btn && btn.tagName === 'BUTTON') {
            btn.disabled = false;
            btn.textContent = originalText;
        }
    }
}