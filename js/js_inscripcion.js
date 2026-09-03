document.addEventListener('DOMContentLoaded', async () => {
    const params = new URLSearchParams(window.location.search);
    const tallerIdParam = params.get('taller_id');

    const tallerSelect = document.getElementById('tallerSelect');
    const form = document.getElementById('formInscripcion');
    const btnSubmit = document.getElementById('btnSubmit');

    let listaTalleres = [];

    try {
        // 1. Obtener talleres de Supabase con información de instructores
        const { data, error } = await window.supabaseClient
            .from('talleres')
            .select(`
                id, 
                titulo, 
                horarios, 
                proxima_sesion,
                autores!instructor_id(nombre)
            `);

        if (error) throw error;
        listaTalleres = data || [];

        // 2. Poblar el menú desplegable
        tallerSelect.innerHTML = '<option value="">-- Seleccionar Taller --</option>' +
            listaTalleres.map(t => `<option value="${t.id}">${t.titulo}</option>`).join('');

        // 3. Preseleccionar si viene desde un modal o mantener "Seleccionar taller" si vino del botón general
        if (tallerIdParam && listaTalleres.some(t => t.id === tallerIdParam)) {
            tallerSelect.value = tallerIdParam;
            actualizarResumen(tallerIdParam);
        } else {
            actualizarResumen(null);
        }

    } catch (err) {
        console.error('Error al cargar talleres:', err);
    }

    // Actualizar caja de resumen al cambiar el selector manualmente
    tallerSelect.addEventListener('change', (e) => {
        actualizarResumen(e.target.value);
    });

    // 4. Guardar registro en Supabase
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const tallerIdSelected = tallerSelect.value;
            if (!tallerIdSelected) {
                alert('⚠️ Por favor selecciona un taller.');
                return;
            }

            const nombre = document.getElementById('nombre').value.trim();
            const email = document.getElementById('email').value.trim();
            const telefono = document.getElementById('telefono').value.trim();
            const experiencia = document.getElementById('experiencia').value.trim();
            const comentarios = document.getElementById('comentarios').value.trim();

            let mensajeCombinado = '';
            if (experiencia) mensajeCombinado += `Experiencia: ${experiencia}\n`;
            if (comentarios) mensajeCombinado += `Comentarios: ${comentarios}`;

            btnSubmit.disabled = true;
            btnSubmit.textContent = 'Procesando...';

            try {
                const { error: insertError } = await window.supabaseClient
                    .from('interesados_talleres')
                    .insert({
                        taller_id: tallerIdSelected,
                        nombre: nombre,
                        email: email,
                        telefono: telefono,
                        mensaje: mensajeCombinado.trim() || null
                    });

                if (insertError) throw insertError;

                alert('🎉 ¡Inscripción registrada con éxito! Tu lugar ha sido reservado.');
                form.reset();
                actualizarResumen(null);

            } catch (err) {
                console.error('Error al registrar inscripción:', err);
                alert('❌ Ocurrió un error al procesar tu inscripción: ' + err.message);
            } finally {
                btnSubmit.disabled = false;
                btnSubmit.textContent = 'Confirmar Inscripción';
            }
        });
    }

    function actualizarResumen(id) {
        const elemTitulo = document.getElementById('summary-titulo');
        const elemHorario = document.getElementById('summary-horario');
        const elemDocente = document.getElementById('summary-docente');
        const elemInicio = document.getElementById('summary-inicio');

        if (!id) {
            if (elemTitulo) elemTitulo.textContent = 'Seleccionar taller';
            if (elemHorario) elemHorario.textContent = '-';
            if (elemDocente) elemDocente.textContent = '-';
            if (elemInicio) elemInicio.textContent = '-';
            return;
        }

        const taller = listaTalleres.find(t => t.id === id);
        if (!taller) return;

        let horarioStr = 'Por confirmar';
        if (taller.horarios) {
            horarioStr = `${taller.horarios.dias || ''} ${taller.horarios.horario || ''}`.trim();
        }

        let fechaInicioStr = 'Por confirmar';
        if (taller.proxima_sesion) {
            fechaInicioStr = new Date(taller.proxima_sesion).toLocaleDateString();
        }

        if (elemTitulo) elemTitulo.textContent = taller.titulo;
        if (elemHorario) elemHorario.textContent = horarioStr;
        if (elemDocente) elemDocente.textContent = taller.autores?.nombre || 'Por asignar';
        if (elemInicio) elemInicio.textContent = fechaInicioStr;
    }
});