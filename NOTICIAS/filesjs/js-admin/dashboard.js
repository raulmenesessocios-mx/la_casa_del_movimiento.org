document.addEventListener('DOMContentLoaded', () => {
    loadDashboardStats();
});

async function loadDashboardStats() {
    try {
        const { count: eventosCount } = await window.dbClient
            .from('eventos')
            .select('*', { count: 'exact', head: true });

        const { count: noticiasCount } = await window.dbClient
            .from('noticias')
            .select('*', { count: 'exact', head: true });

        const { count: talleresCount } = await window.dbClient
            .from('talleres')
            .select('*', { count: 'exact', head: true });

        const { count: talleristasCount } = await window.dbClient
            .from('autores')
            .select('*', { count: 'exact', head: true })
            .eq('rol', 'tallerista');

        const elEventos = document.getElementById('totalEventos');
        const elNoticias = document.getElementById('totalNoticias');
        const elTalleres = document.getElementById('totalTalleres');
        const elTalleristas = document.getElementById('totalTalleristas');

        if (elEventos) elEventos.textContent = eventosCount || 0;
        if (elNoticias) elNoticias.textContent = noticiasCount || 0;
        if (elTalleres) elTalleres.textContent = talleresCount || 0;
        if (elTalleristas) elTalleristas.textContent = talleristasCount || 0;
    } catch (error) {
        console.error('Error cargando stats:', error);
    }
}