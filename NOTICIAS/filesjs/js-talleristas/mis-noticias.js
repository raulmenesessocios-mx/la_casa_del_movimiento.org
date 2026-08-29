document.addEventListener('DOMContentLoaded', () => {
    try {
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
            .select('*, categorias(slug, nombre)')
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

// Alias global para ser llamado desde crear-noticia.js
window.loadMisNoticias = loadMisNoticias;
window.loadMyNoticias = loadMisNoticias;

function renderMisNoticias(noticias) {
    const container = document.getElementById('noticiasGrid');
    if (!container) return;

    if (!noticias || noticias.length === 0) {
        container.innerHTML = '<p>Aún no has redactado ninguna noticia.</p>';
        return;
    }

    container.innerHTML = noticias.map(n => {
        const esRechazada = n.estado === 'rechazado' || n.estado === 'no_aprobada';
        const titulo = escapeHtml(n.titulo);
        const resumen = escapeHtml(n.resumen);

        return `
            <div class="card-noticia-item" style="border: 1px solid #e2e8f0; padding: 18px; border-radius: 12px; background: #fff; margin-bottom: 15px; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
                <h3 style="margin-top:0;">${titulo}</h3>
                <p style="color: #64748b; font-size: 0.9em; margin-bottom: 8px;">${resumen}</p>
                <p style="margin: 10px 0;"><strong>Estado:</strong> ${getBadgeEstadoTallerista(n.estado)}</p>
                
                <div style="display: flex; gap: 10px; margin-top: 15px;">
                    ${esRechazada ? `
                        <button type="button" class="btn btn-warning" onclick="abrirEditarNoticiaTallerista('${n.id}')" style="background: #f39c12; color: white; border: none; padding: 8px 14px; border-radius: 6px; cursor: pointer; font-weight: bold;">
                            ✏️ Editar y Reenviar
                        </button>
                    ` : ''}
                    <button type="button" class="btn btn-danger" onclick="deleteNoticiaTallerista('${n.id}')" style="background: #e74c3c; color: white; border: none; padding: 8px 14px; border-radius: 6px; cursor: pointer; font-weight: bold;">
                        🗑️ Eliminar
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

function getBadgeEstadoTallerista(estado) {
    if (estado === 'publicado') return '<span style="color:#27ae60; font-weight:bold;">✅ Publicada</span>';
    if (estado === 'rechazado' || estado === 'no_aprobada') return '<span style="color:#e74c3c; font-weight:bold;">❌ No aprobada (Requiere cambios)</span>';
    return '<span style="color:#f39c12; font-weight:bold;">⏳ En Revisión</span>';
}

function abrirEditarNoticiaTallerista(noticiaId) {
    if (!window.misNoticiasCache) return;
    const noticia = window.misNoticiasCache.find(n => n.id === noticiaId);
    if (!noticia) return;

    const campoId = document.getElementById('editTalleristaId');
    const campoImagenId = document.getElementById('editTalleristaImagenIdActual');
    const campoTitulo = document.getElementById('editTalleristaTitulo');
    const campoResumen = document.getElementById('editTalleristaResumen');
    const campoCuerpo = document.getElementById('editTalleristaCuerpo');
    const catSelect = document.getElementById('editTalleristaCategoria');
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

    if (catSelect) {
        catSelect.value = noticia.categorias?.slug || 'reflexiones';
    }

    modal.style.display = 'flex';
}

function cerrarModalTallerista() {
    const modal = document.getElementById('modalEditarNoticiaTallerista');
    if (modal) modal.style.display = 'none';
    const form = document.getElementById('formEditarTallerista');
    if (form) form.reset();
}

async function volverAMandarNoticia(e) {
    e.preventDefault();

    const client = window.supabaseClient || window.dbClient;
    if (!client) {
        alert('❌ Error: Cliente de base de datos no disponible.');
        return;
    }

    const id = document.getElementById('editTalleristaId').value;
    const campoImagenId = document.getElementById('editTalleristaImagenIdActual');
    let imagenId = campoImagenId ? (campoImagenId.value || null) : null;
    const titulo = document.getElementById('editTalleristaTitulo').value.trim();
    const resumen = document.getElementById('editTalleristaResumen').value.trim();
    const cuerpo = document.getElementById('editTalleristaCuerpo').value.trim();
    const categorySlug = document.getElementById('editTalleristaCategoria').value;

    if (!titulo || !resumen || !cuerpo) {
        alert('⚠️ Título, resumen y cuerpo son obligatorios.');
        return;
    }

    const fileInput = document.getElementById('editTalleristaImagen');
    const file = fileInput ? fileInput.files[0] : null;

    try {
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
            imagenId = imgRecord.id;
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
                imagen_id: imagenId,
                estado: 'en_revision',
                publicado: false
            })
            .eq('id', id);

        if (updateErr) throw updateErr;

        alert('🚀 Noticia actualizada y reenviada a revisión.');
        cerrarModalTallerista();
        loadMisNoticias();
    } catch (error) {
        console.error('Error al reenviar noticia:', error);
        alert('❌ Error al reenviar noticia: ' + error.message);
    }
}

async function deleteNoticiaTallerista(noticiaId) {
    if (!confirm('¿Seguro que deseas eliminar esta noticia?')) return;
    try {
        const client = window.supabaseClient || window.dbClient;
        if (!client) {
            alert('❌ Error: Cliente de base de datos no disponible.');
            return;
        }
        const { error } = await client.from('noticias').delete().eq('id', noticiaId);
        if (error) throw error;

        alert('🗑️ Noticia eliminada.');
        loadMisNoticias();
    } catch (err) {
        console.error('Error al eliminar:', err);
        alert('❌ No se pudo eliminar la noticia.');
    }
}