document.addEventListener('DOMContentLoaded', () => {
    loadTallersForSelect();
    loadEventosAdminList();

    const form = document.getElementById('crearEventoForm');
    if (form) {
        form.addEventListener('submit', createEvento);
    }
});

// Previsualización de la imagen asignada
function previewEventoImagen(event) {
    const file = event.target.files[0];
    if (file) {
        if (file.type !== 'image/webp') {
            Modal.alert('Solo se permiten imágenes en formato .webp');
            event.target.value = '';
            return;
        }
        const reader = new FileReader();
        reader.onload = function(e) {
            document.getElementById('eventoImagenPreview').src = e.target.result;
        };
        reader.readAsDataURL(file);
    }
}

// Cargar lista de talleres para relacionar opcionalmente
async function loadTallersForSelect() {
    try {
        const { data, error } = await window.dbClient
            .from('talleres')
            .select('id, titulo');

        if (error) throw error;

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

    const btnSubmit = document.getElementById('btnSubmitEvento');
    if (btnSubmit) {
        btnSubmit.disabled = true;
        btnSubmit.textContent = 'Guardando...';
    }

    const titulo = document.getElementById('eventoTitulo').value.trim();
    const descripcion = document.getElementById('eventoDescripcion').value.trim();
    const fechaInput = document.getElementById('eventoFecha').value;
    const duracion = parseInt(document.getElementById('eventoDuracion').value) || 120;
    const ubicacion = document.getElementById('eventoUbicacion').value.trim() || 'Juárez 86, Tizayuca';
    const tallerRelacionado = document.getElementById('eventoTaller').value || null;
    const imagenFile = document.getElementById('eventoImagen').files[0];

    try {
        let imagenId = null;

        // 1. Subir imagen a Supabase Storage y registrar en `imagenes` si existe
        if (imagenFile) {
            const fileName = `evento_${Date.now()}.webp`;
            const filePath = `eventos/${fileName}`;

            const { error: uploadError } = await window.dbClient.storage
                .from('IMAGENES')
                .upload(filePath, imagenFile, { contentType: 'image/webp' });

            if (uploadError) throw uploadError;

            const { data: publicUrlData } = window.dbClient.storage
                .from('IMAGENES')
                .getPublicUrl(filePath);

            const { data: imgData, error: imgErr } = await window.dbClient
                .from('imagenes')
                .insert({
                    url: publicUrlData.publicUrl,
                    alt_texto: `Imagen para evento ${titulo}`
                })
                .select('id')
                .single();

            if (imgErr) throw imgErr;
            imagenId = imgData.id;
        }

        const fecha = new Date(fechaInput);

        // Generar hora en formato estricto HH:MM (Exactamente 5 caracteres para VARCHAR(5))
        const horas = String(fecha.getHours()).padStart(2, '0');
        const minutos = String(fecha.getMinutes()).padStart(2, '0');
        const horaInicioStr = `${horas}:${minutos}`;

        // 2. Insertar evento en la base de datos
        const { error } = await window.dbClient
            .from('eventos')
            .insert({
                titulo,
                descripcion,
                fecha_evento: fecha.toISOString(),
                hora_inicio: horaInicioStr, // Formato "16:00" (5 caracteres exactos)
                duracion_minutos: duracion,
                ubicacion,
                imagen_id: imagenId,
                taller_relacionado_id: tallerRelacionado,
                estado: 'proximo'
            });

        if (error) throw error;

        await Modal.alert('✅ Evento creado exitosamente');
        document.getElementById('crearEventoForm').reset();
        
        const previewImg = document.getElementById('eventoImagenPreview');
        if (previewImg) previewImg.src = 'https://placehold.co/600x400?text=Sin+Imagen';

        if (typeof loadEventosAdminList === 'function') loadEventosAdminList();
        if (typeof loadDashboardStats === 'function') loadDashboardStats();

    } catch (error) {
        console.error('Error al crear evento:', error);
        await Modal.alert('Error al crear evento: ' + error.message);
    } finally {
        if (btnSubmit) {
            btnSubmit.disabled = false;
            btnSubmit.textContent = 'Crear Evento';
        }
    }
}

// Cargar la lista de eventos en el panel administrativo
async function loadEventosAdminList() {
    const container = document.getElementById('eventosAdminList');
    if (!container) return;

    try {
        const { data: eventos, error } = await window.dbClient
            .from('eventos')
            .select(`
                id,
                titulo,
                fecha_evento,
                hora_inicio,
                ubicacion,
                estado,
                imagenes ( url )
            `)
            .order('fecha_evento', { ascending: false });

        if (error) throw error;

        if (!eventos || eventos.length === 0) {
            container.innerHTML = '<p class="cell-empty-state">No hay eventos registrados aún.</p>';
            return;
        }

        let html = `
            <div class="admin-table-scroll-container">
                <table class="admin-table admin-table-min-width">
                    <thead>
                        <tr>
                            <th>Fecha / Hora</th>
                            <th>Evento</th>
                            <th>Ubicación</th>
                            <th>Estado</th>
                            <th class="text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        eventos.forEach(ev => {
            const fechaFmt = new Date(ev.fecha_evento).toLocaleDateString('es-MX', {
                day: '2-digit', month: 'short', year: 'numeric'
            });

            let badgeClass = 'badge-revision';
            if (ev.estado === 'proximo') badgeClass = 'badge-publicado';
            if (ev.estado === 'realizado') badgeClass = 'badge-status';
            if (ev.estado === 'cancelado') badgeClass = 'badge-rechazado';
            const tituloSeguro = (ev.titulo || '').replace(/'/g, "\\'");
            html += `
                <tr>
                    <td class="cell-nowrap">
                        <strong>${fechaFmt}</strong><br>
                        <small>${ev.hora_inicio || ''}</small>
                    </td>
                    <td class="cell-title">
                        <strong>${ev.titulo}</strong>
                    </td>
                    <td>${ev.ubicacion || 'Juárez 86, Tizayuca'}</td>
                    <td>
                        <span class="badge-status ${badgeClass}">${ev.estado.toUpperCase()}</span>
                    </td>
                    <td class="text-right">
                        <div class="actions-cell-right">
                            <select onchange="cambiarEstadoEvento('${ev.id}', this.value)" class="btn-tabla">
                                <option value="proximo" ${ev.estado === 'proximo' ? 'selected' : ''}>Próximo</option>
                                <option value="realizado" ${ev.estado === 'realizado' ? 'selected' : ''}>Realizado</option>
                                <option value="cancelado" ${ev.estado === 'cancelado' ? 'selected' : ''}>Cancelado</option>
                            </select>
                            <button onclick="eliminarEvento('${ev.id}' ,'${tituloSeguro}')" class="btn-tabla btn-eliminar">Eliminar</button>
                        </div>
                    </td>
                </tr>
            `;
        });

        html += '</tbody></table></div>';
        container.innerHTML = html;

    } catch (error) {
        console.error('Error al cargar lista de eventos:', error);
        container.innerHTML = '<p>Error al cargar eventos.</p>';
    }
}

// Cambiar estado de un evento (Próximo, Realizado, Cancelado)
async function cambiarEstadoEvento(id, nuevoEstado) {
    try {
        const { error } = await window.dbClient
            .from('eventos')
            .update({ estado: nuevoEstado, actualizado_en: new Date().toISOString() })
            .eq('id', id);

        if (error) throw error;
        loadEventosAdminList();
    } catch (err) {
        await Modal.alert('Error al actualizar estado: ' + err.message+'Error');
    }
}


// Eliminar un evento
async function eliminarEvento(id, titulo) {
    if (!await Modal.confirm(`¿Estás seguro de que quieres eliminar la noticia "${titulo}"?`)) return;

    try {
        const { error } = await window.dbClient
            .from('eventos')
            .delete()
            .eq('id', id);

        if (error) throw error;

        await Modal.alert('Evento eliminado correctamente');
        loadEventosAdminList();
        if (typeof loadDashboardStats === 'function') loadDashboardStats();
    } catch (err) {
        await Modal.alert('Error al eliminar evento: ' + err.message);
    }
}

function escapeHtmlAdmin(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}