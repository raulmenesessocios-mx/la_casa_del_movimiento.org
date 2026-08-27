document.addEventListener('DOMContentLoaded', () => {
    loadTalleristasDropdown();

    const formTaller = document.getElementById('crearTallerForm');
    if (formTaller) {
        formTaller.addEventListener('submit', createTaller);
    }
});

async function loadTalleristasDropdown() {
    try {
        const { data, error } = await window.dbClient
            .from('autores')
            .select('id, nombre, email')
            .eq('rol', 'tallerista')
            .order('nombre');

        if (error) throw error;

        const select = document.getElementById('tallerInstructor');
        if (!select) return;

        select.innerHTML = '<option value="">Selecciona un tallerista</option>';

        if (data) {
            data.forEach(tallerista => {
                const option = document.createElement('option');
                option.value = tallerista.id;
                option.dataset.email = tallerista.email;
                option.textContent = `${tallerista.nombre} (${tallerista.email})`;
                select.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Error al cargar talleristas:', error.message);
    }
}

async function createTaller(e) {
    e.preventDefault();

    const submitBtn = document.getElementById('btnSubmitTaller');
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Procesando inserción e imagen...';
    }

    const instructorId = document.getElementById('tallerInstructor').value;
    const titulo = document.getElementById('tallerTitulo').value.trim();
    const fraseGancho = document.getElementById('tallerFraseGancho').value.trim();
    const descripcion = document.getElementById('tallerDescripcion').value.trim();
    const paraQuien = document.getElementById('tallerParaQuien').value.trim();
    const nivelEdad = document.getElementById('tallerNivelEdad').value;
    const dias = document.getElementById('tallerDias').value.trim();
    const horas = document.getElementById('tallerHoras').value.trim();
    const proximaSesion = document.getElementById('tallerProximaSesion').value;
    const cupo = parseInt(document.getElementById('tallerCupo').value);
    const eje = document.getElementById('tallerEje').value ? parseInt(document.getElementById('tallerEje').value) : null;
    const imagenInput = document.getElementById('tallerImagen');

    let imagenGanchoId = null;

    try {
        // 1. Subida de imagen a Supabase Storage (Bucket 'IMAGENES') si se seleccionó archivo
        if (imagenInput && imagenInput.files.length > 0) {
            const file = imagenInput.files[0];
            const fileExt = file.name.split('.').pop();
            const fileName = `taller-${Date.now()}.${fileExt}`;
            const filePath = `talleres/${fileName}`;

            const { error: uploadError } = await window.dbClient.storage
                .from('IMAGENES')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            // Obtener URL pública de la imagen
            const { data: urlData } = window.dbClient.storage
                .from('IMAGENES')
                .getPublicUrl(filePath);

            // Insertar registro en la tabla 'imagenes'
            const { data: imgRecord, error: imgError } = await window.dbClient
                .from('imagenes')
                .insert({
                    url: urlData.publicUrl,
                    alt_texto: titulo
                })
                .select('id')
                .single();

            if (imgError) throw imgError;
            imagenGanchoId = imgRecord.id;
        }

        // 2. Guardar el taller en la base de datos vinculando la imagen_gancho_id
        const horariosJSON = {
            dias: dias,
            horario: horas
        };

        const { error: tallerError } = await window.dbClient
            .from('talleres')
            .insert({
                titulo,
                frase_gancho: fraseGancho,
                descripcion,
                imagen_gancho_id: imagenGanchoId,
                instructor_id: instructorId,
                para_quien: paraQuien,
                nivel_edad: nivelEdad,
                horarios: horariosJSON,
                proxima_sesion: new Date(proximaSesion).toISOString(),
                cupo,
                eje_relacionado: eje
            });

        if (tallerError) throw tallerError;

        alert(`✅ Taller "${titulo}" creado con éxito.`);
        document.getElementById('crearTallerForm').reset();
        
        if (typeof loadDashboardStats === 'function') loadDashboardStats();
        if (typeof loadAllTalleres === 'function') loadAllTalleres();
        if (typeof loadTallersForSelect === 'function') loadTallersForSelect();

    } catch (error) {
        console.error('Error al crear taller:', error);
        alert('❌ Fallo al registrar el taller: ' + error.message);
    } finally {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Crear Taller y Notificar Tallerista';
        }
    }
}