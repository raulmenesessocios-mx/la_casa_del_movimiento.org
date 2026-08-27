document.addEventListener('DOMContentLoaded', () => {
    loadAllUsuarios();

    const form = document.getElementById('crearUsuarioForm');
    if (form) {
        form.addEventListener('submit', createUsuario);
    }
});

// 1. Cargar y listar todos los usuarios
async function loadAllUsuarios() {
    try {
        const container = document.getElementById('usuariosAdminList');
        if (!container) return;

        const { data, error } = await window.dbClient
            .from('autores')
            .select('id, nombre, email, rol, biografia')
            .order('nombre');

        if (error) throw error;
        if (!data) return;

        const html = `
            <table class="table">
                <thead>
                    <tr>
                        <th>Nombre</th>
                        <th>Email</th>
                        <th>Rol</th>
                        <th>Biografía</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    ${data.map(u => `
                        <tr>
                            <td><strong>${u.nombre}</strong></td>
                            <td>${u.email}</td>
                            <td>${u.rol === 'administrativo' ? '🔐 Admin' : '👨‍🏫 Tallerista'}</td>
                            <td>${u.biografia || '<span style="color: #888;">Sin biografía</span>'}</td>
                            <td>
                                <button class="btn btn-secondary" style="background-color: #dc3545; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer;" onclick="deleteUsuario('${u.id}', '${u.nombre.replace(/'/g, "\\'")}')">
                                    🗑️ Eliminar
                                </button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;

        container.innerHTML = html;
    } catch (error) {
        console.error('Error al listar usuarios:', error);
    }
}

// 2. Crear un nuevo usuario
async function createUsuario(e) {
    e.preventDefault();

    const submitBtn = document.getElementById('btnSubmitUsuario');
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Creando usuario...';
    }

    const nombre = document.getElementById('usuarioNombre').value.trim();
    const email = document.getElementById('usuarioEmail').value.trim();
    const password = document.getElementById('usuarioPassword').value;
    const rol = document.getElementById('usuarioRol').value;
    const biografia = document.getElementById('usuarioBiografia').value.trim();

    try {
        // A) Usamos una instancia aislada de cliente para NO cerrar la sesión del Administrador actual
        const tempSupabase = window.supabase.createClient(
            'https://ilmkmivwhfjlvznrsgoc.supabase.co',
            'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlsbWttaXZ3aGZqbHZ6bnJzZ29jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc3MTA1NzcsImV4cCI6MjEwMzI4NjU3N30.YXKAm5Zxeb1tm_YiVdc2myntJXDjq62biHY27XSG4-g',
            { auth: { persistSession: false } }
        );

        // B) Registrar usuario enviando metadatos para que el Trigger automático de BD no falle
        const { data: authData, error: authError } = await tempSupabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    nombre: nombre,
                    rol: rol
                }
            }
        });

        if (authError) throw authError;
        if (!authData.user) throw new Error('No se pudo generar la cuenta de usuario.');

        const userId = authData.user.id;

        // C) Dar un pequeño margen de tiempo (300ms) para que el Trigger de BD termine de insertar en 'autores'
        await new Promise(resolve => setTimeout(resolve, 300));

        // D) Usamos UPDATE (no insert) para agregar la biografía y asegurar que todos los campos queden guardados
        const { error: dbError } = await window.dbClient
            .from('autores')
            .update({
                nombre,
                email,
                rol,
                biografia: biografia || null
            })
            .eq('id', userId);

        if (dbError) throw dbError;

        alert(`✅ Usuario "${nombre}" creado exitosamente.`);
        document.getElementById('crearUsuarioForm').reset();

        // Actualizar listas del panel
        loadAllUsuarios();
        if (typeof loadDashboardStats === 'function') loadDashboardStats();
        if (typeof loadTalleristasDropdown === 'function') loadTalleristasDropdown();
        if (typeof loadTalleristasForSelect === 'function') loadTalleristasForSelect();

    } catch (error) {
        console.error('Error al crear usuario:', error);
        alert('❌ Error al crear usuario: ' + error.message);
    } finally {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Crear Usuario';
        }
    }
}

// 3. Eliminar usuario
async function deleteUsuario(userId, nombre) {
    if (!confirm(`¿Estás seguro de que deseas eliminar al usuario "${nombre}"?\nEsta acción eliminará tanto su perfil como su cuenta de inicio de sesión.`)) {
        return;
    }

    try {
        const { error } = await window.dbClient
            .from('autores')
            .delete()
            .eq('id', userId);

        if (error) throw error;

        alert(`✅ El usuario "${nombre}" ha sido eliminado totalmente.`);

        loadAllUsuarios();
        if (typeof loadDashboardStats === 'function') loadDashboardStats();
        if (typeof loadTalleristasDropdown === 'function') loadTalleristasDropdown();
        if (typeof loadTalleristasForSelect === 'function') loadTalleristasForSelect();

    } catch (error) {
        console.error('Error al eliminar usuario:', error);
        alert('❌ Error al eliminar el usuario: ' + error.message);
    }
}