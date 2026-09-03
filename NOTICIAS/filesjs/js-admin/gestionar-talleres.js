document.addEventListener('DOMContentLoaded', () => {
    loadAllTalleres();
});

let listaTalleristas = [];

async function loadAllTalleres() {
    try {
        const container = document.getElementById('talleresAdminList');
        if (!container) return;

        // 1. Cargar talleristas desde la tabla 'autores'
        const { data: talleristasData, error: errTalleristas } = await window.dbClient
            .from('autores')
            .select('id, nombre, email')
            .eq('rol', 'tallerista');

        if (errTalleristas) console.error('Error al cargar talleristas:', errTalleristas);
        listaTalleristas = talleristasData || [];

        // 2. Cargar talleres
        const { data: talleres, error } = await window.dbClient
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
            <table class="table">
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
                        const tituloEscapado = (t.titulo || '').replace(/'/g, "\\'");
                        
                        // Generar las opciones con formato "Nombre (email)"
                        const opcionesSelect = listaTalleristas.map(inst => `
                            <option value="${inst.id}" ${inst.id === t.instructor_id ? 'selected' : ''}>
                                ${inst.nombre || 'Sin nombre'} (${inst.email})
                            </option>
                        `).join('');

                        return `
                            <tr>
                                <td><strong>${t.titulo}</strong></td>
                                <td>${t.cupo} personas</td>
                                <td>
                                    <select 
                                        class="form-control" 
                                        style="padding: 0.4rem 0.6rem; border-radius: 6px; border: 1px solid #ccc; width: 100%; font-size: 0.95rem;"
                                        onchange="reasignarInstructorDirecto('${t.id}', this.value, '${t.instructor_id || ''}')">
                                        ${opcionesSelect}
                                    </select>
                                </td>
                                <td>
                                    <button 
                                        class="btn btn-danger btn-sm" 
                                        onclick="eliminarTaller('${t.id}', '${tituloEscapado}')">
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
        const container = document.getElementById('talleresAdminList');
        if (container) {
            container.innerHTML = '<p>Error al cargar los talleres.</p>';
        }
    }
}

// Reasignar instructor directamente al cambiar la opción en el menú <select>
async function reasignarInstructorDirecto(tallerId, nuevoInstructorId, instructorActualId) {
    if (nuevoInstructorId === instructorActualId) return;

    const talleristaElegido = listaTalleristas.find(t => t.id === nuevoInstructorId);
    const nombreMostrar = talleristaElegido ? (talleristaElegido.nombre || talleristaElegido.email) : 'el usuario seleccionado';

    const confirmacion = confirm(`¿Deseas reasignar este taller a ${nombreMostrar}?`);
    if (!confirmacion) {
        loadAllTalleres(); // Restaurar el selector al estado anterior si se cancela
        return;
    }

    try {
        const { error } = await window.dbClient
            .from('talleres')
            .update({ instructor_id: nuevoInstructorId })
            .eq('id', tallerId);

        if (error) throw error;

        alert(`Taller reasignado correctamente a ${nombreMostrar}`);
        loadAllTalleres();
    } catch (error) {
        console.error('Error al reasignar instructor:', error);
        alert('No se pudo reasignar el instructor: ' + error.message);
        loadAllTalleres();
    }
}

// Eliminar un taller del sistema
async function eliminarTaller(tallerId, tituloTaller) {
    const confirmacion = confirm(`¿Estás seguro de eliminar el taller "${tituloTaller}"?\nEsta acción no se puede deshacer.`);
    if (!confirmacion) return;

    try {
        const { error } = await window.dbClient
            .from('talleres')
            .delete()
            .eq('id', tallerId);

        if (error) throw error;

        alert('Taller eliminado con éxito.');
        loadAllTalleres();
    } catch (error) {
        console.error('Error al eliminar taller:', error);
        alert('No se pudo eliminar el taller: ' + error.message);
    }
}