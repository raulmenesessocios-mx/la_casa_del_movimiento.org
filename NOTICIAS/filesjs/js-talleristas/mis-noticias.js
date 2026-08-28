async function loadMyNoticias(userId) {
    try {
        const { data, error } = await window.supabaseClient
            .from('noticias')
            .select('id, titulo, resumen, fecha_publicacion, publicado')
            .eq('autor_id', userId)
            .order('fecha_publicacion', { ascending: false });

        if (error) throw error;

        if (!data || data.length === 0) {
            document.getElementById('noticiasGrid').innerHTML = '<p>Aún no tienes noticias publicadas</p>';
            return;
        }

        document.getElementById('noticiasGrid').innerHTML = data.map(noticia => `
            <div class="card">
                <h3>${noticia.titulo}</h3>
                <p>${noticia.resumen}</p>
                <p style="font-size: 0.85rem; color: #999;">
                    ${new Date(noticia.fecha_publicacion).toLocaleDateString()}
                    ${noticia.publicado ? '✅ Publicada' : '❌ Borrador'}
                </p>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error:', error);
    }
}