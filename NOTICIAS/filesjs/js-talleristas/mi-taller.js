let miTallerActual = null;

async function loadMyTaller(userId) {
    const contenedor = document.getElementById('tallerInfo');
    const form = document.getElementById('editarTallerForm');

    try {
        const { data: talleres, error } = await window.supabaseClient
            .from('talleres')
            .select(`
                *,
                imagenes:imagen_gancho_id(url, alt_texto)
            `)
            .eq('instructor_id', userId);

        if (error) throw error;

        if (!talleres || talleres.length === 0) {
            contenedor.innerHTML = '<p>No tienes talleres asignados por el momento.</p>';
            form.style.display = 'none';
            return;
        }

        // Tomamos el primer taller asignado a este instructor
        miTallerActual = talleres[0];
        contenedor.innerHTML = '';
        form.style.display = 'block';

        // Rellenar el formulario con los datos actuales
        document.getElementById('miTallerId').value = miTallerActual.id;
        document.getElementById('miTallerTitulo').value = miTallerActual.titulo || '';
        document.getElementById('miTallerFraseGancho').value = miTallerActual.frase_gancho || '';
        document.getElementById('miTallerDescripcion').value = miTallerActual.descripcion || '';
        document.getElementById('miTallerParaQuien').value = miTallerActual.para_quien || '';
        document.getElementById('miTallerNivelEdad').value = miTallerActual.nivel_edad || '';
        document.getElementById('miTallerDias').value = miTallerActual.horarios?.dias || '';
        document.getElementById('miTallerHoras').value = miTallerActual.horarios?.horario || '';
        document.getElementById('miTallerCupo').value = miTallerActual.cupo || 0;

        const preview = document.getElementById('miTallerImagenPreview');
        if (preview) {
            preview.src = miTallerActual.imagenes?.url || 'https://placehold.co/300x180?text=Sin+Imagen';
        }

        if (miTallerActual.proxima_sesion) {
            const fecha = new Date(miTallerActual.proxima_sesion);
            const local = new Date(fecha.getTime() - fecha.getTimezoneOffset() * 60000);
            document.getElementById('miTallerProximaSesion').value = local.toISOString().slice(0, 16);
        }

    } catch (error) {
        console.error('Error cargando taller:', error);
        contenedor.innerHTML = '<p>❌ Error al cargar la información de tu taller.</p>';
        form.style.display = 'none';
    }
}

function previewTallerImagen(event) {
    const file = event.target.files[0];
    if (!file) return;

    if (file.type !== 'image/webp') {
        alert('⚠️ Solo se permiten imágenes en formato .webp');
        event.target.value = '';
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        document.getElementById('miTallerImagenPreview').src = e.target.result;
    };
    reader.readAsDataURL(file);
}

async function updateMyTaller(e) {
    e.preventDefault();

    const btn = document.getElementById('btnGuardarTaller');
    btn.disabled = true;
    btn.textContent = 'Guardando...';

    const tallerId = document.getElementById('miTallerId').value;
    const fileInput = document.getElementById('miTallerImagenFile');
    const file = fileInput.files[0];

    try {
        let imagenGanchoId = miTallerActual?.imagen_gancho_id || null;

        if (file) {
            if (file.type !== 'image/webp') {
                alert('⚠️ El archivo debe estar en formato .webp');
                return;
            }

            const fileName = `taller-${tallerId}-${Date.now()}.webp`;
            const filePath = `talleres/${fileName}`;

            const { error: uploadError } = await window.supabaseClient.storage
                .from('IMAGENES')
                .upload(filePath, file, { upsert: true, contentType: 'image/webp' });

            if (uploadError) throw uploadError;

            const { data: urlData } = window.supabaseClient.storage
                .from('IMAGENES')
                .getPublicUrl(filePath);

            const titulo = document.getElementById('miTallerTitulo').value;

            const { data: imgRecord, error: imgError } = await window.supabaseClient
                .from('imagenes')
                .insert({ url: urlData.publicUrl, alt_texto: titulo })
                .select('id')
                .single();

            if (imgError) throw imgError;
            imagenGanchoId = imgRecord.id;
        }

        const horariosJSON = {
            dias: document.getElementById('miTallerDias').value.trim(),
            horario: document.getElementById('miTallerHoras').value.trim()
        };

        const { error } = await window.supabaseClient
            .from('talleres')
            .update({
                titulo: document.getElementById('miTallerTitulo').value.trim(),
                frase_gancho: document.getElementById('miTallerFraseGancho').value.trim(),
                descripcion: document.getElementById('miTallerDescripcion').value.trim(),
                para_quien: document.getElementById('miTallerParaQuien').value.trim(),
                nivel_edad: document.getElementById('miTallerNivelEdad').value,
                horarios: horariosJSON,
                proxima_sesion: new Date(document.getElementById('miTallerProximaSesion').value).toISOString(),
                cupo: parseInt(document.getElementById('miTallerCupo').value),
                imagen_gancho_id: imagenGanchoId
            })
            .eq('id', tallerId);

        if (error) throw error;

        alert('✅ Taller actualizado correctamente');
        const session = window.getSessionFromLocalStorage();
        if (session) loadMyTaller(session.userId);

    } catch (error) {
        console.error('Error al actualizar taller:', error);
        alert('❌ Error al actualizar el taller: ' + error.message);
    } finally {
        btn.disabled = false;
        btn.textContent = 'Guardar Cambios del Taller';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('editarTallerForm');
    if (form) {
        form.addEventListener('submit', updateMyTaller);
    }
});


