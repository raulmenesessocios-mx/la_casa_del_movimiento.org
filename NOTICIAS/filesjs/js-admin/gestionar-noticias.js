let filterEstadoActual = 'todas';

// 1. Escuchador único al cargar la página
document.addEventListener('DOMContentLoaded', () => {
    loadAllNoticiasAdmin();

    const formEdit = document.getElementById('editarNoticiaForm');
    if (formEdit) {
        formEdit.addEventListener('submit', guardarEdicionNoticia);
    }
});

// 2. Consulta a Supabase con todos los campos requeridos
async function loadAllNoticiasAdmin() {
    try {
        const container = document.getElementById('noticiasAdminList');
        if (!container) return;

        const { data, error } = await window.dbClient
            .from('noticias')
            .select(`
                id, 
                titulo, 
                resumen, 
                cuerpo, 
                publicado, 
                estado,
                destacada, 
                categoria_id,
                imagen_id,
                categorias(slug, nombre),
                autores(nombre)
            `)
            .order('fecha_publicacion', { ascending: false });

        if (error) throw error;
        
        window.noticiasAdminCache = data || [];
        renderTableAdmin();
    } catch (error) {
        console.error('Error al listar noticias admin:', error);
    }
}

// 3. Control del filtro de pestañas
function setFilterNoticias(estado) {
    filterEstadoActual = estado;
    renderTableAdmin();
}

