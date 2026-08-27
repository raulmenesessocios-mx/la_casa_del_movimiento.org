document.addEventListener('DOMContentLoaded', () => {
    loadAllNoticias();
});

async function loadAllNoticias() {
    try {
        const container = document.getElementById('noticiasAdminList');
        if (!container) return;

        const { data } = await window.dbClient
            .from('noticias')
            .select('id, titulo, publicado, destacada')
            .order('fecha_publicacion', { ascending: false });

        if (!data) return;

        const html = `
            <table class="table">
                <thead>
                    <tr>
                        <th>Título</th>
                        <th>Estado</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    ${data.map(n => `
                        <tr>
                            <td>${n.titulo}</td>
                            <td>${n.publicado ? '✅ Publicada' : '❌ Borrador'} ${n.destacada ? '⭐ Destacada' : ''}</td>
                            <td>
                                <button class="btn btn-secondary" onclick="deleteNoticia('${n.id}')">Eliminar</button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;

        container.innerHTML = html;
    } catch (error) {
        console.error('Error al listar noticias:', error);
    }
}

async function deleteNoticia(noticiaId) {
    if (confirm('¿Estás seguro de que quieres eliminar esta noticia?')) {
        try {
            const { error } = await window.dbClient
                .from('noticias')
                .delete()
                .eq('id', noticiaId);

            if (error) throw error;

            alert('✅ Noticia eliminada');
            loadAllNoticias();
            if (typeof loadDashboardStats === 'function') loadDashboardStats();
        } catch (error) {
            console.error('Error:', error);
            alert('❌ Error al eliminar noticia');
        }
    }
}