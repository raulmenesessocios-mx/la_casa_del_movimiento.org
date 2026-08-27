document.addEventListener('DOMContentLoaded', () => {
    loadAllTalleres();
});

async function loadAllTalleres() {
    try {
        const container = document.getElementById('talleresAdminList');
        if (!container) return;

        const { data } = await window.dbClient
            .from('talleres')
            .select('id, titulo, cupo');

        if (!data) return;

        const html = `
            <table class="table">
                <thead>
                    <tr>
                        <th>Taller</th>
                        <th>Cupo</th>
                    </tr>
                </thead>
                <tbody>
                    ${data.map(t => `
                        <tr>
                            <td>${t.titulo}</td>
                            <td>${t.cupo} personas</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;

        container.innerHTML = html;
    } catch (error) {
        console.error('Error al listar talleres:', error);
    }
}