// 4. Renderizado dinámico de la tabla según la pestaña activa
function renderTableAdmin() {
    const container = document.getElementById('noticiasAdminList');
    if (!container) return;

    let filtradas = window.noticiasAdminCache;
    if (filterEstadoActual === 'publicadas') {
        filtradas = filtradas.filter(n => n.estado === 'publicado');
    } else if (filterEstadoActual === 'revision') {
        filtradas = filtradas.filter(n => n.estado === 'en_revision');
    } else if (filterEstadoActual === 'rechazadas') {
        filtradas = filtradas.filter(n => n.estado === 'rechazado');
    }

    const html = `
        <div class="admin-tabs">
            <button class="admin-tab-btn ${filterEstadoActual === 'todas' ? 'active' : ''}" onclick="setFilterNoticias('todas')">Todas</button>
            <button class="admin-tab-btn ${filterEstadoActual === 'revision' ? 'active' : ''}" onclick="setFilterNoticias('revision')">En Revisión</button>
            <button class="admin-tab-btn ${filterEstadoActual === 'publicadas' ? 'active' : ''}" onclick="setFilterNoticias('publicadas')">Publicadas</button>
            <button class="admin-tab-btn ${filterEstadoActual === 'rechazadas' ? 'active' : ''}" onclick="setFilterNoticias('rechazadas')">Rechazadas</button>
        </div>
            <table class="admin-table ">
                <thead>
                    <tr>
                        <th>Título</th>
                        <th>Autor</th>
                        <th>Estado</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    ${filtradas.length === 0 ? '<tr><td colspan="4" style="text-align:center; padding: 2rem;">No hay noticias en esta sección.</td></tr>' : ''}
                    ${filtradas.map(n => {
                        const esPublicado = n.estado === 'publicado';
                        const esRechazado = n.estado === 'rechazado';

                        return `
                        <tr>
                            <td><strong>${n.titulo}</strong></td>
                            <td>${n.autores?.nombre || 'Desconocido'}</td>
                            <td>
                                ${getBadgeEstado(n.estado)}
                                ${n.destacada ? ' ⭐ destacada' : ''}
                            </td>
                            <td>
                                <div class="actions-cell">
                                    ${!esPublicado ? `<button class="btn-tabla btn-publicar" onclick="cambiarEstadoNoticia('${n.id}', 'publicado', true)">Publicar</button>` : ''}
                                    ${!esPublicado && !esRechazado ? `<button class="btn-tabla btn-regresar" onclick="cambiarEstadoNoticia('${n.id}', 'rechazado', false)">Regresar</button>` : ''}
                                    <button class="btn-tabla btn-editar" onclick="abrirEditarNoticia('${n.id}')">Editar</button>
                                    <button class="btn-tabla btn-eliminar" onclick="deleteNoticia('${n.id}')">🗑️</button>
                                </div>
                            </td>
                        </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
    `;

    container.innerHTML = html;
}

// 5. Formato de etiquetas de estado
function getBadgeEstado(estado) {
    if (estado === 'publicado') return '<span class="badge-status badge-publicado">Publicada</span>';
    if (estado === 'rechazado') return '<span class="badge-status badge-rechazado">Rechazada</span>';
    return '<span class="badge-status badge-revision">En Revisión</span>';
}

// 6. Cambiar estado rápido
async function cambiarEstadoNoticia(noticiaId, nuevoEstado, esPublicado) {
    try {
        const { error } = await window.dbClient
            .from('noticias')
            .update({ 
                estado: nuevoEstado, 
                publicado: esPublicado 
            })
            .eq('id', noticiaId);

        if (error) throw error;

        loadAllNoticiasAdmin();
    } catch (err) {
        console.error('Error cambiando estado:', err);
    }
}

function abrirEditarNoticia(noticiaId) {
    const noticia = window.noticiasAdminCache.find(n => n.id === noticiaId);
    if (!noticia) {
        console.error('No se encontró la noticia en caché:', noticiaId);
        return;
    }

    // Funciones auxiliares para asignar valores sin romper si falta un ID en el HTML
    const setVal = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.value = val ?? '';
        else console.warn(`⚠️ Faltante en HTML: input con id="${id}"`);
    };

    const setChecked = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.checked = Boolean(val);
        else console.warn(`⚠️ Faltante en HTML: checkbox con id="${id}"`);
    };

    // Asignación de datos
    setVal('editNoticiaId', noticia.id);
    setVal('editImagenIdActual', noticia.imagen_id);
    setVal('editNoticiaTitulo', noticia.titulo);
    setVal('editNoticiaResumen', noticia.resumen);
    setVal('editNoticiaCuerpo', noticia.cuerpo);
    setVal('editNoticiaCategoria', noticia.categorias?.slug || 'reflexiones');
    setChecked('editNoticiaPublicado', noticia.publicado);
    setChecked('editNoticiaDestacada', noticia.destacada);

    // Abrir modal
    const modal = document.getElementById('editNoticiaModal');
    if (modal) {
        modal.style.display = 'flex'; // Mantiene la alineación flex del overlay
    }
}

function cerrarModalEditar() {
    const modal = document.getElementById('editNoticiaModal');
    if (modal) {
        modal.style.display = 'none';
    }
    const form = document.getElementById('editarNoticiaForm');
    if (form) form.reset();
}

// 2. Consulta a Supabase (se agregó imagenes(url))
async function loadAllNoticiasAdmin() {
    try {
        const container = document.getElementById('noticiasAdminList');
        if (!container) return;

        const { data, error } = await window.dbClient
            .from('noticias')
            .select(`
                id, 
                titulo, 
                resumen, 
                cuerpo, 
                publicado, 
                estado,
                destacada, 
                categoria_id,
                imagen_id,
                categorias(slug, nombre),
                autores(nombre),
                imagenes(url)
            `)
            .order('fecha_publicacion', { ascending: false });

        if (error) throw error;
        
        window.noticiasAdminCache = data || [];
        renderTableAdmin();
    } catch (error) {
        console.error('Error al listar noticias admin:', error);
    }
}

// 7. Modal de edición con previsualización de imagen
function abrirEditarNoticia(noticiaId) {
    const noticia = window.noticiasAdminCache.find(n => n.id === noticiaId);
    if (!noticia) {
        console.error('No se encontró la noticia en caché:', noticiaId);
        return;
    }

    const setVal = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.value = val ?? '';
        else console.warn(`⚠️ Faltante en HTML: input con id="${id}"`);
    };

    const setChecked = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.checked = Boolean(val);
        else console.warn(`⚠️ Faltante en HTML: checkbox con id="${id}"`);
    };

    // Asignación de textos y campos
    setVal('editNoticiaId', noticia.id);
    setVal('editImagenIdActual', noticia.imagen_id);
    setVal('editNoticiaTitulo', noticia.titulo);
    setVal('editNoticiaResumen', noticia.resumen);
    setVal('editNoticiaCuerpo', noticia.cuerpo);
    setVal('editNoticiaCategoria', noticia.categorias?.slug || 'reflexiones');
    setChecked('editNoticiaPublicado', noticia.publicado);
    setChecked('editNoticiaDestacada', noticia.destacada);

    // 📸 Carga de imagen previa o placeholder si no existe
    const imgPreview = document.getElementById('editNoticiaImagenPreview');
    if (imgPreview) {
        const defaultPlaceholder = 'https://placehold.co/600x400?text=Sin+Imagen';
        imgPreview.src = noticia.imagenes?.url || defaultPlaceholder;
    }

    // Abrir modal
    const modal = document.getElementById('editNoticiaModal');
    if (modal) {
        modal.style.display = 'flex';
    }
}

function cerrarModalEditar() {
    const modal = document.getElementById('editNoticiaModal');
    if (modal) {
        modal.style.display = 'none';
    }
    const form = document.getElementById('editarNoticiaForm');
    if (form) form.reset();

    // Resetear preview al cerrar
    const imgPreview = document.getElementById('editNoticiaImagenPreview');
    if (imgPreview) {
        imgPreview.src = 'https://placehold.co/600x400?text=Sin+Imagen';
    }
}

async function guardarEdicionNoticia(e) {
    e.preventDefault();

    const id = document.getElementById('editNoticiaId').value;
    let mimagenId = document.getElementById('editImagenIdActual').value || null; // Cambiado a 'let' para reasignar si subes otra imagen
    const titulo = document.getElementById('editNoticiaTitulo').value.trim();
    const resumen = document.getElementById('editNoticiaResumen').value.trim();
    const cuerpo = document.getElementById('editNoticiaCuerpo').value.trim();
    const categorySlug = document.getElementById('editNoticiaCategoria').value;
    const publicado = document.getElementById('editNoticiaPublicado').checked;
    const destacada = document.getElementById('editNoticiaDestacada').checked;
    const fileInput = document.getElementById('editNoticiaImagen');
    const file = fileInput ? fileInput.files[0] : null;

    try {
        if (file) {
            if (file.type !== 'image/webp') {
                alert('⚠️ La imagen debe estar en formato .webp');
                return;
            }

            const fileName = `noticia-${Date.now()}.webp`;
            const filePath = `noticias/${fileName}`;

            const { error: uploadErr } = await window.dbClient.storage
                .from('IMAGENES')
                .upload(filePath, file, { upsert: true, contentType: 'image/webp' });

            if (uploadErr) throw uploadErr;

            const { data: publicUrlData } = window.dbClient.storage
                .from('IMAGENES')
                .getPublicUrl(filePath);

            const { data: imgRecord, error: imgErr } = await window.dbClient
                .from('imagenes')
                .insert({ url: publicUrlData.publicUrl, alt_texto: `Imagen actualizable: ${titulo}` })
                .select('id')
                .single();

            if (imgErr) throw imgErr;
            mimagenId = imgRecord.id;
        }

        const { data: catData, error: catErr } = await window.dbClient
            .from('categorias')
            .select('id')
            .eq('slug', categorySlug)
            .single();

        if (catErr) throw catErr;

        const { error: updateErr } = await window.dbClient
            .from('noticias')
            .update({
                titulo,
                resumen,
                cuerpo,
                categoria_id: catData.id,
                imagen_id: mimagenId,
                publicado,
                estado: publicado ? 'publicado' : 'en_revision',
                destacada,
                actualizado_en: new Date().toISOString()
            })
            .eq('id', id);

        if (updateErr) throw updateErr;

        alert('✅ Noticia actualizada con éxito');
        cerrarModalEditar();
        loadAllNoticiasAdmin();
    } catch (error) {
        console.error('Error al actualizar noticia:', error);
        alert('❌ Error al actualizar: ' + error.message);
    }
}

// 8. Eliminar noticia
async function deleteNoticia(noticiaId) {
    if (confirm('¿Estás seguro de que quieres eliminar esta noticia?')) {
        try {
            const { error } = await window.dbClient
                .from('noticias')
                .delete()
                .eq('id', noticiaId);

            if (error) throw error;

            alert('✅ Noticia eliminada');
            loadAllNoticiasAdmin();
            if (typeof loadDashboardStats === 'function') loadDashboardStats();
        } catch (error) {
            console.error('Error:', error);
            alert('❌ Error al eliminar noticia');
        }
    }
}

function previeweditTalleristaImagenImagen(event) {
    const file = event.target.files[0];
    if (!file) return;

    if (file.type !== 'image/webp') {
        alert('⚠️ Solo se permiten imágenes en formato .webp');
        event.target.value = '';
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        document.getElementById('editTalleristaImagenPreview').src = e.target.result;
    };
    reader.readAsDataURL(file);
}