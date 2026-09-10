async function loadInteresadosSuperior(userId = null) {
    const container = document.getElementById('interesadosTablaBodySuperior');
    if (!container) return;

    try {
        const client = window.supabaseClient || window.dbClient;
        if (!client) throw new Error("Cliente de Supabase no disponible.");

        let targetUserId = userId;
        if (!targetUserId) {
            const { data: { user } } = await client.auth.getUser();
            if (!user) return;
            targetUserId = user.id;
        }

        // 1. Obtener los talleres asignados al instructor mediante su userId de Auth
        const { data: misTalleres, error: talleresErr } = await client
            .from('talleres')
            .select('id, titulo')
            .eq('instructor_id', targetUserId);

        if (talleresErr || !misTalleres || misTalleres.length === 0) {
            container.innerHTML = `<tr><td colspan="5" style="text-align:center; padding: 20px;">No tienes talleres registrados como instructor.</td></tr>`;
            return;
        }

        // Crear mapa para asociar taller_id -> titulo
        const talleresMap = new Map(misTalleres.map(t => [t.id, t.titulo]));
        const tallerIds = Array.from(talleresMap.keys());

        // 2. Consultar los interesados inscritos en esos talleres
        const { data: interesados, error } = await client
            .from('interesados_talleres')
            .select('*')
            .in('taller_id', tallerIds)
            .order('fecha_registro', { ascending: false });

        if (error) throw error;

        const listaFormateada = (interesados || []).map(item => ({
            ...item,
            taller_nombre: talleresMap.get(item.taller_id) || 'Taller'
        }));

        renderInteresadosTablaSuperior(listaFormateada);

    } catch (err) {
        console.error('Error al cargar la lista de interesados:', err);
        container.innerHTML = `<tr><td colspan="5" style="text-align:center; color:#e11d48; padding: 20px;">❌ Error al consultar la lista de interesados.</td></tr>`;
    }
}

function renderInteresadosTablaSuperior(lista) {
    const container = document.getElementById('interesadosTablaBodySuperior');
    if (!container) return;

    if (!lista || lista.length === 0) {
        container.innerHTML = `
            <tr>
                <td colspan="5" style="text-align: center; color: #64748b; padding: 20px;">
                    📭 Aún no hay personas registradas o interesadas en tus talleres.
                </td>
            </tr>`;
        return;
    }

    container.innerHTML = lista.map((item, index) => {
        const nombre = item.nombre || item.nombre_completo || 'Sin nombre';
        return `
            <tr>
                <td style="padding: 12px; border-bottom: 1px solid #e2e8f0;">${index + 1}</td>
                <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; font-weight: 600;">${escapeHtmlSuperior(nombre)}</td>
                <td style="padding: 12px; border-bottom: 1px solid #e2e8f0;">${escapeHtmlSuperior(item.email)}</td>
                <td style="padding: 12px; border-bottom: 1px solid #e2e8f0;">${escapeHtmlSuperior(item.telefono || 'N/A')}</td>
                <td style="padding: 12px; border-bottom: 1px solid #e2e8f0;">
                    <span style="background: #e0f2fe; color: #0369a1; padding: 4px 8px; border-radius: 6px; font-size: 0.85em; font-weight: bold;">
                        ${escapeHtmlSuperior(item.taller_nombre)}
                    </span>
                </td>
            </tr>
        `;
    }).join('');
}

function escapeHtmlSuperior(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}