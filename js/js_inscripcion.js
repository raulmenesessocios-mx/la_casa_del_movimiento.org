document.addEventListener('DOMContentLoaded', async () => {
    if (!window.dbClient) {
        window.dbClient = window.supabaseClient || window.supabase;
    }

    // 1. Obtener el taller_id de los parámetros URL
    const urlParams = new URLSearchParams(window.location.search);
    const tallerId = urlParams.get('taller_id');

    const tallerNombreSpan = document.getElementById('nombre-taller');
    const tallerIdInput = document.getElementById('tallerIdInput');

    if (!tallerId) {
        tallerNombreSpan.textContent = 'No se especificó un taller válido.';
        return;
    }

    tallerIdInput.value = tallerId;

    // 2. Obtener el título del taller para mostrarlo
    try {
        const { data, error } = await window.dbClient
            .from('talleres')
            .select('titulo')
            .eq('id', tallerId)
            .single();

        if (error) throw error;
        if (data) {
            tallerNombreSpan.textContent = data.titulo;
        }
    } catch (err) {
        console.error('Error al obtener información del taller:', err);
        tallerNombreSpan.textContent = 'Taller no encontrado';
    }

    // 3. Manejar envío del formulario
    const form = document.getElementById('registroInteresadoForm');
    if (form) {
        form.addEventListener('submit', enviarInscripcion);
    }
});

async function enviarInscripcion(e) {
    e.preventDefault();

    const btnSubmit = document.getElementById('btnSubmitRegistro');
    btnSubmit.disabled = true;
    btnSubmit.textContent = 'Guardando...';

    const taller_id = document.getElementById('tallerIdInput').value;
    const nombre = document.getElementById('nombre').value.trim();
    const email = document.getElementById('email').value.trim();
    const telefono = document.getElementById('telefono').value.trim();
    const mensaje = document.getElementById('mensaje').value.trim();

    try {
        const { error } = await window.dbClient
            .from('interesados_talleres')
            .insert({
                taller_id: taller_id,
                nombre: nombre,
                email: email,
                telefono: telefono,
                mensaje: mensaje || null,
                visto: false
            });

        if (error) throw error;

        alert('🎉 ¡Gracias por registrarte! Nos pondremos en contacto contigo pronto.');
        window.location.href = '/talleres.html';

    } catch (error) {
        console.error('Error al enviar registro:', error);
        alert('❌ Ocurrió un error al guardar tu solicitud: ' + error.message);
    } finally {
        btnSubmit.disabled = false;
        btnSubmit.textContent = 'Enviar Solicitud';
    }
}