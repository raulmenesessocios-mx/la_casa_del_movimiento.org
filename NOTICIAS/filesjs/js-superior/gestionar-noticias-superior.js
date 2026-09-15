let filterEstadoActualSuperior = 'todas';
let isSubmittingNoticiaSuperior = false;

document.addEventListener('DOMContentLoaded', () => {
    loadGestionarNoticiasSuperior();

    const formEdit = document.getElementById('editarNoticiaForm');
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
                categorias(slug, nombre),
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
        <!-- Filtros responsivos: Botones en escritorio / Menú Filtro en Móvil -->
        <div class="admin-tabs-wrapper">
            
            <!-- Vista Escritorio (Botones normales) -->
            <div class="admin-tabs desktop-filters">
                <button class="admin-tab-btn ${filterEstadoActualSuperior === 'todas' ? 'active' : ''}" onclick="setFilterNoticiasSuperior('todas')">Todas</button>
                <button class="admin-tab-btn ${filterEstadoActualSuperior === 'revision' ? 'active' : ''}" onclick="setFilterNoticiasSuperior('revision')">En Revisión</button>
                <button class="admin-tab-btn ${filterEstadoActualSuperior === 'publicadas' ? 'active' : ''}" onclick="setFilterNoticiasSuperior('publicadas')">Publicadas</button>
                <button class="admin-tab-btn ${filterEstadoActualSuperior === 'rechazadas' ? 'active' : ''}" onclick="setFilterNoticiasSuperior('rechazadas')">Rechazadas</button>
            </div>

            <!-- Vista Móvil (Icono Filtro / Hamburguesa con desplegable) -->
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

        <!-- Contenedor de Tabla con Scroll Horizontal -->
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
                                ${getBadgeEstadoSuperior(n.estado)}
                                ${n.destacada ? ' ⭐' : ''}
                            </td>
                            <td class="cell-padding text-right">
                                <div class="actions-cell actions-cell-right">
                                    ${!esPublicado ? `<button class="btn-tabla btn-publicar" onclick="cambiarEstadoNoticiaSuperior('${n.id}', 'publicado', true)">Publicar</button>` : ''}
                                    ${!esPublicado && !esRechazado ? `<button class="btn-tabla btn-regresar" onclick="cambiarEstadoNoticiaSuperior('${n.id}', 'rechazado', false)">Rechazar</button>` : ''}
                                    <button class="btn-tabla btn-editar" onclick="abrirModalEditarNoticiaSuperior('${n.id}')">Editar</button>
                                    <button class="btn-tabla btn-eliminar" onclick="deleteNoticiaSuperior('${n.id}')">🗑️</button>
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

// Funciones Auxiliares para el menú desplegable móvil
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

async function cambiarEstadoNoticiaSuperior(noticiaId, nuevoEstado, esPublicado) {
    try {
        const client = getClientSuperior();
        const { error } = await client
            .from('noticias')
            .update({ estado: nuevoEstado, publicado: esPublicado, actualizado_en: new Date().toISOString() })
            .eq('id', noticiaId);

        if (error) throw error;
        await loadGestionarNoticiasSuperior();
    } catch (err) {
        console.error('❌ Error cambiando estado:', err);
        alert('Error al cambiar el estado: ' + err.message);
    }
}

function abrirModalEditarNoticiaSuperior(noticiaId) {
    const noticia = (window.gestionarNoticiasSuperiorCache || []).find(n => n.id === noticiaId);
    if (!noticia) return;

    const setVal = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.value = val ?? '';
    };

    setVal('editNoticiaId', noticia.id);
    setVal('editImagenIdActual', noticia.imagen_id);
    setVal('editNoticiaTitulo', noticia.titulo);
    setVal('editNoticiaResumen', noticia.resumen);
    setVal('editNoticiaCuerpo', noticia.cuerpo);

    const selectCat = document.getElementById('editNoticiaCategoria');
    if (selectCat && noticia.categorias?.slug) {
        selectCat.value = noticia.categorias.slug;
    }

    const checkPublicado = document.getElementById('editNoticiaPublicado');
    if (checkPublicado) checkPublicado.checked = !!noticia.publicado;

    const checkDestacada = document.getElementById('editNoticiaDestacada');
    if (checkDestacada) checkDestacada.checked = !!noticia.destacada;

    const fileInput = document.getElementById('editNoticiaImagen');
    if (fileInput) fileInput.value = '';

    const imgPreview = document.getElementById('editNoticiaImagenPreview');
    if (imgPreview) {
        imgPreview.src = noticia.imagenes?.url || 'https://placehold.co/600x400?text=Sin+Imagen';
    }

    const modal = document.getElementById('modalEditarNoticiaSuperior');
    if (modal) {
        modal.classList.remove('is-hidden');
    }
}

function cerrarModalEditar() {
    const modal = document.getElementById('modalEditarNoticiaSuperior');
    if (modal) {
        modal.classList.add('is-hidden');
    }
}

function previeweditNoticiaImagenImagen(event) {
    const file = event.target.files[0];
    if (!file) return;

    if (file.type !== 'image/webp') {
        alert('⚠️ Solo se permiten imágenes en formato .webp');
        event.target.value = '';
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        const preview = document.getElementById('editNoticiaImagenPreview');
        if (preview) preview.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

async function guardarEdicionNoticiaSuperior(event) {
    if (event) event.preventDefault();

    if (isSubmittingNoticiaSuperior) return;

    const form = document.getElementById('editarNoticiaForm');
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
        const id = document.getElementById('editNoticiaId')?.value;
        const titulo = document.getElementById('editNoticiaTitulo')?.value.trim();
        const resumen = document.getElementById('editNoticiaResumen')?.value.trim();
        const cuerpo = document.getElementById('editNoticiaCuerpo')?.value.trim();
        const categoriaSlug = document.getElementById('editNoticiaCategoria')?.value;
        const publicado = document.getElementById('editNoticiaPublicado')?.checked || false;
        const destacada = document.getElementById('editNoticiaDestacada')?.checked || false;

        const fileInput = document.getElementById('editNoticiaImagen');
        const file = fileInput ? fileInput.files[0] : null;
        let imagenId = document.getElementById('editImagenIdActual')?.value || null;

        if (file) {
            if (file.type !== 'image/webp') {
                alert('⚠️ El archivo debe estar en formato .webp');
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

        let categoriaId = null;
        if (categoriaSlug) {
            const { data: catData } = await client
                .from('categorias')
                .select('id')
                .eq('slug', categoriaSlug)
                .maybeSingle();

            if (catData) categoriaId = catData.id;
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

        if (imagenId) updatePayload.imagen_id = imagenId;
        if (categoriaId) updatePayload.categoria_id = categoriaId;

        const { error } = await client
            .from('noticias')
            .update(updatePayload)
            .eq('id', id);

        if (error) throw error;

        alert('✅ Noticia actualizada con éxito.');
        cerrarModalEditar();
        await loadGestionarNoticiasSuperior();

    } catch (err) {
        console.error('❌ Error al actualizar noticia:', err);
        alert('Error al guardar cambios: ' + err.message);
    } finally {
        isSubmittingNoticiaSuperior = false;
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = originalSubmitText;
        }
        if (cancelBtn) cancelBtn.disabled = false;
    }
}

async function deleteNoticiaSuperior(noticiaId) {
    if (!confirm('¿Estás seguro de eliminar esta noticia?')) return;

    try {
        const client = getClientSuperior();
        const { error } = await client.from('noticias').delete().eq('id', noticiaId);
        if (error) throw error;

        alert('✅ Noticia eliminada');
        await loadGestionarNoticiasSuperior();
    } catch (err) {
        console.error('❌ Error al eliminar noticia:', err);
        alert('Error al eliminar la noticia');
    }
}