document.addEventListener('DOMContentLoaded', () => {
    loadAllUsuarios();

    const form = document.getElementById('crearUsuarioForm');
    if (form && !form.dataset.listenerAttached) {
        form.addEventListener('submit', createUsuario);
        form.dataset.listenerAttached = 'true';
    }
});

function getAdminClient() {
    return window.supabaseClient || window.dbClient;
}

function escapeHtmlAdmin(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

async function loadAllUsuarios() {
    const container = document.getElementById('usuariosAdminList');
    if (!container) return;

    try {
        const client = getAdminClient();
        if (!client) throw new Error("Cliente Supabase no inicializado en el contexto global.");

        const { data, error } = await client
            .from('autores')
            .select('id, nombre, email, rol, biografia')
            .order('nombre');

        if (error) throw error;
        if (!data) return;

        const getRolBadge = (rol) => {
            if (rol === 'administrativo') return 'Admin';
            if (rol === 'superior') return 'Superior';
            return 'Tallerista';
        };

        container.innerHTML = `
            <table class="table" style="width: 100%; border-collapse: collapse;">
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
                            <td><strong>${escapeHtmlAdmin(u.nombre)}</strong></td>
                            <td>${escapeHtmlAdmin(u.email)}</td>
                            <td>${getRolBadge(u.rol)}</td>
                            <td>${escapeHtmlAdmin(u.biografia) || '<span style="color: #888;">Sin biografía</span>'}</td>
                            <td>
                                <button class="btn btn-secondary" style="background-color: #dc3545; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer;" onclick="deleteUsuario('${u.id}', '${escapeHtmlAdmin(u.nombre).replace(/'/g, "\\'")}')">
                                    Eliminar
                                </button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    } catch (error) {
        console.error('❌ Error al listar usuarios:', error);
    }
}

async function createUsuario(e) {
    if (e) e.preventDefault();

    const submitBtn = document.getElementById('btnSubmitUsuario');
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Procesando registro...';
    }

    const client = getAdminClient();
    const nombre = document.getElementById('usuarioNombre')?.value.trim();
    const email = document.getElementById('usuarioEmail')?.value.trim();
    const password = document.getElementById('usuarioPassword')?.value;
    const rol = document.getElementById('usuarioRol')?.value;
    const biografia = document.getElementById('usuarioBiografia')?.value.trim();
    const fotoInput = document.getElementById('usuarioFoto');

    let fotoId = null;

    try {
        if (!nombre || !email || !password || !rol) {
            alert('⚠️ Todos los campos principales son obligatorios.');
            return;
        }

        if (!client) {
            throw new Error('El cliente principal de Supabase no está instanciado.');
        }

        // 1. Manejo de Assets (Foto de Perfil en Bucket)
        if (fotoInput && fotoInput.files.length > 0) {
            const file = fotoInput.files[0];
            if (file.type !== 'image/webp') {
                alert('⚠️ La foto de perfil debe ser en formato .webp');
                return;
            }

            const fileName = `perfil-${Date.now()}.webp`;
            const filePath = `perfiles/${fileName}`;

            const { error: uploadError } = await client.storage
                .from('IMAGENES')
                .upload(filePath, file, { contentType: 'image/webp' });

            if (uploadError) throw uploadError;

            const { data: urlData } = client.storage
                .from('IMAGENES')
                .getPublicUrl(filePath);

            const { data: imgRecord, error: imgError } = await client
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

        // 2. Extracción limpia de credenciales desde la instancia sin exponer strings
        const supabaseUrl = client.supabaseUrl;
        const supabaseKey = client.supabaseKey;

        // Verificación de constructor global de Supabase SDK
        const createClientFn = window.supabase?.createClient || window.Supabase?.createClient;
        if (!createClientFn) {
            throw new Error('La librería Supabase SDK no fue detectada. Verifica que el CDN esté cargado en el <head> antes que este script.');
        }

        // Instancia aislada para no romper la sesión activa del administrador
        const tempSupabase = createClientFn(supabaseUrl, supabaseKey, {
            auth: { persistSession: false, autoRefreshToken: false }
        });

        const { data: authData, error: authError } = await tempSupabase.auth.signUp({
            email,
            password,
            options: { data: { nombre, rol } }
        });

        if (authError) throw authError;
        if (!authData.user) throw new Error("Registro Auth fallido: No se generó UUID de usuario.");

        // 3. Persistencia relacional en base de datos
        const { error: dbError } = await client
            .from('autores')
            .upsert({
                id: authData.user.id,
                nombre,
                email,
                rol,
                biografia: biografia || null,
                foto_id: fotoId
            });

        if (dbError) throw dbError;

        alert(`✅ El ${rol} "${nombre}" se ha creado con éxito.`);
        document.getElementById('crearUsuarioForm')?.reset();

        const preview = document.getElementById('usuarioFotoPreview');
        if (preview) preview.src = 'https://placehold.co/150x150?text=Foto';

        await loadAllUsuarios();
        if (typeof loadDashboardStats === 'function') loadDashboardStats();

    } catch (error) {
        console.error('❌ Error en el flujo de creación de usuario:', error);
        alert('❌ Error al crear usuario: ' + error.message);
    } finally {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Crear Usuario';
        }
    }
}

async function deleteUsuario(userId, nombre) {
    if (!confirm(`¿Confirmas la baja del usuario "${nombre}"?`)) return;

    try {
        const client = getAdminClient();
        const { error } = await client
            .from('autores')
            .delete()
            .eq('id', userId);

        if (error) throw error;

        alert(`✅ Usuario "${nombre}" eliminado.`);

        await loadAllUsuarios();
        if (typeof loadDashboardStats === 'function') loadDashboardStats();

    } catch (error) {
        console.error('❌ Error en baja de usuario:', error);
        alert('❌ Error al eliminar usuario: ' + error.message);
    }
}