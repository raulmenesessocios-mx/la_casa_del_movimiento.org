let noticiasCargadas = [];
let categoriasCargadas = [];

document.addEventListener('DOMContentLoaded', () => {
    initCategoriasDinamicas();
    fetchAndRenderPublicNoticias();
    setupModalEvents();
});

function getSupabaseClient() {
    return window.dbClient || window.supabaseClient || window.supabase;
}

// 1. CARGAR Y RENDERIZAR CATEGORÍAS DINÁMICAS DESDE SUPABASE
async function initCategoriasDinamicas() {
    try {
        const client = getSupabaseClient();
        if (!client) return;

        const { data: categorias, error } = await client
            .from('categorias')
            .select('id, nombre, slug')
            .order('nombre', { ascending: true });

        if (error) throw error;
        categoriasCargadas = categorias || [];

        renderizarTabsCategorias();
    } catch (err) {
        console.error('❌ Error al cargar categorías dinámicas:', err);
    }
}

function renderizarTabsCategorias() {
    const container = document.getElementById('newsTabsContainer');
    const dropdownMenu = document.getElementById('dropdownCategoriasMenu');
    const dropdownWrapper = document.getElementById('dropdownCategoriasWrapper');
    
    if (!container) return;

    // Mantenemos siempre el botón de "Todos" inicial
    let htmlTabs = `<button class="tab-button tab-active" data-filter="todos" onclick="filtrarPorCategoria('todos', this)">Todos</button>`;
    let htmlDropdown = '';

    // Definimos un límite máximo de botones visibles antes de agrupar en el menú desplegable (ej. máximo 4 visibles)
    const limiteVisibles = 4;

    categoriasCargadas.forEach((cat, index) => {
        if (index < limiteVisibles) {
            htmlTabs += `<button class="tab-button" data-filter="${cat.slug}" onclick="filtrarPorCategoria('${cat.slug}', this)">${escapeHtmlPublic(cat.nombre)}</button>`;
        } else {
            htmlDropdown += `<a href="javascript:void(0);" class="dropdown-filter-link" data-filter="${cat.slug}" onclick="filtrarPorCategoria('${cat.slug}', null, '${escapeHtmlPublic(cat.nombre)}')">${escapeHtmlPublic(cat.nombre)}</a>`;
        }
    });

    container.innerHTML = htmlTabs;

    // Si hay categorías que superan el límite, activamos el botón desplegable dinámico
    if (htmlDropdown !== '' && dropdownWrapper && dropdownMenu) {
        dropdownMenu.innerHTML = htmlDropdown;
        dropdownWrapper.style.display = 'block';
    } else if (dropdownWrapper) {
        dropdownWrapper.style.display = 'none';
    }
}

function toggleMenuCategoriasExtras() {
    const menu = document.getElementById('dropdownCategoriasMenu');
    if (menu) {
        menu.style.display = menu.style.display === 'block' ? 'none' : 'block';
    }
}

// Cerrar menú desplegable al hacer clic fuera
window.addEventListener('click', (e) => {
    if (!e.target.closest('.mobile-filters-dropdown')) {
        const menu = document.getElementById('dropdownCategoriasMenu');
        if (menu) menu.style.display = 'none';
    }
});

// 2. FETCH Y RENDER DE NOTICIAS
async function fetchAndRenderPublicNoticias() {
    try {
        const client = getSupabaseClient();
        if (!client) return;

        const featuredContainer = document.querySelector('.news-featured');
        const sidebarContainer = document.querySelector('.news-sidebar-grid');
        if (!featuredContainer || !sidebarContainer) return;

        const { data: noticias, error } = await client
            .from('noticias')
            .select(`
                id,
                titulo,
                resumen,
                cuerpo,
                fecha_publicacion,
                destacada,
                categorias (slug, nombre),
                imagenes (url),
                autores (
                    nombre,
                    biografia,
                    imagenes:foto_id (url)
                )
            `)
            .eq('publicado', true)
            .order('destacada', { ascending: false })
            .order('fecha_publicacion', { ascending: false });

        if (error) throw error;
        if (!noticias || noticias.length === 0) {
            featuredContainer.innerHTML = '<p>No hay noticias publicadas.</p>';
            sidebarContainer.innerHTML = '';
            return;
        }

        window.noticiasCargadas = noticias;

        // Render Noticia Principal (2/3)
        const principal = noticias[0];
        const fechaPrincipal = formatFecha(principal.fecha_publicacion);
        const imgPrincipal = principal.imagenes?.url || 'https://via.placeholder.com/600x350?text=Noticia';

        featuredContainer.innerHTML = `
            <article class="news-card news-card-featured" data-category="${principal.categorias?.slug || ''}" style="cursor: pointer;" onclick="openModalWithNews('${principal.id}')">
                <div class="news-card-image">
                    <img src="${imgPrincipal}" alt="${escapeHtmlPublic(principal.titulo)}" loading="lazy">
                </div>
                <div class="news-card-content">
                    <span class="news-badge">${escapeHtmlPublic(principal.categorias?.nombre || 'General')}</span>
                    <h3 class="news-card-title">${escapeHtmlPublic(principal.titulo)}</h3>
                    <p class="news-excerpt">${escapeHtmlPublic(principal.resumen)}</p>
                    <div class="news-meta">
                        <span class="news-author">Por ${escapeHtmlPublic(principal.autores?.nombre || 'Redacción')}</span>
                        <span class="news-date">${fechaPrincipal}</span>
                    </div>
                    <button class="news-link btn-open-modal" onclick="event.stopPropagation(); openModalWithNews('${principal.id}')">Leer más →</button>
                </div>
            </article>
        `;

        // Render Noticias Secundarias (1/3)
        const secundarias = noticias.slice(1);
        sidebarContainer.innerHTML = secundarias.map(item => {
            const fechaSec = formatFecha(item.fecha_publicacion);
            const imgSec = item.imagenes?.url || 'https://via.placeholder.com/300x180?text=Noticia';

            return `
                <article class="news-card news-card-compact" data-category="${item.categorias?.slug || ''}" style="cursor: pointer;" onclick="openModalWithNews('${item.id}')">
                    <div class="news-card-image-small">
                        <img src="${imgSec}" alt="${escapeHtmlPublic(item.titulo)}" loading="lazy">
                    </div>
                    <div class="news-card-content-small">
                        <span class="news-badge news-badge-small">${escapeHtmlPublic(item.categorias?.nombre || 'General')}</span>
                        <h4 class="news-card-title-small">${escapeHtmlPublic(item.titulo)}</h4>
                        <p class="news-meta-small">
                            <span class="news-author">Por ${escapeHtmlPublic(item.autores?.nombre || 'Redacción')}</span>
                            <span class="news-date">${fechaSec}</span>
                        </p>
                        <button class="news-link-small btn-open-modal" onclick="event.stopPropagation(); openModalWithNews('${item.id}')">Leer más →</button>
                    </div>
                </article>
            `;
        }).join('');

    } catch (error) {
        console.error('Error cargando noticias:', error);
    }
}

