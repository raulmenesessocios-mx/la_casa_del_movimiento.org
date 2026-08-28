async function loadMyTaller(userId) {
    const contenedor = document.getElementById('tallerInfo');
    try {
        const { data: talleres, error } = await window.supabaseClient
            .from('talleres')
            .select(`
                *,
                imagenes ( url, alt_texto )
            `)
            .eq('instructor_id', userId);

        if (error) throw error;

        if (!talleres || talleres.length === 0) {
            contenedor.innerHTML = '<p>No tienes talleres asignados por el momento.</p>';
            return;
        }

        contenedor.innerHTML = talleres.map(taller => `
            <div class="taller-card">
                ${taller.imagenes?.url ? `<img src="${taller.imagenes.url}" alt="${taller.imagenes.alt_texto || 'Taller'}" style="max-width: 100%; border-radius: 8px; margin-bottom: 1rem;">` : ''}
                <h3>${taller.titulo}</h3>
                <p><em>"${taller.frase_gancho || ''}"</em></p>
                <hr style="margin: 10px 0; border: 0; border-top: 1px solid #eee;">
                
                <p><strong>Descripción:</strong> ${taller.descripcion || 'Sin descripción'}</p>
                <p><strong>Dirigido a:</strong> ${taller.para_quien || 'Público general'}</p>
                <p><strong>Nivel / Edad:</strong> ${taller.nivel_edad || 'N/A'}</p>
                <p><strong>Cupo máximo:</strong> ${taller.cupo || 0} personas</p>
                <p><strong>Próxima Sesión:</strong> ${taller.proxima_sesion ? new Date(taller.proxima_sesion).toLocaleString() : 'Sin definir'}</p>
            </div>
        `).join('');

    } catch (error) {
        console.error('Error cargando taller:', error);
        contenedor.innerHTML = '<p>❌ Error al cargar la información de tu taller.</p>';
    }
}