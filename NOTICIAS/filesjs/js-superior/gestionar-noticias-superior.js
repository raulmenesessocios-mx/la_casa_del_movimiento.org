let filterEstadoActualSuperior = 'todas';

document.addEventListener('DOMContentLoaded', () => {
    loadGestionarNoticiasSuperior();

    const formEdit = document.getElementById('formEditarNoticiaSuperior');
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
        <div class="admin-tabs" style="margin-bottom: 1rem; display: flex; gap: 0.5rem;">
            <button class="admin-tab-btn ${filterEstadoActualSuperior === 'todas' ? 'active' : ''}" onclick="setFilterNoticiasSuperior('todas')">Todas</button>
            <button class="admin-tab-btn ${filterEstadoActualSuperior === 'revision' ? 'active' : ''}" onclick="setFilterNoticiasSuperior('revision')">En Revisión</button>
            <button class="admin-tab-btn ${filterEstadoActualSuperior === 'publicadas' ? 'active' : ''}" onclick="setFilterNoticiasSuperior('publicadas')">Publicadas</button>
            <button class="admin-tab-btn ${filterEstadoActualSuperior === 'rechazadas' ? 'active' : ''}" onclick="setFilterNoticiasSuperior('rechazadas')">Rechazadas</button>
        </div>
        <table class="admin-table" style="width: 100%; border-collapse: collapse;">
            <thead>
                <tr>
                    <th>Título</th>
                    <th>Autor</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                </tr>
            </thead>
            <tbody>
                ${filtradas.length === 0 ? '<tr><td colspan="4" style="text-align:center; padding: 2rem;">No hay noticias en esta sección.</td></tr>' : ''}
                ${filtradas.map(n => {
                    const esPublicado = n.estado === 'publicado';
                    const esRechazado = n.estado === 'rechazado';

                    return `
                    <tr>
                        <td><strong>${escapeHtmlSuperior(n.titulo)}</strong></td>
                        <td>${escapeHtmlSuperior(n.autores?.nombre || 'Desconocido')}</td>
                        <td>
                            ${getBadgeEstadoSuperior(n.estado)}
                            ${n.destacada ? ' ⭐ destacada' : ''}
                        </td>
                        <td>
                            <div class="actions-cell" style="display: flex; gap: 6px;">
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
    `;

    container.innerHTML = html;
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

    setVal('editNoticiaIdSuperior', noticia.id);
    setVal('editNoticiaTituloSuperior', noticia.titulo);
    setVal('editNoticiaResumenSuperior', noticia.resumen);
    setVal('editNoticiaCuerpoSuperior', noticia.cuerpo);

    const imgPreview = document.getElementById('editNoticiaImagenPreviewSuperior');
    if (imgPreview) {
        imgPreview.src = noticia.imagenes?.url || 'https://placehold.co/600x400?text=Sin+Imagen';
    }

    const modal = document.getElementById('modalEditarNoticiaSuperior');
    if (modal) modal.style.display = 'flex';
}

function cerrarModalEditarNoticiaSuperior() {
    const modal = document.getElementById('modalEditarNoticiaSuperior');
    if (modal) modal.style.display = 'none';
}

async function guardarEdicionNoticiaSuperior(event) {
    if (event) event.preventDefault();

    try {
        const client = getClientSuperior();
        const id = document.getElementById('editNoticiaIdSuperior')?.value;
        const titulo = document.getElementById('editNoticiaTituloSuperior')?.value.trim();
        const resumen = document.getElementById('editNoticiaResumenSuperior')?.value.trim();
        const cuerpo = document.getElementById('editNoticiaCuerpoSuperior')?.value.trim();

        const { error } = await client
            .from('noticias')
            .update({ titulo, resumen, cuerpo, actualizado_en: new Date().toISOString() })
            .eq('id', id);

        if (error) throw error;

        alert('✅ Noticia actualizada con éxito.');
        cerrarModalEditarNoticiaSuperior();
        await loadGestionarNoticiasSuperior();

    } catch (err) {
        console.error('❌ Error al actualizar noticia:', err);
        alert('Error al guardar cambios: ' + err.message);
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