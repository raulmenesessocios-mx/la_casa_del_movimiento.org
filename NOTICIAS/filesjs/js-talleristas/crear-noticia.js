document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('crearNoticiaForm');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            await createNoticiaTallerista();
        });
    }
});

function previewnoticiaImagen(event) {
    const file = event.target.files[0];
    if (!file) return;

    if (file.type !== 'image/webp') {
        alert('⚠️ Solo se permiten imágenes en formato .webp');
        event.target.value = '';
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        document.getElementById('noticiaImagenPreview').src = e.target.result;
    };
    reader.readAsDataURL(file);
}

async function createNoticiaTallerista() {
    try {
        const client = window.supabaseClient || window.dbClient;
        const { data: { user } } = await client.auth.getUser();

        if (!user) {
            alert('⚠️ Debes iniciar sesión.');
            return;
        }

        // 1. Obtener id del autor ligado al email del usuario autenticado
        const { data: autor, error: autorErr } = await client
            .from('autores')
            .select('id')
            .eq('email', user.email)
            .single();

        if (autorErr || !autor) {
            alert('⚠️ No se encontró la ficha de autor asociada a tu usuario.');
            return;
        }

        const titulo = document.getElementById('noticiaTitle').value.trim();
        const resumen = document.getElementById('noticiaResumen').value.trim();
        const cuerpo = document.getElementById('noticiaCuerpo').value.trim();
        const categorySlug = document.getElementById('noticiaCategoria').value;
        const destacada = document.getElementById('noticiaDedicada')?.checked || false;

        // 2. Obtener id de la categoría
        const { data: catData, error: catErr } = await client
            .from('categorias')
            .select('id')
            .eq('slug', categorySlug)
            .single();

        if (catErr) throw catErr;

        // 3. Insertar noticia en revisión
        const { error: insertErr } = await client
            .from('noticias')
            .insert({
                titulo,
                resumen,
                cuerpo,
                autor_id: autor.id,
                categoria_id: catData.id,
                publicado: false,
                estado: 'en_revision',
                destacada
            });

        if (insertErr) throw insertErr;

        alert('📩 Noticia enviada a revisión exitosamente.');
        document.getElementById('crearNoticiaForm').reset();

        if (typeof loadMyNoticias === 'function') {
            loadMyNoticias(autor.id);
        }
    } catch (error) {
        console.error('Error al crear noticia:', error);
        alert('❌ Error al enviar noticia: ' + error.message);
    }
}

