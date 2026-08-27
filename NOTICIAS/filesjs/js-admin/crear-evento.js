document.addEventListener('DOMContentLoaded', () => {
    loadTallersForSelect();

    const form = document.getElementById('crearEventoForm');
    if (form) {
        form.addEventListener('submit', createEvento);
    }
});

async function loadTallersForSelect() {
    try {
        const { data } = await window.dbClient
            .from('talleres')
            .select('id, titulo');

        const select = document.getElementById('eventoTaller');
        if (!select) return;

        select.innerHTML = '<option value="">Ninguno</option>';
        if (data) {
            data.forEach(taller => {
                const option = document.createElement('option');
                option.value = taller.id;
                option.textContent = taller.titulo;
                select.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Error al cargar talleres en select:', error);
    }
}

async function createEvento(e) {
    e.preventDefault();

    const titulo = document.getElementById('eventoTitulo').value;
    const descripcion = document.getElementById('eventoDescripcion').value;
    const fecha = new Date(document.getElementById('eventoFecha').value);
    const duracion = parseInt(document.getElementById('eventoDuracion').value);
    const ubicacion = document.getElementById('eventoUbicacion').value;
    const tallerRelacionado = document.getElementById('eventoTaller').value || null;

    try {
        const { error } = await window.dbClient
            .from('eventos')
            .insert({
                titulo,
                descripcion,
                fecha_evento: fecha.toISOString(),
                hora_inicio: fecha.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }),
                duracion_minutos: duracion,
                ubicacion,
                taller_relacionado_id: tallerRelacionado,
                estado: 'proximo'
            });

        if (error) throw error;

        alert('✅ Evento creado exitosamente');
        document.getElementById('crearEventoForm').reset();
        if (typeof loadDashboardStats === 'function') loadDashboardStats();
    } catch (error) {
        console.error('Error:', error);
        alert('❌ Error al crear evento: ' + error.message);
    }
}