let noticiasCargadas = [];

document.addEventListener('DOMContentLoaded', () => {
    fetchAndRenderPublicNoticias();
    setupTabFiltering();
    setupModalEvents();
});

function getSupabaseClient() {
    return window.dbClient || window.supabaseClient || window.supabase;
}

async function fetchAndRenderPublicNoticias() {
    try {
        const client = getSupabaseClient();
        if (!client) return;

        const featuredContainer = document.querySelector('.news-featured');
        const sidebarContainer = document.querySelector('.news-sidebar-grid');
        if (!featuredContainer || !sidebarContainer) return;

        // Traemos noticia + categoría + imagen portada + autor (con su biografía e imagen conectada)
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
            <article class="news-card news-card-featured" data-category="${principal.categorias?.slug || 'reflexiones'}">
                <div class="news-card-image">
                    <img src="${imgPrincipal}" alt="${principal.titulo}" loading="lazy">
                </div>
                <div class="news-card-content">
                    <span class="news-badge">${principal.categorias?.nombre || 'General'}</span>
                    <h3 class="news-card-title">${principal.titulo}</h3>
                    <p class="news-excerpt">${principal.resumen}</p>
                    <div class="news-meta">
                        <span class="news-author">Por ${principal.autores?.nombre || 'Redacción'}</span>
                        <span class="news-date">${fechaPrincipal}</span>
                    </div>
                    <button class="news-link btn-open-modal" data-id="${principal.id}">Leer más →</button>
                </div>
            </article>
        `;

        // Render Noticias Secundarias (1/3)
        const secundarias = noticias.slice(1);
        sidebarContainer.innerHTML = secundarias.map(item => {
            const fechaSec = formatFecha(item.fecha_publicacion);
            const imgSec = item.imagenes?.url || 'https://via.placeholder.com/300x180?text=Noticia';

            return `
                <article class="news-card news-card-compact" data-category="${item.categorias?.slug || 'reflexiones'}">
                    <div class="news-card-image-small">
                        <img src="${imgSec}" alt="${item.titulo}" loading="lazy">
                    </div>
                    <div class="news-card-content-small">
                        <span class="news-badge news-badge-small">${item.categorias?.nombre || 'General'}</span>
                        <h4 class="news-card-title-small">${item.titulo}</h4>
                        <p class="news-meta-small">
                            <span class="news-author">Por ${item.autores?.nombre || 'Redacción'}</span>
                            <span class="news-date">${fechaSec}</span>
                        </p>
                        <button class="news-link-small btn-open-modal" data-id="${item.id}">Leer más →</button>
                    </div>
                </article>
            `;
        }).join('');

    } catch (error) {
        console.error('Error cargando noticias:', error);
    }
}
// Lógica de apertura del Modal
function setupModalEvents() {
    const modal = document.getElementById('newsDetailModal');
    const closeBtn = document.getElementById('closeNewsModal');
    const overlay = document.querySelector('.news-modal-overlay');

    // Escuchar clics en los botones "Leer más"
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('btn-open-modal')) {
            const id = e.target.getAttribute('data-id');
            openModalWithNews(id);
        }
    });

    // Cerrar modal
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
    
    // Extracción de datos del autor
    const autorNombre = noticia.autores?.nombre || 'Redacción';
    const autorBio = noticia.autores?.biografia || 'Integrante de La Casa del Movimiento.';
    const autorFoto = noticia.autores?.imagenes?.url || 'https://via.placeholder.com/100?text=Autor';

    modalBody.innerHTML = `
        <span class="news-badge">${noticia.categorias?.nombre || 'General'}</span>
        <h2 class="modal-news-title">${noticia.titulo}</h2>
        <p class="modal-news-date">Publicado el ${fecha}</p>
        
        <div class="modal-news-image">
            <img src="${imgUrl}" alt="${noticia.titulo}">
        </div>

        <div class="modal-news-text">
            <p class="modal-news-resumen"><strong>${noticia.resumen}</strong></p>
            <hr>
            <div class="modal-news-cuerpo">${noticia.cuerpo || 'Sin contenido adicional.'}</div>
        </div>

        <!-- TARJETA DEL AUTOR AL FINAL -->
        <div class="author-footer-card">
            <img src="${autorFoto}" alt="${autorNombre}" class="author-avatar">
            <div class="author-info">
                <h4>${autorNombre}</h4>
                <p>${autorBio}</p>
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

function setupTabFiltering() {
    const tabButtons = document.querySelectorAll('.tab-button');

    tabButtons.forEach(button => {
        button.addEventListener('click', function() {
            const filterValue = this.getAttribute('data-filter');

            tabButtons.forEach(btn => btn.classList.remove('tab-active'));
            this.classList.add('tab-active');

            const newsCards = document.querySelectorAll('[data-category]');
            newsCards.forEach(card => {
                const cardCategory = card.getAttribute('data-category');
                const showAll = filterValue === 'todos';
                const matchCategory = cardCategory.includes(filterValue);

                if (showAll || matchCategory) {
                    card.style.display = '';
                } else {
                    card.style.display = 'none';
                }
            });
        });
    });
}