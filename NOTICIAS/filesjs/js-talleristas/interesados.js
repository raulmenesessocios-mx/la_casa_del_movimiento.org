async function loadInteresados(userId) {
    const contenedor = document.getElementById('interesadosList');
    try {
        const { data: talleres, error: tallerError } = await window.supabaseClient
            .from('talleres')
            .select('id, titulo')
            .eq('instructor_id', userId);

        if (tallerError || !talleres || talleres.length === 0) {
            contenedor.innerHTML = '<p>No tienes talleres registrados</p>';
            return;
        }

        const mapaTalleres = {};
        talleres.forEach(t => mapaTalleres[t.id] = t.titulo);
        const tallerIds = talleres.map(t => t.id);

        const { data, error } = await window.supabaseClient
            .from('interesados_talleres')
            .select('*')
            .in('taller_id', tallerIds)
            .order('fecha_registro', { ascending: false });

        if (error) throw error;

        if (!data || data.length === 0) {
            contenedor.innerHTML = '<p>Aún no hay personas interesadas</p>';
            return;
        }

        contenedor.innerHTML = `
            <table class="table">
                <thead>
                    <tr>
                        <th>Taller</th>
                        <th>Nombre</th>
                        <th>Email</th>
                        <th>Teléfono</th>
                        <th>Mensaje / Exp.</th>
                        <th>Fecha</th>
                    </tr>
                </thead>
                <tbody>
                    ${data.map(i => `
                        <tr>
                            <td><strong>${mapaTalleres[i.taller_id] || 'Taller'}</strong></td>
                            <td>${i.nombre}</td>
                            <td>${i.email}</td>
                            <td>${i.telefono || 'N/A'}</td>
                            <td>${i.mensaje || '-'}</td>
                            <td>${new Date(i.fecha_registro).toLocaleDateString()}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    } catch (error) {
        console.error('Error:', error);
        contenedor.innerHTML = '<p>Error al cargar interesados</p>';
    }
}