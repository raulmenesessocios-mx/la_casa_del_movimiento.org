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
            <div class="card mis-noticias-empty">
                Aún no has publicado ninguna noticia propia.
            </div>`;
        return;
    }

    container.innerHTML = noticias.map(n => `
        <div class="card mis-noticias-card">
            <div class="mis-noticias-content">
                ${n.imagenes?.url ? `
                    <img src="${n.imagenes.url}" alt="${escapeHtmlSuperior(n.titulo)}" class="mis-noticias-img">
                ` : ''}
                <div class="mis-noticias-body">
                    <h3 class="card-title mis-noticias-title">${escapeHtmlSuperior(n.titulo)}</h3>
                    <p class="mis-noticias-text">${escapeHtmlSuperior(n.resumen)}</p>
                    <div class="mis-noticias-meta">
                        <span class="badge-status badge-publicado">
                            ${escapeHtmlSuperior(n.estado || 'publicado')}
                        </span>
                        <span class="mis-noticias-date">
                            ${n.fecha_publicacion ? new Date(n.fecha_publicacion).toLocaleDateString('es-MX', { year: 'numeric', month: 'short', day: 'numeric' }) : 'Reciente'}
                        </span>
                    </div>
                </div>
            </div>
            <div class="mis-noticias-footer">
                <button type="button" class="btn-tabla btn-eliminar" onclick="eliminarNoticiaSuperior('${n.id}')">
                    Eliminar
                </button>
            </div>
        </div>
    `).join('');
}

async function eliminarNoticiaSuperior(noticiaId, targetBtn = null) {
    if (!confirm('¿Seguro que deseas eliminar esta noticia?')) return;

    // Si se pasa event.target o la referencia del botón, se usa ese; si no, intenta buscarlo
    const submitBtn = targetBtn || document.activeElement;
    const originalBtnText = submitBtn ? submitBtn.innerText : '';

    try {
        if (submitBtn && submitBtn.tagName === 'BUTTON') {
            submitBtn.disabled = true;
            submitBtn.innerText = 'Borrando...';
        }

        const client = window.supabaseClient || window.dbClient;
        const { error } = await client
            .from('noticias')
            .delete()
            .eq('id', noticiaId);

        if (error) throw error;

        alert('🗑️ Noticia eliminada exitosamente.');
        await loadMisNoticiasSuperior();

    } catch (err) {
        console.error('❌ Error al eliminar noticia:', err);
        alert('❌ No se pudo eliminar la noticia: ' + err.message);
    } finally {
        // Garantiza que el botón vuelva a su estado original (éxito o error)
        if (submitBtn && submitBtn.tagName === 'BUTTON') {
            submitBtn.disabled = false;
            submitBtn.innerText = originalBtnText;
        }
    }
}