// Validación e inicialización directa del Dashboard Administrativo
document.addEventListener('DOMContentLoaded', () => {
    loadDashboardStats();
});

async function loadDashboardStats() {
    try {
        const client = window.supabaseClient || window.dbClient;
        if (!client) throw new Error("Cliente Supabase no inicializado.");

        // Consultas concurrentes en paralelo para optimizar la latencia de red
        const [eventos, noticias, talleres, talleristas] = await Promise.all([
            client.from('eventos').select('*', { count: 'exact', head: true }),
            client.from('noticias').select('*', { count: 'exact', head: true }),
            client.from('talleres').select('*', { count: 'exact', head: true }),
            client.from('autores').select('*', { count: 'exact', head: true }).in('rol', ['tallerista', 'superior'])
        ]);

        const updateElem = (id, val) => {
            const el = document.getElementById(id);
            if (el) el.textContent = val || 0;
        };

        updateElem('totalEventos', eventos.count);
        updateElem('totalNoticias', noticias.count);
        updateElem('totalTalleres', talleres.count);
        updateElem('totalTalleristas', talleristas.count);

    } catch (error) {
        console.error('❌ Error al cargar métricas del Dashboard:', error.message);
    }
}