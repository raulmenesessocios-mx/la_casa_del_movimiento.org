async function createNoticia(userId) {
    const titulo = document.getElementById('noticiaTitle').value;
    const resumen = document.getElementById('noticiaResumen').value;
    const cuerpo = document.getElementById('noticiaCuerpo').value;
    const categorySlug = document.getElementById('noticiaCategoria').value;
    const destacada = document.getElementById('noticiaDedicada').checked;

    try {
        const { data: catData, error: catError } = await window.supabaseClient
            .from('categorias')
            .select('id')
            .eq('slug', categorySlug)
            .single();

        if (catError) throw catError;

        const { error } = await window.supabaseClient
            .from('noticias')
            .insert({
                titulo,
                resumen,
                cuerpo,
                autor_id: userId,
                categoria_id: catData.id,
                publicado: true,
                destacada
            });

        if (error) throw error;

        alert('✅ Noticia creada exitosamente');
        document.getElementById('crearNoticiaForm').reset();
        loadMyNoticias(userId);
    } catch (error) {
        console.error('Error:', error);
        alert('❌ Error al crear noticia');
    }
}