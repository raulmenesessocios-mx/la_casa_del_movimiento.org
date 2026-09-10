async function loadMisNoticiasSuperior() {
    try {
        const client = window.supabaseClient || window.dbClient;
        const container = document.getElementById('misNoticiasContainerSuperior');
        if (!client || !container) return;

        const { data: authData } = await client.auth.getUser();
        const user = authData?.user;
        if (!user) return;

        const { data: autor, error: autorErr } = await client
            .from('autores')
            .select('id')
            .eq('email', user.email)
            .single();

        if (autorErr || !autor) {
            container.innerHTML = `
                <div class="alert alert-warning" style="padding: 15px; background: #fef3c7; border-radius: 8px; color: #92400e;">
                    ⚠️ No se encontró la ficha de autor asociada a tu cuenta.
                </div>`;
            return;
        }

        const { data: noticias, error } = await client
            .from('noticias')
            .select('*, categorias(nombre, slug), imagenes(url)')
            .eq('autor_id', autor.id)
            .order('fecha_publicacion', { ascending: false });

        if (error) throw error;

        renderMisNoticiasSuperior(noticias);

    } catch (err) {
        console.error('Error cargando noticias personales del Superior:', err);
        const container = document.getElementById('misNoticiasContainerSuperior');
        if (container) {
            container.innerHTML = `
                <div class="alert alert-danger" style="padding: 15px; background: #ffe4e6; border-radius: 8px; color: #9f1239;">
                    ❌ Error al cargar tus publicaciones.
                </div>`;
        }
    }
}

function renderMisNoticiasSuperior(noticias) {
    const container = document.getElementById('misNoticiasContainerSuperior');
    if (!container) return;

    if (!noticias || noticias.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 30px; color: #64748b; background: #f8fafc; border-radius: 8px;">
                📌 Aún no has publicado ninguna noticia propia.
            </div>`;
        return;
    }

    container.innerHTML = noticias.map(n => `
        <div class="card-noticia-item" style="border: 1px solid #e2e8f0; border-radius: 10px; padding: 16px; margin-bottom: 16px; background: #fff; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
            <div style="display: flex; gap: 15px; align-items: flex-start;">
                ${n.imagenes?.url ? `
                    <img src="${n.imagenes.url}" alt="${escapeHtmlSuperior(n.titulo)}" style="width: 100px; height: 100px; object-fit: cover; border-radius: 8px;">
                ` : ''}
                <div style="flex: 1;">
                    <h3 style="margin: 0 0 8px 0; font-size: 1.1em; color: #1e293b;">${escapeHtmlSuperior(n.titulo)}</h3>
                    <p style="color: #64748b; font-size: 0.9em; margin: 0 0 10px 0;">${escapeHtmlSuperior(n.resumen)}</p>
                    <div style="display: flex; gap: 10px; align-items: center; font-size: 0.85em;">
                        <span style="background: #dcfce7; color: #15803d; padding: 3px 8px; border-radius: 4px; font-weight: 600;">
                            🟢 ${escapeHtmlSuperior(n.estado || 'publicado')}
                        </span>
                        <span style="color: #94a3b8;">
                            📅 ${n.fecha_publicacion ? new Date(n.fecha_publicacion).toLocaleDateString('es-MX', { year: 'numeric', month: 'short', day: 'numeric' }) : 'Reciente'}
                        </span>
                    </div>
                </div>
            </div>
            <div style="display: flex; gap: 10px; justify-content: flex-end; margin-top: 12px; border-top: 1px solid #f1f5f9; padding-top: 10px;">
                <button type="button" class="btn btn-sm btn-outline-danger" onclick="eliminarNoticiaSuperior('${n.id}')" style="background: #fff1f2; color: #e11d48; border: 1px solid #fecdd3; padding: 6px 12px; border-radius: 6px; cursor: pointer;">
                    🗑️ Eliminar
                </button>
            </div>
        </div>
    `).join('');
}

async function eliminarNoticiaSuperior(noticiaId) {
    if (!confirm('¿Seguro que deseas eliminar esta noticia?')) return;

    try {
        const client = window.supabaseClient || window.dbClient;
        const { error } = await client
            .from('noticias')
            .delete()
            .eq('id', noticiaId);

        if (error) throw error;

        alert('🗑️ Noticia eliminada exitosamente.');
        loadMisNoticiasSuperior();

    } catch (err) {
        console.error('Error al eliminar noticia:', error);
        alert('❌ No se pudo eliminar la noticia: ' + err.message);
    }
}