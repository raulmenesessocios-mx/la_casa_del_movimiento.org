document.addEventListener('DOMContentLoaded', () => {
    loadVerTalleresSuperior();
});

function getClientSuperior() {
    return window.supabaseClient || window.dbClient;
}

function escapeHtmlSuperior(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

async function loadVerTalleresSuperior() {
    const container = document.getElementById('verTalleresTablaBodySuperior');
    if (!container) return;

    try {
        const client = getClientSuperior();
        if (!client) throw new Error("Cliente Supabase no disponible.");

        // Consulta estandarizada a las tablas relacionales
        const { data: talleres, error } = await client
            .from('talleres')
            .select(`
                id,
                titulo,
                cupo,
                instructor_id,
                autores!instructor_id(nombre, email)
            `);

        if (error) throw error;

        renderVerTalleresTablaSuperior(talleres || []);

    } catch (err) {
        console.error('❌ Error al cargar talleres (Superior):', err);
        container.innerHTML = '<tr><td colspan="3" style="text-align: center; color: #dc3545;">Error al cargar la oferta de talleres.</td></tr>';
    }
}

function renderVerTalleresTablaSuperior(lista) {
    const container = document.getElementById('verTalleresTablaBodySuperior');
    if (!container) return;

    if (!lista || lista.length === 0) {
        container.innerHTML = '<tr><td colspan="3" style="text-align: center; padding: 20px;">No hay talleres registrados en la plataforma.</td></tr>';
        return;
    }

    // Tabla de Solo Lectura (Sin botones de edición ni eliminación)
    container.innerHTML = `
        <table class="table" style="width: 100%; border-collapse: collapse;">
            <thead>
                <tr>
                    <th>Taller</th>
                    <th>Cupo Máximo</th>
                    <th>Instructor Asignado</th>
                </tr>
            </thead>
            <tbody>
                ${lista.map(t => {
                    const instructor = t.autores?.nombre 
                        ? `${escapeHtmlSuperior(t.autores.nombre)} (${escapeHtmlSuperior(t.autores.email)})`
                        : '<span style="color: #888;">Sin instructor asignado</span>';

                    return `
                        <tr>
                            <td><strong>${escapeHtmlSuperior(t.titulo)}</strong></td>
                            <td>${t.cupo || 0} personas</td>
                            <td>${instructor}</td>
                        </tr>
                    `;
                }).join('')}
            </tbody>
        </table>
    `;
}