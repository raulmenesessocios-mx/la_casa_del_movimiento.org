

document.addEventListener('DOMContentLoaded', function() {
    loadPublicEventos();
    loadHistorialEventos();
});

// 1. Cargar eventos próximos (Agenda + Destacado)
async function loadPublicEventos() {
    const agendaContainer = document.getElementById('agendaListContainer');
    const featuredContainer = document.getElementById('featuredEventContainer');

    if (!agendaContainer || !featuredContainer) return;

    try {
        const { data: eventos, error } = await window.dbClient
            .from('eventos')
            .select(`
                id,
                titulo,
                descripcion,
                fecha_evento,
                hora_inicio,
                ubicacion,
                estado,
                imagenes ( url )
            `)
            .eq('estado', 'proximo')
            .order('fecha_evento', { ascending: true });

        if (error) throw error;

        if (!eventos || eventos.length === 0) {
            agendaContainer.innerHTML = '<p class="cell-empty-state">No hay eventos próximos en este momento.</p>';
            featuredContainer.innerHTML = '<div class="featured-event"><p>Mantente atento a nuestras próximas convocatorias.</p></div>';
            return;
        }

        let agendaHTML = '';
        let featuredHTML = '';

        eventos.forEach((ev, index) => {
            const fechaObj = new Date(ev.fecha_evento);
            const dia = fechaObj.toLocaleDateString('es-MX', { day: '2-digit' });
            const mes = fechaObj.toLocaleDateString('es-MX', { month: 'short' }).toUpperCase().replace('.', '');
            const fechaLarga = fechaObj.toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' });
            
            const isActive = index === 0 ? 'agenda-item-active' : '';
            const displayStyle = index === 0 ? 'block' : 'none';
            const imageUrl = ev.imagenes?.url || 'https://via.placeholder.com/500x350?text=La+Casa+del+Movimiento';

            agendaHTML += `
                <div class="agenda-item ${isActive}" data-event-target="${ev.id}">
                    <div class="agenda-date">
                        <span class="agenda-day">${dia}</span>
                        <span class="agenda-month">${mes}</span>
                    </div>
                    <div class="agenda-info">
                        <h4>${ev.titulo}</h4>
                        <p class="agenda-time">${ev.hora_inicio || 'Por definir'}</p>
                    </div>
                    <span class="agenda-arrow">→</span>
                </div>
            `;

            featuredHTML += `
                <div class="featured-event" id="featured-${ev.id}" style="display: ${displayStyle};">
                    <div class="event-featured-image">
                        <img src="${imageUrl}" alt="${ev.titulo}" loading="lazy">
                    </div>
                    <div class="event-featured-content">
                        <h3 class="event-featured-title">${ev.titulo}</h3>
                        <div class="event-featured-meta">
                            <span class="event-meta-item">📅 ${fechaLarga}</span>
                            <span class="event-meta-item">🕐 ${ev.hora_inicio || 'Por definir'}</span>
                            <span class="event-meta-item">📍 ${ev.ubicacion || 'Juárez 86, Tizayuca'}</span>
                        </div>
                        <p class="event-featured-description">${ev.descripcion}</p>
                        <a href="#contacto" class="btn btn-cta">Quiero Asistir</a>
                    </div>
                </div>
            `;
        });

        agendaContainer.innerHTML = agendaHTML;
        featuredContainer.innerHTML = featuredHTML;

        initAgendaInteractivity();

    } catch (error) {
        console.error('Error al cargar eventos públicos:', error);
        agendaContainer.innerHTML = '<p class="cell-empty-state">Error al cargar la agenda.</p>';
    }
}

// 2. Cargar eventos realizados (Galería Historial Grid Masonry)
async function loadHistorialEventos() {
    const historialContainer = document.getElementById('historialEventosContainer');
    if (!historialContainer) return;

    try {
        const { data: realizados, error } = await window.dbClient
            .from('eventos')
            .select(`
                id,
                titulo,
                fecha_evento,
                imagenes ( url )
            `)
            .eq('estado', 'realizado')
            .order('fecha_evento', { ascending: false }); // Los más recientes primero

        if (error) throw error;

        if (!realizados || realizados.length === 0) {
            historialContainer.innerHTML = '<p class="cell-empty-state">Pronto agregaremos la galería de nuestros eventos pasados.</p>';
            return;
        }

        let historialHTML = '';

        realizados.forEach((ev, index) => {
            const fechaObj = new Date(ev.fecha_evento);
            const mesAnio = fechaObj.toLocaleDateString('es-MX', { month: 'long', year: 'numeric' });
            const mesAnioFormateado = mesAnio.charAt(0).toUpperCase() + mesAnio.slice(1);
            const imageUrl = ev.imagenes?.url || 'https://via.placeholder.com/400x300?text=Evento+Realizado';

            // Hacemos que cada cierto elemento (ej. el primero) tenga la clase large para mantener el diseño Masonry
            const isLarge = (index % 5 === 0) ? 'event-history-card-large' : '';

            historialHTML += `
                <div class="event-history-card ${isLarge}">
                    <img src="${imageUrl}" alt="${ev.titulo}" class="history-image" loading="lazy">
                    <div class="history-overlay">
                        <h4 class="history-card-title">${ev.titulo}</h4>
                        <p class="history-card-date">${mesAnioFormateado}</p>
                    </div>
                </div>
            `;
        });

        historialContainer.innerHTML = historialHTML;

    } catch (error) {
        console.error('Error al cargar historial de eventos:', error);
        historialContainer.innerHTML = '<p>Error al cargar el historial.</p>';
    }
}

function initAgendaInteractivity() {
    const agendaItems = document.querySelectorAll('.agenda-item');
    
    agendaItems.forEach(item => {
        item.addEventListener('click', function() {
            const eventId = this.getAttribute('data-event-target');
            
            agendaItems.forEach(i => i.classList.remove('agenda-item-active'));
            this.classList.add('agenda-item-active');
            
            const allFeaturedEvents = document.querySelectorAll('.featured-event');
            allFeaturedEvents.forEach(event => event.style.display = 'none');
            
            const selectedEvent = document.getElementById(`featured-${eventId}`);
            if (selectedEvent) {
                selectedEvent.style.display = 'block';
            }
        });
    });

    document.querySelectorAll('a[href="#contacto"]').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const contactSection = document.getElementById('contacto');
            if (contactSection) {
                contactSection.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });
}