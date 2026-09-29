document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('bolsa-trabajo-form');
    if (!form) return;

    // Desactivar el submit HTML tradicional por defecto
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        // 1. Validar disponibilidad del cliente de Supabase instanciado por supabase-config.js
        const client = window.supabaseClient || window.initSupabase?.();
        if (!client) {
            if (window.Modal) {
                await Modal.alert('Error de conexión con la base de datos. Intenta nuevamente.', 'Error de Red');
            } else {
                alert('Error de conexión con la base de datos. Intenta nuevamente.');
            }
            return;
        }

        const btnSubmit = form.querySelector('button[type="submit"]');
        const originalBtnText = btnSubmit.textContent;

        try {
            // Deshabilitar botón para evitar envíos dobles
            btnSubmit.disabled = true;
            btnSubmit.textContent = 'Enviando postulación...';

            // 2. Extraer archivo PDF
            const fileInput = document.getElementById('cv_pdf');
            const file = fileInput?.files?.[0];

            if (!file) {
                throw new Error('Por favor adjunta tu Currículum Vitae en formato PDF.');
            }

            if (file.type !== 'application/pdf') {
                throw new Error('El archivo seleccionado debe ser un documento PDF válido.');
            }

            if (file.size > 10 * 1024 * 1024) { // 10MB
                throw new Error('El archivo PDF sobrepasa el límite permitido de 10MB.');
            }

            // 3. Subir el archivo PDF a Supabase Storage
            const fileExt = 'pdf';
            const cleanFileName = file.name.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
            const filePath = `cv_${Date.now()}_${cleanFileName}.${fileExt}`;

            const { data: storageData, error: storageError } = await client
                .storage
                .from('cvs_postulaciones')
                .upload(filePath, file, {
                    cacheControl: '3600',
                    upsert: false
                });

            if (storageError) {
                console.error('❌ Error al subir CV a Storage:', storageError);
                throw new Error('No se pudo subir el archivo PDF. Verifica tu conexión.');
            }

            // Obtener la URL pública del archivo subido
            const { data: publicUrlData } = client
                .storage
                .from('cvs_postulaciones')
                .getPublicUrl(filePath);

            const cvUrl = publicUrlData.publicUrl;

            // 4. Capturar datos de áreas de apoyo seleccionadas (Checkboxes)
            const checkboxes = form.querySelectorAll('input[name="areas_apoyo[]"]:checked');
            const areasApoyo = Array.from(checkboxes).map(cb => cb.value);

            // 5. Estructurar payload para la base de datos
            const payload = {
                nombre_completo: document.getElementById('nombre_completo').value.trim(),
                email: document.getElementById('email').value.trim(),
                telefono: document.getElementById('telefono').value.trim(),
                redes_sociales: document.getElementById('redes_sociales').value.trim() || null,
                titulo_taller: document.getElementById('titulo_taller').value.trim(),
                area_cultural: document.getElementById('area_cultural').value,
                nivel_taller: document.getElementById('nivel_taller').value,
                anios_experiencia: parseInt(document.getElementById('anios_experiencia').value, 10) || 0,
                descripcion_taller: document.getElementById('descripcion_taller').value.trim(),
                requerimientos: document.getElementById('requerimientos').value.trim() || null,
                disponibilidad_apoyo: document.querySelector('input[name="disponibilidad_apoyo"]:checked')?.value === 'si',
                areas_apoyo: areasApoyo,
                cv_url: cvUrl
            };

            // 6. Insertar registro en la tabla postulaciones_talleristas
            const { error: dbError } = await client
                .from('postulaciones_talleristas')
                .insert([payload]);

            if (dbError) {
                console.error('❌ Error al registrar postulación en DB:', dbError);
                throw new Error('Hubo un error al guardar la postulación en la base de datos.');
            }

            // 7. Notificación de éxito y reset del formulario
            if (window.Modal) {
                await Modal.alert('¡Tu postulación ha sido enviada con éxito! Revisaremos tu propuesta.', 'Postulación Recibida');
            } else {
                alert('¡Tu postulación ha sido enviada con éxito!');
            }

            form.reset();

        } catch (error) {
            console.error('⚠️ Error en proceso de postulación:', error);
            if (window.Modal) {
                await Modal.alert(error.message || 'Ocurrió un error inesperado. Intenta de nuevo.', 'Error');
            } else {
                alert(error.message || 'Ocurrió un error inesperado.');
            }
        } finally {
            btnSubmit.disabled = false;
            btnSubmit.textContent = originalBtnText;
        }
    });
});