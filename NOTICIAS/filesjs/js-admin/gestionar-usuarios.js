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
        submitBtn.textContent = 'Guardando usuario...';
    }

    const nombre = document.getElementById('usuarioNombre').value.trim();
    const email = document.getElementById('usuarioEmail').value.trim();
    const password = document.getElementById('usuarioPassword').value;
    const rol = document.getElementById('usuarioRol').value;
    const biografia = document.getElementById('usuarioBiografia').value.trim();
    const fotoInput = document.getElementById('usuarioFoto');

    let fotoId = null;

    try {
        // 1. Subir la Foto de Perfil si el usuario seleccionó un archivo
        if (fotoInput && fotoInput.files.length > 0) {
            const file = fotoInput.files[0];
            const fileExt = file.name.split('.').pop();
            const fileName = `perfil-${Date.now()}.${fileExt}`;
            const filePath = `perfiles/${fileName}`;

            const { error: uploadError } = await window.dbClient.storage
                .from('IMAGENES')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: urlData } = window.dbClient.storage
                .from('IMAGENES')
                .getPublicUrl(filePath);

            const { data: imgRecord, error: imgError } = await window.dbClient
                .from('imagenes')
                .insert({
                    url: urlData.publicUrl,
                    alt_texto: `Foto de perfil de ${nombre}`
                })
                .select('id')
                .single();

            if (imgError) throw imgError;
            fotoId = imgRecord.id;
        }

        // 2. Crear Auth en Supabase
        const createClientFn = window.createSupabaseClient || (window.supabase && window.supabase.createClient);
        if (!createClientFn) throw new Error('No se encontró el cliente de Supabase.');

        const tempSupabase = createClientFn(
            'https://ilmkmivwhfjlvznrsgoc.supabase.co',
            'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlsbWttaXZ3aGZqbHZ6bnJzZ29jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc3MTA1NzcsImV4cCI6MjEwMzI4NjU3N30.YXKAm5Zxeb1tm_YiVdc2myntJXDjq62biHY27XSG4-g',
            { auth: { persistSession: false } }
        );

        const { data: authData, error: authError } = await tempSupabase.auth.signUp({
            email,
            password,
            options: { data: { nombre, rol } }
        });

        if (authError) throw authError;
        const userId = authData.user.id;

        await new Promise(resolve => setTimeout(resolve, 350));

        // 3. Actualizar la tabla 'autores' incluyendo biografia y foto_id
        const { error: dbError } = await window.dbClient
            .from('autores')
            .upsert({
                id: userId,
                nombre,
                email,
                rol,
                biografia: biografia || null,  
                foto_id: fotoId
            });
        if (dbError) throw dbError;

        alert(` El ${rol} "${nombre}" ha registrado correctamente.`);
        document.getElementById('crearUsuarioForm').reset();

        loadAllUsuarios();
        if (typeof loadTalleristasDropdown === 'function') loadTalleristasDropdown();

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