// 3. FILTRADO DINÁMICO POR CATEGORÍA
function filtrarPorCategoria(slugFilter, btnElement, nombrePersonalizado = null) {
    // Actualizar clases activas visuales en botones principales
    const tabButtons = document.querySelectorAll('.tab-button');
    tabButtons.forEach(btn => btn.classList.remove('tab-active'));

    if (btnElement) {
        btnElement.classList.add('tab-active');
    } else {
        // Si se seleccionó del menú desplegable, cambiamos el texto del botón trigger si se desea
        const triggerBtn = document.querySelector('.btn-filter-trigger');
        if (triggerBtn && nombrePersonalizado) {
            triggerBtn.innerHTML = ` ${nombrePersonalizado} ▾`;
        }
    }

    // Filtrar tarjetas en el DOM
    const newsCards = document.querySelectorAll('[data-category]');
    newsCards.forEach(card => {
        const cardCategory = card.getAttribute('data-category');
        const showAll = slugFilter === 'todos';
        const matchCategory = cardCategory === slugFilter;

        if (showAll || matchCategory) {
            card.style.display = '';
        } else {
            card.style.display = 'none';
        }
    });

    // Ocultar menú desplegable al hacer clic
    const menu = document.getElementById('dropdownCategoriasMenu');
    if (menu) menu.style.display = 'none';
}

// 4. MODAL Y UTILIDADES
function setupModalEvents() {
    const closeBtn = document.getElementById('closeNewsModal');
    const overlay = document.querySelector('.news-modal-overlay');

    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    if (overlay) overlay.addEventListener('click', closeModal);
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeModal();
    });
}

function openModalWithNews(id) {
    const noticia = window.noticiasCargadas.find(n => n.id.toString() === id.toString());
    if (!noticia) return;

    const modal = document.getElementById('newsDetailModal');
    const modalBody = document.getElementById('modalNewsBody');

    const fecha = formatFecha(noticia.fecha_publicacion);
    const imgUrl = noticia.imagenes?.url || 'https://via.placeholder.com/800x400?text=Noticia';
    
    const autorNombre = noticia.autores?.nombre || 'Redacción';
    const autorBio = noticia.autores?.biografia || 'Integrante de La Casa del Movimiento.';
    const autorFoto = noticia.autores?.imagenes?.url || 'https://via.placeholder.com/100?text=Autor';

    modalBody.innerHTML = `
        <span class="news-badge">${escapeHtmlPublic(noticia.categorias?.nombre || 'General')}</span>
        <h2 class="modal-news-title">${escapeHtmlPublic(noticia.titulo)}</h2>
        <p class="modal-news-date">Publicado el ${fecha}</p>
        
        <div class="modal-news-image">
            <img src="${imgUrl}" alt="${escapeHtmlPublic(noticia.titulo)}">
        </div>

        <div class="modal-news-text">
            <p class="modal-news-resumen"><strong>${escapeHtmlPublic(noticia.resumen)}</strong></p>
            <hr>
            <div class="modal-news-cuerpo">${noticia.cuerpo || 'Sin contenido adicional.'}</div>
        </div>

        <div class="author-footer-card">
            <img src="${autorFoto}" alt="${escapeHtmlPublic(autorNombre)}" class="author-avatar">
            <div class="author-info">
                <h4>${escapeHtmlPublic(autorNombre)}</h4>
                <p>${escapeHtmlPublic(autorBio)}</p>
            </div>
        </div>
    `;

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeModal() {
    const modal = document.getElementById('newsDetailModal');
    if (modal) modal.classList.remove('active');
    document.body.style.overflow = '';
}

function formatFecha(fechaStr) {
    if (!fechaStr) return '';
    return new Date(fechaStr).toLocaleDateString('es-ES', {
        day: '2-digit', month: 'long', year: 'numeric'
    });
}

function escapeHtmlPublic(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}