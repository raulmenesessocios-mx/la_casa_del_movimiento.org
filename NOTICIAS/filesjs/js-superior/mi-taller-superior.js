window.misTalleresSuperior = window.misTalleresSuperior || [];
window.miTallerActualSuperior = window.miTallerActualSuperior || null;

async function loadMyTallerSuperior(userId, tallerIdASeleccionar = null) {
    const contenedor = document.getElementById('tallerInfoContainerSuperior');
    const form = document.getElementById('editarTallerFormSuperior');

    try {
        const client = window.supabaseClient || window.dbClient;
        if (!client) throw new Error("Cliente de Supabase no disponible.");

        const { data: talleres, error } = await client
            .from('talleres')
            .select(`
                *,
                imagenes:imagen_gancho_id(url, alt_texto)
            `)
            .eq('instructor_id', userId);

        if (error) throw error;

        if (!talleres || talleres.length === 0) {
            if (contenedor) contenedor.innerHTML = '<p>No tienes talleres asignados por el momento.</p>';
            if (form) form.style.display = 'none';
            window.misTalleresSuperior = [];
            window.miTallerActualSuperior = null;
            return;
        }

        window.misTalleresSuperior = talleres;
        const selectorContainer = document.getElementById('tallerSelectorWrapperSuperior');

        if (window.misTalleresSuperior.length > 1) {
            const optionsHTML = window.misTalleresSuperior.map((t, index) => {
                const titulo = t.titulo || `Taller #${index + 1}`;
                return `<option value="${t.id}">${titulo}</option>`;
            }).join('');

            if (selectorContainer) {
                selectorContainer.innerHTML = `
                    <div class="form-group" style="margin-bottom: 1.5rem;">
                        <label for="selectTallerInstructorSuperior" style="font-weight: bold; display: block; margin-bottom: 0.5rem;">
                            📑 Selecciona el taller que deseas gestionar:
                        </label>
                        <select id="selectTallerInstructorSuperior" class="form-control" style="width: 100%; padding: 0.6rem; font-size: 1rem; border-radius: 8px;">
                            ${optionsHTML}
                        </select>
                    </div>
                `;

                const selectElem = document.getElementById('selectTallerInstructorSuperior');
                selectElem.addEventListener('change', (e) => {
                    const tallerEncontrado = window.misTalleresSuperior.find(t => t.id == e.target.value);
                    if (tallerEncontrado) cargarFormularioTallerSuperior(tallerEncontrado);
                });

                if (tallerIdASeleccionar) selectElem.value = tallerIdASeleccionar;
            }
        } else {
            if (selectorContainer) selectorContainer.innerHTML = '';
            if (contenedor) contenedor.innerHTML = '';
        }

        let tallerInicial = window.misTalleresSuperior[0];
        if (tallerIdASeleccionar) {
            const buscado = window.misTalleresSuperior.find(t => t.id == tallerIdASeleccionar);
            if (buscado) tallerInicial = buscado;
        }

        cargarFormularioTallerSuperior(tallerInicial);
        if (form) form.style.display = 'block';

    } catch (error) {
        console.error('Error cargando talleres del Superior:', error);
        if (contenedor) contenedor.innerHTML = '<p>❌ Error al cargar la información de tus talleres.</p>';
        if (form) form.style.display = 'none';
    }
}

function cargarFormularioTallerSuperior(taller) {
    window.miTallerActualSuperior = taller;

    const setInputValue = (id, val) => {
        const elem = document.getElementById(id);
        if (elem) elem.value = val;
    };

    setInputValue('miTallerIdSuperior', taller.id);
    setInputValue('tallerNombreSuperior', taller.titulo || '');
    setInputValue('tallerFraseGanchoSuperior', taller.frase_gancho || '');
    setInputValue('tallerDescripcionSuperior', taller.descripcion || '');
    setInputValue('tallerParaQuienSuperior', taller.para_quien || '');
    setInputValue('tallerNivelEdadSuperior', taller.nivel_edad || '');
    setInputValue('tallerDiasSuperior', taller.horarios?.dias || '');
    setInputValue('tallerHorasSuperior', taller.horarios?.horario || '');
    setInputValue('tallerCupoSuperior', taller.cupo || 0);

    const fileInput = document.getElementById('tallerImagenFileSuperior');
    if (fileInput) fileInput.value = '';

    const preview = document.getElementById('tallerImagenPreviewSuperior');
    if (preview) {
        preview.src = taller.imagenes?.url || 'https://placehold.co/600x400?text=Sin+Imagen';
    }

    const inputFecha = document.getElementById('tallerProximaSesionSuperior');
    if (inputFecha) {
        if (taller.proxima_sesion) {
            const fecha = new Date(taller.proxima_sesion);
            const local = new Date(fecha.getTime() - fecha.getTimezoneOffset() * 60000);
            inputFecha.value = local.toISOString().slice(0, 16);
        } else {
            inputFecha.value = '';
        }
    }
}

