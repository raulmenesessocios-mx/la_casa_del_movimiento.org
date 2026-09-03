window.misTalleres = window.misTalleres || [];
window.miTallerActual = window.miTallerActual || null;

async function loadMyTaller(userId, tallerIdASeleccionar = null) {
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
            misTalleres = [];
            miTallerActual = null;
            return;
        }

        misTalleres = talleres;

        // Si el instructor tiene más de 1 taller, creamos un selector dinámico
        if (misTalleres.length > 1) {
            let optionsHTML = misTalleres.map((t, index) => {
                const titulo = t.titulo || `Taller #${index + 1}`;
                return `<option value="${t.id}">${titulo}</option>`;
            }).join('');

            contenedor.innerHTML = `
                <div class="form-group" style="margin-bottom: 1.5rem;">
                    <label for="selectTallerInstructor" style="font-weight: bold; display: block; margin-bottom: 0.5rem;">
                        📑 Selecciona el taller que deseas gestionar:
                    </label>
                    <select id="selectTallerInstructor" class="form-control" style="width: 100%; padding: 0.6rem; font-size: 1rem; border-radius: 8px;">
                        ${optionsHTML}
                    </select>
                </div>
            `;

            // Escuchar el cambio de opción en el selector
            const selectElem = document.getElementById('selectTallerInstructor');
            selectElem.addEventListener('change', (e) => {
                const idSeleccionado = e.target.value;
                const tallerEncontrado = misTalleres.find(t => t.id == idSeleccionado);
                if (tallerEncontrado) {
                    cargarFormularioTaller(tallerEncontrado);
                }
            });

            // Si especificamos un ID a seleccionar (p. ej. tras guardar cambios)
            if (tallerIdASeleccionar) {
                selectElem.value = tallerIdASeleccionar;
            }
        } else {
            // Si solo tiene 1 taller, limpiamos el contenedor de info/selector
            contenedor.innerHTML = '';
        }

        // Determinar qué taller cargar en el formulario
        let tallerInicial = misTalleres[0];
        if (tallerIdASeleccionar) {
            const buscado = misTalleres.find(t => t.id == tallerIdASeleccionar);
            if (buscado) tallerInicial = buscado;
        }

        cargarFormularioTaller(tallerInicial);
        form.style.display = 'block';

    } catch (error) {
        console.error('Error cargando talleres:', error);
        contenedor.innerHTML = '<p>❌ Error al cargar la información de tus talleres.</p>';
        form.style.display = 'none';
    }
}

// Función auxiliar para rellenar los inputs del formulario
function cargarFormularioTaller(taller) {
    miTallerActual = taller;

    document.getElementById('miTallerId').value = taller.id;
    document.getElementById('miTallerTitulo').value = taller.titulo || '';
    document.getElementById('miTallerFraseGancho').value = taller.frase_gancho || '';
    document.getElementById('miTallerDescripcion').value = taller.descripcion || '';
    document.getElementById('miTallerParaQuien').value = taller.para_quien || '';
    document.getElementById('miTallerNivelEdad').value = taller.nivel_edad || '';
    document.getElementById('miTallerDias').value = taller.horarios?.dias || '';
    document.getElementById('miTallerHoras').value = taller.horarios?.horario || '';
    document.getElementById('miTallerCupo').value = taller.cupo || 0;

    // Resetear el selector de archivos por si se había elegido alguna imagen previa
    const fileInput = document.getElementById('miTallerImagenFile');
    if (fileInput) fileInput.value = '';

    // Vista previa de la imagen
    const preview = document.getElementById('miTallerImagenPreview');
    if (preview) {
        preview.src = taller.imagenes?.url || 'https://placehold.co/600x400?text=Sin+Imagen';
    }

    // Formatear la fecha para <input type="datetime-local">
    if (taller.proxima_sesion) {
        const fecha = new Date(taller.proxima_sesion);
        const local = new Date(fecha.getTime() - fecha.getTimezoneOffset() * 60000);
        document.getElementById('miTallerProximaSesion').value = local.toISOString().slice(0, 16);
    } else {
        document.getElementById('miTallerProximaSesion').value = '';
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
        
        // Recargar los talleres manteniendo seleccionado el taller actual que se acaba de actualizar
        const session = window.getSessionFromLocalStorage();
        if (session) {
            await loadMyTaller(session.userId, tallerId);
        }

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