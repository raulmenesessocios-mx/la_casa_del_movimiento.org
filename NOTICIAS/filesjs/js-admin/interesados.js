async function loadInteresadosAdmin() {
    const container = document.getElementById('interesadosTablaBodyadmin');
    if (!container) return;

    try {
        const client = window.dbClient || window.supabaseClient || window.supabase;
        if (!client) throw new Error("Cliente de Supabase no disponible.");

        // 1. Obtener TODOS los talleres registrados sin filtrar por instructor
        const { data: todosLosTalleres, error: talleresErr } = await client
            .from('talleres')
            .select('id, titulo');

        if (talleresErr) throw talleresErr;

        if (!todosLosTalleres || todosLosTalleres.length === 0) {
            container.innerHTML = `<tr><td colspan="5" style="text-align:center; padding: 20px;">No hay talleres registrados en el sistema.</td></tr>`;
            return;
        }

        // Crear mapa para asociar taller_id -> titulo
        const talleresMap = new Map(todosLosTalleres.map(t => [t.id, t.titulo]));
        const tallerIds = Array.from(talleresMap.keys());

        // 2. Consultar los interesados de todos los talleres
        const { data: interesados, error } = await client
            .from('interesados_talleres')
            .select('*')
            .in('taller_id', tallerIds)
            .order('fecha_registro', { ascending: false });

        if (error) throw error;

        if (!interesados || interesados.length === 0) {
            container.innerHTML = `
                <tr>
                    <td colspan="5" style="text-align: center; color: #64748b; padding: 20px;">
                        📭 Aún no hay personas registradas o interesadas en los talleres.
                    </td>
                </tr>`;
            return;
        }

        // 3. Renderizar directamente en la tabla
        container.innerHTML = interesados.map((item, index) => {
            const nombre = item.nombre || 'Sin nombre';
            const tallerNombre = talleresMap.get(item.taller_id) || 'Taller';

            return `
                <tr>
                    <td style="padding: 12px; border-bottom: 1px solid #e2e8f0;">${index + 1}</td>
                    <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; font-weight: 600;">${escapeHtmlAdmin(nombre)}</td>
                    <td style="padding: 12px; border-bottom: 1px solid #e2e8f0;">${escapeHtmlAdmin(item.email)}</td>
                    <td style="padding: 12px; border-bottom: 1px solid #e2e8f0;">${escapeHtmlAdmin(item.telefono || 'N/A')}</td>
                    <td style="padding: 12px; border-bottom: 1px solid #e2e8f0;">
                        <span style="background: #e0f2fe; color: #0369a1; padding: 4px 8px; border-radius: 6px; font-size: 0.85em; font-weight: bold;">
                            ${escapeHtmlAdmin(tallerNombre)}
                        </span>
                    </td>
                </tr>
            `;
        }).join('');

    } catch (err) {
        console.error('Error al cargar la lista de interesados para el admin:', err);
        container.innerHTML = `<tr><td colspan="5" style="text-align:center; color:#e11d48; padding: 20px;">❌ Error al consultar la lista de interesados.</td></tr>`;
    }
}

// Función auxiliar para desinfectar entradas de texto
function escapeHtmlAdmin(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}