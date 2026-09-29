document.addEventListener('DOMContentLoaded', async () => {
    // 1. Proteger la ruta con el middleware de supabase-config.js (solo 'administrativo' y 'superior')
    const session = window.protectRoute(['superior']);
    if (!session) return;

    const client = window.supabaseClient || window.initSupabase?.();
    const tbody = document.getElementById('tabla-postulaciones-body');

    if (!client || !tbody) return;

    // 2. Cargar registros desde la base de datos
    async function cargarPostulaciones() {
        try {
            const { data, error } = await client
                .from('postulaciones_talleristas')
                .select('*')
                .order('creado_en', { ascending: false });

            if (error) throw error;

            if (!data || data.length === 0) {
                tbody.innerHTML = '<tr><td colspan="8" style="text-align: center;">No hay postulaciones registradas.</td></tr>';
                return;
            }

            tbody.innerHTML = '';

            data.forEach((item) => {
                const tr = document.createElement('tr');
                const fecha = new Date(item.creado_en).toLocaleDateString('es-MX', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric'
                });

                const estadoBadge = item.visto
                    ? '<span class="badge-visto">Visto</span>'
                    : '<span class="badge-no-visto">Nuevo</span>';

                // Botón/Enlace de descarga directa del PDF
                const pdfLink = item.cv_url
                    ? `<a href="${item.cv_url}" target="_blank" rel="noopener noreferrer" class="btn-action" style="background-color: #059669; text-decoration: none; display: inline-block;">📄 Ver PDF</a>`
                    : '<span style="color: #888;">Sin CV</span>';

                tr.innerHTML = `
                    <td>${fecha}</td>
                    <td><strong>${item.nombre_completo}</strong></td>
                    <td>${item.titulo_taller}</td>
                    <td>${item.area_cultural} (${item.nivel_taller})</td>
                    <td>${item.telefono}<br><small>${item.email}</small></td>
                    <td>${estadoBadge}</td>
                    <td>${pdfLink}</td>
                    <td>
                        <button class="btn-action btn-ver-detalle" data-id="${item.id}">Ver Detalle</button>
                    </td>
                `;

                tbody.appendChild(tr);
            });

            // Registrar eventos para ver detalle de cada postulación
            document.querySelectorAll('.btn-ver-detalle').forEach((btn) => {
                btn.addEventListener('click', (e) => {
                    const id = e.target.getAttribute('data-id');
                    const postulacion = data.find((p) => p.id === id);
                    if (postulacion) mostrarDetalle(postulacion);
                });
            });

        } catch (err) {
            console.error('❌ Error al obtener postulaciones:', err);
            if (window.Modal) {
                Modal.alert('No se pudieron cargar las postulaciones.', 'Error');
            }
        }
    }

    // 3. Mostrar información detallada del postulante
    async function mostrarDetalle(item) {
        const mensajeDetalle = `
            <strong>Nombre:</strong> ${item.nombre_completo}<br>
            <strong>Correo:</strong> ${item.email}<br>
            <strong>Teléfono:</strong> ${item.telefono}<br>
            <strong>Redes/Portafolio:</strong> ${item.redes_sociales || 'N/A'}<br><br>
            <strong>Taller Propuesto:</strong> ${item.titulo_taller}<br>
            <strong>Disciplina:</strong> ${item.area_cultural}<br>
            <strong>Nivel:</strong> ${item.nivel_taller}<br>
            <strong>Años de Exp.:</strong> ${item.anios_experiencia}<br>
            <strong>Objetivos:</strong> ${item.descripcion_taller}<br>
            <strong>Requerimientos:</strong> ${item.requerimientos || 'Sin requerimientos especiales'}<br><br>
            <strong>Apoyo Staff Eventos:</strong> ${item.disponibilidad_apoyo ? 'Sí' : 'No'}<br>
            <strong>Áreas de Apoyo:</strong> ${item.areas_apoyo?.length ? item.areas_apoyo.join(', ') : 'Ninguna'}<br><br>
            <a href="${item.cv_url}" target="_blank" rel="noopener noreferrer" style="color: #2563eb; font-weight: bold; text-decoration: underline;">📄 Abrir Curriculum Vitae (PDF) en pestaña nueva</a>
        `;

        if (window.Modal) {
            await Modal.alert(mensajeDetalle, `Postulación de ${item.nombre_completo}`);
        } else {
            alert(`Detalle de ${item.nombre_completo}\n\nTaller: ${item.titulo_taller}\nEmail: ${item.email}`);
        }

        // Marcar como visto automáticamente al revisar el detalle
        if (!item.visto) {
            await client
                .from('postulaciones_talleristas')
                .update({ visto: true })
                .eq('id', item.id);

            cargarPostulaciones(); // Recargar tabla para actualizar badges
        }
    }

    cargarPostulaciones();
});