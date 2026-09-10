let filterEstadoActual = 'todas';

document.addEventListener('DOMContentLoaded', () => {
    loadAllNoticiasAdmin();

    const formEdit = document.getElementById('editarNoticiaForm');
    if (formEdit && !formEdit.dataset.listenerAttached) {
        formEdit.addEventListener('submit', guardarEdicionNoticia);
        formEdit.dataset.listenerAttached = 'true';
    }
});

function getAdminClient() {
    return window.supabaseClient || window.dbClient;
}

function escapeHtmlAdmin(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

async function loadAllNoticiasAdmin() {
    try {
        const container = document.getElementById('noticiasAdminList');
        if (!container) return;

        const client = getAdminClient();
        if (!client) throw new Error("Cliente Supabase no disponible.");

        const { data, error } = await client
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
        
        window.noticiasAdminCache = data || [];
        renderTableAdmin();
    } catch (error) {
        console.error('❌ Error al listar noticias admin:', error);
    }
}

function setFilterNoticias(estado) {
    filterEstadoActual = estado;
    renderTableAdmin();
}

function renderTableAdmin() {
    const container = document.getElementById('noticiasAdminList');
    if (!container) return;

    let filtradas = window.noticiasAdminCache || [];
    if (filterEstadoActual === 'publicadas') {
        filtradas = filtradas.filter(n => n.estado === 'publicado');
    } else if (filterEstadoActual === 'revision') {
        filtradas = filtradas.filter(n => n.estado === 'en_revision');
    } else if (filterEstadoActual === 'rechazadas') {
        filtradas = filtradas.filter(n => n.estado === 'rechazado');
    }

    const html = `
        <div class="admin-tabs" style="margin-bottom: 1rem; display: flex; gap: 0.5rem;">
            <button class="admin-tab-btn ${filterEstadoActual === 'todas' ? 'active' : ''}" onclick="setFilterNoticias('todas')">Todas</button>
            <button class="admin-tab-btn ${filterEstadoActual === 'revision' ? 'active' : ''}" onclick="setFilterNoticias('revision')">En Revisión</button>
            <button class="admin-tab-btn ${filterEstadoActual === 'publicadas' ? 'active' : ''}" onclick="setFilterNoticias('publicadas')">Publicadas</button>
            <button class="admin-tab-btn ${filterEstadoActual === 'rechazadas' ? 'active' : ''}" onclick="setFilterNoticias('rechazadas')">Rechazadas</button>
        </div>
        <table class="admin-table" style="width:100%; border-collapse: collapse;">
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
                        <td><strong>${escapeHtmlAdmin(n.titulo)}</strong></td>
                        <td>${escapeHtmlAdmin(n.autores?.nombre || 'Desconocido')}</td>
                        <td>
                            ${getBadgeEstado(n.estado)}
                            ${n.destacada ? ' ⭐ destacada' : ''}
                        </td>
                        <td>
                            <div class="actions-cell">
                                ${!esPublicado ? `<button class="btn-tabla btn-publicar" onclick="cambiarEstadoNoticia('${n.id}', 'publicado', true)">Publicar</button>` : ''}
                                ${!esPublicado && !esRechazado ? `<button class="btn-tabla btn-regresar" onclick="cambiarEstadoNoticia('${n.id}', 'rechazado', false)">Rechazar</button>` : ''}
                                <button class="btn-tabla btn-editar" onclick="abrirEditarNoticia('${n.id}')">Editar</button>
                                <button class="btn-tabla btn-eliminar" onclick="deleteNoticia('${n.id}')">🗑️</button>
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

function getBadgeEstado(estado) {
    if (estado === 'publicado') return '<span class="badge-status badge-publicado">Publicada</span>';
    if (estado === 'rechazado') return '<span class="badge-status badge-rechazado">Rechazada</span>';
    return '<span class="badge-status badge-revision">En Revisión</span>';
}

async function cambiarEstadoNoticia(noticiaId, nuevoEstado, esPublicado) {
    try {
        const client = getAdminClient();
        const { error } = await client
            .from('noticias')
            .update({ 
                estado: nuevoEstado, 
                publicado: esPublicado,
                actualizado_en: new Date().toISOString()
            })
            .eq('id', noticiaId);

        if (error) throw error;

        await loadAllNoticiasAdmin();
    } catch (err) {
        console.error('❌ Error cambiando estado de noticia:', err);
        alert('Error al cambiar el estado: ' + err.message);
    }
}

function abrirEditarNoticia(noticiaId) {
    const noticia = (window.noticiasAdminCache || []).find(n => n.id === noticiaId);
    if (!noticia) {
        console.error('❌ No se encontró la noticia en caché:', noticiaId);
        return;
    }

    const setVal = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.value = val ?? '';
    };

    const setChecked = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.checked = Boolean(val);
    };

    setVal('editNoticiaId', noticia.id);
    setVal('editImagenIdActual', noticia.imagen_id);
    setVal('editNoticiaTitulo', noticia.titulo);
    setVal('editNoticiaResumen', noticia.resumen);
    setVal('editNoticiaCuerpo', noticia.cuerpo);
    setVal('editNoticiaCategoria', noticia.categorias?.slug || 'reflexiones');
    setChecked('editNoticiaPublicado', noticia.publicado);
    setChecked('editNoticiaDestacada', noticia.destacada);

    const imgPreview = document.getElementById('editNoticiaImagenPreview');
    if (imgPreview) {
        imgPreview.src = noticia.imagenes?.url || 'https://placehold.co/600x400?text=Sin+Imagen';
    }

    const modal = document.getElementById('editNoticiaModal');
    if (modal) modal.style.display = 'flex';
}

function cerrarModalEditar() {
    const modal = document.getElementById('editNoticiaModal');
    if (modal) modal.style.display = 'none';

    const form = document.getElementById('editarNoticiaForm');
    if (form) form.reset();

    const imgPreview = document.getElementById('editNoticiaImagenPreview');
    if (imgPreview) imgPreview.src = 'https://placehold.co/600x400?text=Sin+Imagen';
}

async function guardarEdicionNoticia(e) {
    if (e) e.preventDefault();

    const client = getAdminClient();
    const id = document.getElementById('editNoticiaId')?.value;
    let mimagenId = document.getElementById('editImagenIdActual')?.value || null;
    const titulo = document.getElementById('editNoticiaTitulo')?.value.trim();
    const resumen = document.getElementById('editNoticiaResumen')?.value.trim();
    const cuerpo = document.getElementById('editNoticiaCuerpo')?.value.trim();
    const categorySlug = document.getElementById('editNoticiaCategoria')?.value;
    const publicado = document.getElementById('editNoticiaPublicado')?.checked || false;
    const destacada = document.getElementById('editNoticiaDestacada')?.checked || false;
    const fileInput = document.getElementById('editNoticiaImagen');
    const file = fileInput ? fileInput.files[0] : null;

    try {
        if (!titulo || !resumen || !cuerpo || !categorySlug) {
            alert('⚠️ Por favor completa los campos obligatorios.');
            return;
        }

        if (file) {
            if (file.type !== 'image/webp') {
                alert('⚠️ La imagen debe estar en formato .webp');
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
            mimagenId = imgRecord.id;
        }

        const { data: catData, error: catErr } = await client
            .from('categorias')
            .select('id')
            .eq('slug', categorySlug)
            .single();

        if (catErr) throw catErr;

        const { error: updateErr } = await client
            .from('noticias')
            .update({
                titulo,
                resumen,
                cuerpo,
                categoria_id: catData.id,
                imagen_id: mimagenId,
                publicado,
                estado: publicado ? 'publicado' : 'en_revision',
                destacada,
                actualizado_en: new Date().toISOString()
            })
            .eq('id', id);

        if (updateErr) throw updateErr;

        alert('✅ Noticia actualizada con éxito');
        cerrarModalEditar();
        await loadAllNoticiasAdmin();
    } catch (error) {
        console.error('❌ Error al actualizar noticia:', error);
        alert('❌ Error al actualizar: ' + error.message);
    }
}

async function deleteNoticia(noticiaId) {
    if (!confirm('¿Estás seguro de que quieres eliminar esta noticia?')) return;

    try {
        const client = getAdminClient();
        const { error } = await client
            .from('noticias')
            .delete()
            .eq('id', noticiaId);

        if (error) throw error;

        alert('✅ Noticia eliminada');
        await loadAllNoticiasAdmin();
        if (typeof loadDashboardStats === 'function') loadDashboardStats();
    } catch (error) {
        console.error('❌ Error al eliminar noticia:', error);
        alert('❌ Error al eliminar la noticia');
    }
}