function previewTallerImagenSuperior(event) {
    const file = event.target.files[0];
    if (!file) return;

    if (file.type !== 'image/webp') {
        alert('⚠️ Solo se permiten imágenes en formato .webp');
        event.target.value = '';
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        const preview = document.getElementById('tallerImagenPreviewSuperior');
        if (preview) preview.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

async function updateTallerSuperior(e) {
    if (e) e.preventDefault();

    const btn = document.getElementById('btnGuardarTallerSuperior');
    if (btn) {
        btn.disabled = true;
        btn.textContent = 'Guardando...';
    }

    const client = window.supabaseClient || window.dbClient;
    const tallerIdElem = document.getElementById('miTallerIdSuperior');
    const tallerId = tallerIdElem ? tallerIdElem.value : window.miTallerActualSuperior?.id;
    const fileInput = document.getElementById('tallerImagenFileSuperior');
    const file = fileInput ? fileInput.files[0] : null;

    try {
        let imagenGanchoId = window.miTallerActualSuperior?.imagen_gancho_id || null;

        if (file) {
            if (file.type !== 'image/webp') {
                alert('⚠️ El archivo debe estar en formato .webp');
                return;
            }

            const fileName = `taller-${tallerId}-${Date.now()}.webp`;
            const filePath = `talleres/${fileName}`;

            const { error: uploadError } = await client.storage
                .from('IMAGENES')
                .upload(filePath, file, { upsert: true, contentType: 'image/webp' });

            if (uploadError) throw uploadError;

            const { data: urlData } = client.storage
                .from('IMAGENES')
                .getPublicUrl(filePath);

            const titulo = document.getElementById('tallerNombreSuperior')?.value || '';

            const { data: imgRecord, error: imgError } = await client
                .from('imagenes')
                .insert({ url: urlData.publicUrl, alt_texto: titulo })
                .select('id')
                .single();

            if (imgError) throw imgError;
            imagenGanchoId = imgRecord.id;
        }

        const getVal = (id) => {
            const elem = document.getElementById(id);
            return elem ? elem.value.trim() : '';
        };

        const updatePayload = {
            titulo: getVal('tallerNombreSuperior'),
            frase_gancho: getVal('tallerFraseGanchoSuperior'),
            descripcion: getVal('tallerDescripcionSuperior'),
            para_quien: getVal('tallerParaQuienSuperior'),
            nivel_edad: document.getElementById('tallerNivelEdadSuperior')?.value || '',
            horarios: {
                dias: getVal('tallerDiasSuperior'),
                horario: getVal('tallerHorasSuperior')
            },
            proxima_sesion: document.getElementById('tallerProximaSesionSuperior')?.value ? new Date(document.getElementById('tallerProximaSesionSuperior').value).toISOString() : null,
            cupo: parseInt(document.getElementById('tallerCupoSuperior')?.value || '0', 10),
            imagen_gancho_id: imagenGanchoId,
            actualizado_en: new Date().toISOString()
        };

        const { error } = await client
            .from('talleres')
            .update(updatePayload)
            .eq('id', tallerId);

        if (error) throw error;

        alert('✅ Taller actualizado correctamente');
        
        const { data: { user } } = await client.auth.getUser();
        if (user) await loadMyTallerSuperior(user.id, tallerId);

    } catch (error) {
        console.error('Error al actualizar taller (Superior):', error);
        alert('❌ Error al actualizar el taller: ' + error.message);
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.textContent = 'Guardar Cambios del Taller';
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('editarTallerFormSuperior');
    if (form && !form.dataset.listenerAttached) {
        form.addEventListener('submit', updateTallerSuperior);
        form.dataset.listenerAttached = 'true';
    }
});