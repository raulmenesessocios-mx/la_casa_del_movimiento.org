let talleresCache = [];

document.addEventListener('DOMContentLoaded', async () => {
    if (!window.dbClient) {
        window.dbClient = window.supabaseClient || window.supabase;
    }

    await loadTalleresPublicGrid();

    // Event listeners para cerrar el modal
    document.addEventListener('click', (e) => {
        if (e.target.matches('.workshop-modal-close') || e.target.closest('.workshop-modal-close')) {
            closeWorkshopModal();
        }
        if (e.target.matches('.workshop-modal-backdrop')) {
            closeWorkshopModal();
        }
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeWorkshopModal();
    });
});

async function loadTalleresPublicGrid() {
    const gridContainer = document.querySelector('.workshops-grid');
    if (!gridContainer) return;

    try {
        gridContainer.innerHTML = '<p style="grid-column: 1/-1; text-align: center;">Cargando talleres...</p>';

        const { data, error } = await window.dbClient
            .from('talleres')
            .select(`
                *,
                imagenes:imagen_gancho_id(url, alt_texto),
                instructor:autores!instructor_id(
                    nombre,
                    biografia,
                    foto:foto_id(url)
                )
            `)
            .order('creado_en', { ascending: false });

        if (error) throw error;

        talleresCache = data || [];

        // Renderiza taller aleatorio en el banner dinámico
        renderRandomHook(talleresCache);

        if (talleresCache.length === 0) {
            gridContainer.innerHTML = '<p style="grid-column: 1/-1; text-align: center;">No hay talleres disponibles por el momento.</p>';
            return;
        }

        gridContainer.innerHTML = talleresCache.map(taller => {
            const imgUrl = taller.imagenes?.url || 'https://placehold.co/400x280?text=Taller';
            return `
                <div class="workshop-card">
                    <div class="workshop-card-image">
                        <img src="${imgUrl}" alt="${taller.titulo}" loading="lazy">
                    </div>
                    <div class="workshop-card-body">
                        <h4 class="workshop-card-title">${taller.frase_gancho || taller.titulo}</h4>
                        <p class="workshop-card-description">${taller.titulo}</p>
                        <button class="btn btn-workshop-open" onclick="openWorkshopModal('${taller.id}')">Ver Taller →</button>
                    </div>
                </div>
            `;
        }).join('');

    } catch (error) {
        console.error('Error al cargar la lista de talleres:', error);
        gridContainer.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: red;">Error al cargar talleres.</p>';
    }
}

function openWorkshopModal(tallerId) {
    const data = talleresCache.find(t => t.id === tallerId);
    if (!data) return;

    // Imagen y títulos del taller
    const modalImg = document.getElementById('modal-hook-image');
    if (modalImg) modalImg.src = data.imagenes?.url || 'https://placehold.co/600x350?text=Taller';
    
    document.getElementById('modal-hook-title').textContent = data.titulo;
    document.getElementById('modal-hook-subtitle').textContent = data.frase_gancho || '';

    // Descripción
    const bloque2Container = document.getElementById('modal-bloque-2');
    if (bloque2Container) {
        bloque2Container.innerHTML = `
            <div class="bloque-2-item">
                <div class="bloque-2-icon">🎭</div>
                <div class="bloque-2-text">${data.descripcion || 'Sin descripción disponible.'}</div>
            </div>
        `;
    }

    // Instructor: Nombre, Biografía y Foto
    document.getElementById('modal-instructor-name').textContent = data.instructor?.nombre || 'Instructor por asignar';
    document.getElementById('modal-instructor-bio').textContent = data.instructor?.biografia || 'Sin biografía disponible.';
    
    const instructorImg = document.getElementById('modal-instructor-photo');
    if (instructorImg) {
        instructorImg.src = data.instructor?.foto?.url || 'https://placehold.co/150x150?text=Sin+Foto';
    }

    // Datos extra
    document.getElementById('modal-para-quien').textContent = `${data.para_quien || 'Público general'} (${data.nivel_edad || 'Todos los niveles'}).`;

    const dias = data.horarios?.dias || 'Por definir';
    const hora = data.horarios?.horario || 'Por definir';
    document.getElementById('modal-horario').textContent = `${dias}, ${hora}`;

    if (data.proxima_sesion) {
        const fecha = new Date(data.proxima_sesion);
        document.getElementById('modal-proxima-sesion').textContent = fecha.toLocaleDateString('es-MX', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    } else {
        document.getElementById('modal-proxima-sesion').textContent = 'Por confirmar';
    }

    // Configurar botón "Inscribirme" para redirigir al formulario
    const btnInscribir = document.getElementById('modal-btn-inscribir');
    if (btnInscribir) {
        btnInscribir.onclick = () => {
            window.location.href = `inscripcion-taller.html?taller_id=${data.id}`;
        };
    }

    const modal = document.getElementById('workshop-modal');
    if (modal) {
        modal.classList.add('active');
        document.body.classList.add('no-scroll');
    }
}

function renderRandomHook(talleres) {
    if (!talleres || talleres.length === 0) return;

    const randomIndex = Math.floor(Math.random() * talleres.length);
    const tallerAzar = talleres[randomIndex];

    const titleEl = document.querySelector('.hook-title');
    const descEl = document.querySelector('.hook-description');
    const imgEl = document.querySelector('.hook-image img');

    if (titleEl) titleEl.textContent = `"${tallerAzar.frase_gancho || tallerAzar.titulo}"`;
    if (descEl) descEl.textContent = tallerAzar.descripcion || 'Cada taller es un viaje hacia la creatividad sin límites.';
    if (imgEl && tallerAzar.imagenes?.url) {
        imgEl.src = tallerAzar.imagenes.url;
        imgEl.alt = tallerAzar.titulo || 'Imagen del taller destacado';
    }
}

function closeWorkshopModal() {
    const modal = document.getElementById('workshop-modal');
    if (modal) modal.classList.remove('active');
    document.body.classList.remove('no-scroll');
}