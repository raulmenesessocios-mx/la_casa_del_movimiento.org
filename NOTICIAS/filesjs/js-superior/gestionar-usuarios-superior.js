document.addEventListener('DOMContentLoaded', () => {
    loadUsuariosSuperior();

    const formCrear = document.getElementById('formCrearTalleristaSuperior');
    if (formCrear && !formCrear.dataset.listenerAttached) {
        formCrear.addEventListener('submit', async (e) => {
            e.preventDefault();
            await registrarTalleristaSuperior();
        });
        formCrear.dataset.listenerAttached = 'true';
    }
});

function getClientSuperior() {
    return window.supabaseClient || window.dbClient;
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

async function loadUsuariosSuperior() {
    const container = document.getElementById('usuariosTablaBodySuperior');
    if (!container) return;

    try {
        const client = getClientSuperior();
        if (!client) throw new Error("Cliente Supabase no inicializado.");

        const { data: usuarios, error } = await client
            .from('autores')
            .select('id, nombre, email, rol, biografia')
            .order('nombre', { ascending: true });

        if (error) throw error;

        renderUsuariosTablaSuperior(usuarios || []);

    } catch (err) {
        console.error('❌ Error al cargar usuarios (Superior):', err);
    }
}

function renderUsuariosTablaSuperior(lista) {
    const container = document.getElementById('usuariosTablaBodySuperior');
    if (!container) return;

    if (!lista || lista.length === 0) {
        container.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 20px;">No hay usuarios registrados.</td></tr>';
        return;
    }

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
                </tr>
            </thead>
            <tbody>
                ${lista.map(u => `
                    <tr>
                        <td><strong>${escapeHtmlSuperior(u.nombre)}</strong></td>
                        <td>${escapeHtmlSuperior(u.email)}</td>
                        <td><span class="badge">${getRolBadge(u.rol)}</span></td>
                        <td>${escapeHtmlSuperior(u.biografia) || '<span style="color: #888;">Sin biografía</span>'}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

async function registrarTalleristaSuperior() {
    const form = document.getElementById('formCrearTalleristaSuperior');
    const submitBtn = form?.querySelector('button[type="submit"]');
    
    // Obtener texto original del botón para restaurarlo al finalizar
    const originalBtnText = submitBtn ? submitBtn.innerText : '';

    const client = getClientSuperior();
    const nombre = document.getElementById('nuevoTalleristaNombreSuperior')?.value.trim();
    const email = document.getElementById('nuevoTalleristaEmailSuperior')?.value.trim();
    const password = "movimiento";
    const biografia = document.getElementById('nuevoTalleristaBiografiaSuperior')?.value.trim();

    const ROL_OBLIGATORIO = 'tallerista';

    try {
        if (!nombre || !email) {
            alert('⚠️ Los campos Nombre y Email son requeridos.');
            return;
        }

        // Bloquear el botón durante la operación
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerText = 'Creando usuario...';
        }

        // 1. Extraer la constructora del SDK global
        const createClientFn = window.supabase?.createClient;
        if (!createClientFn) {
            throw new Error('SDK de Supabase no detectado. Valida la inyección del CDN.');
        }

        // 2. Extraer credenciales dinámicas
        const supabaseUrl = window.AppConfig?.URL || client?.supabaseUrl;
        const supabaseKey = window.AppConfig?.ANON_KEY || client?.supabaseKey;

        if (!supabaseUrl || !supabaseKey) {
            throw new Error('Variables de entorno de base de datos no encontradas.');
        }

        // 3. Instanciar en un entorno aislado temporal
        const tempSupabase = createClientFn(supabaseUrl, supabaseKey, {
            auth: { persistSession: false, autoRefreshToken: false }
        });

        // 4. Procesar el registro en Auth
        const { data: authData, error: authError } = await tempSupabase.auth.signUp({
            email,
            password,
            options: { 
                data: { 
                    nombre, 
                    rol: ROL_OBLIGATORIO, 
                    biografia: biografia || null 
                } 
            }
        });

        if (authError) throw authError;

        // 5. Persistencia relacional en la tabla 'autores'
        const { error: dbError } = await client
            .from('autores')
            .upsert({
                id: authData.user.id,
                nombre,
                email,
                rol: ROL_OBLIGATORIO,
                biografia: biografia || null
            });

        if (dbError) throw dbError;

        // Alerta única de éxito al finalizar todo el proceso
        alert(`✅ Tallerista "${nombre}" registrado exitosamente en el sistema.`);
        form?.reset();
        await loadUsuariosSuperior();

    } catch (err) {
        console.error('❌ Error operacional al registrar tallerista:', err);
        alert('❌ Error al crear tallerista: ' + err.message);
    } finally {

        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerText = originalBtnText;
        }
    }
}