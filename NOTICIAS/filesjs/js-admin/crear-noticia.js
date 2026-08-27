document.addEventListener('DOMContentLoaded', () => {
    loadTalleristasForSelect();

    const form = document.getElementById('crearNoticiaAdminForm');
    if (form) {
        form.addEventListener('submit', createNoticiaAdmin);
    }
});

async function loadTalleristasForSelect() {
    try {
        const { data } = await window.dbClient
            .from('autores')
            .select('id, nombre')
            .eq('rol', 'tallerista');

        const select = document.getElementById('noticiaAutor');
        if (!select) return;

        select.innerHTML = '<option value="">Selecciona un tallerista</option>';
        if (data) {
            data.forEach(tallerista => {
                const option = document.createElement('option');
                option.value = tallerista.id;
                option.textContent = tallerista.nombre;
                select.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Error al cargar talleristas:', error);
    }
}

async function createNoticiaAdmin(e) {
    e.preventDefault();

    const autorId = document.getElementById('noticiaAutor').value;
    const titulo = document.getElementById('noticiaAdminTitulo').value;
    const resumen = document.getElementById('noticiaAdminResumen').value;
    const cuerpo = document.getElementById('noticiaAdminCuerpo').value;
    const categorySlug = document.getElementById('noticiaAdminCategoria').value;
    const destacada = document.getElementById('noticiaAdminDestacada').checked;

    try {
        const { data: catData, error: catError } = await window.dbClient
            .from('categorias')
            .select('id')
            .eq('slug', categorySlug)
            .single();

        if (catError) throw catError;

        const { error } = await window.dbClient
            .from('noticias')
            .insert({
                titulo,
                resumen,
                cuerpo,
                autor_id: autorId,
                categoria_id: catData.id,
                publicado: true,
                destacada
            });

        if (error) throw error;

        alert('✅ Noticia creada');
        document.getElementById('crearNoticiaAdminForm').reset();
        if (typeof loadAllNoticias === 'function') loadAllNoticias();
        if (typeof loadDashboardStats === 'function') loadDashboardStats();
    } catch (error) {
        console.error('Error:', error);
        alert('❌ Error al crear noticia: ' + error.message);
    }
}