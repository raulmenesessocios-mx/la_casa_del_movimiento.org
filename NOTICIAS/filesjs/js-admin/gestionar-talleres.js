let listaTalleristas = [];

document.addEventListener('DOMContentLoaded', () => {
    loadAllTalleres();
});

function getAdminClient() {
    return window.supabaseClient || window.dbClient;
}

async function loadAllTalleres() {
    const container = document.getElementById('talleresAdminList');
    if (!container) return;

    try {
        const client = getAdminClient();
        if (!client) throw new Error("Cliente Supabase no disponible.");

        // 1. Cargar catálogo de capacitadores
        const { data: talleristasData, error: errTalleristas } = await client
            .from('autores')
            .select('id, nombre, email, rol')
            .in('rol', ['tallerista', 'superior']);

        if (errTalleristas) console.error('Error al cargar talleristas:', errTalleristas);
        listaTalleristas = talleristasData || [];

        // 2. Cargar lista global de talleres
        const { data: talleres, error } = await client
            .from('talleres')
            .select(`
                id, 
                titulo, 
                cupo, 
                instructor_id,
                autores!instructor_id(nombre)
            `);

        if (error) throw error;

        if (!talleres || talleres.length === 0) {
            container.innerHTML = '<p>No hay talleres registrados en el sistema.</p>';
            return;
        }

        const html = `
            <table class="table" style="width:100%; border-collapse: collapse;">
                <thead>
                    <tr>
                        <th>Taller</th>
                        <th>Cupo</th>
                        <th>Instructor / Tallerista Asignado</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    ${talleres.map(t => {
                        const tituloEscapado = escapeHtmlAdmin(t.titulo || 'Sin título');
                        
                        const opcionesSelect = listaTalleristas.map(inst => {
                            const tagRol = inst.rol === 'superior' ? ' [Superior]' : '';
                            const nombreInst = escapeHtmlAdmin(inst.nombre || 'Sin nombre');
                            return `
                                <option value="${inst.id}" ${inst.id === t.instructor_id ? 'selected' : ''}>
                                    ${nombreInst}${tagRol} (${escapeHtmlAdmin(inst.email)})
                                </option>
                            `;
                        }).join('');

                        return `
                            <tr>
                                <td><strong>${tituloEscapado}</strong></td>
                                <td>${t.cupo || 0} personas</td>
                                <td>
                                    <select 
                                        class="form-control" 
                                        style="padding: 0.4rem 0.6rem; border-radius: 6px; border: 1px solid #ccc; width: 100%; font-size: 0.95rem;"
                                        onchange="reasignarInstructorDirecto('${t.id}', this.value, '${t.instructor_id || ''}')">
                                        <option value="">-- Sin asignación --</option>
                                        ${opcionesSelect}
                                    </select>
                                </td>
                                <td>
                                    <button 
                                        class="btn btn-danger btn-sm" 
                                        onclick="eliminarTaller('${t.id}', '${escapeHtmlAdmin(t.titulo).replace(/'/g, "\\'")}')">
                                        Eliminar
                                    </button>
                                </td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        `;

        container.innerHTML = html;
    } catch (error) {
        console.error('Error al listar talleres:', error);
        container.innerHTML = '<p>❌ Error al cargar los talleres.</p>';
    }
}

async function reasignarInstructorDirecto(tallerId, nuevoInstructorId, instructorActualId) {
    if (nuevoInstructorId === instructorActualId) return;

    const client = getAdminClient();
    const talleristaElegido = listaTalleristas.find(t => t.id === nuevoInstructorId);
    const nombreMostrar = talleristaElegido ? (talleristaElegido.nombre || talleristaElegido.email) : 'el usuario seleccionado';

    if (!confirm(`¿Deseas reasignar este taller a ${nombreMostrar}?`)) {
        await loadAllTalleres();
        return;
    }

    try {
        const { error } = await client
            .from('talleres')
            .update({ instructor_id: nuevoInstructorId || null })
            .eq('id', tallerId);

        if (error) throw error;

        alert(`✅ Taller reasignado correctamente a ${nombreMostrar}`);
        await loadAllTalleres();
    } catch (error) {
        console.error('Error al reasignar instructor:', error);
        alert('❌ No se pudo reasignar el instructor: ' + error.message);
        await loadAllTalleres();
    }
}

async function eliminarTaller(tallerId, tituloTaller) {
    if (!confirm(`¿Estás seguro de eliminar el taller "${tituloTaller}"?\nEsta acción no se puede deshacer.`)) return;

    try {
        const client = getAdminClient();
        const { error } = await client
            .from('talleres')
            .delete()
            .eq('id', tallerId);

        if (error) throw error;

        alert('✅ Taller eliminado con éxito.');
        await loadAllTalleres();
        if (typeof loadDashboardStats === 'function') loadDashboardStats();
    } catch (error) {
        console.error('Error al eliminar taller:', error);
        alert('❌ No se pudo eliminar el taller: ' + error.message);
    }
}