/**
 * EVENTOS - Interacción Agenda + Destacado + Formulario
 */

document.addEventListener('DOMContentLoaded', function() {
    
    // ========================================
    // AGENDA ITEMS - MOSTRAR EVENTO DESTACADO
    // ========================================
    const agendaItems = document.querySelectorAll('.agenda-item');
    
    agendaItems.forEach(item => {
        item.addEventListener('click', function() {
            const eventId = this.getAttribute('data-event-id');
            
            // Actualizar estado visual de agenda
            agendaItems.forEach(i => i.classList.remove('agenda-item-active'));
            this.classList.add('agenda-item-active');
            
            // Mostrar evento destacado correspondiente
            const allFeaturedEvents = document.querySelectorAll('.featured-event');
            allFeaturedEvents.forEach(event => event.style.display = 'none');
            
            const selectedEvent = document.getElementById(`featured-${eventId}`);
            if (selectedEvent) {
                selectedEvent.style.display = 'block';
            }
        });
    });

    // ========================================
    // FORMULARIO DE CONTACTO
    // ========================================
    const contactForm = document.getElementById('contact-form');
    
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const name = document.getElementById('name').value;
            const email = document.getElementById('email').value;
            const message = document.getElementById('message').value;
            
            // Validación básica
            if (name.trim() === '' || email.trim() === '' || message.trim() === '') {
                alert('Por favor completa todos los campos');
                return;
            }
            
            // Email básico validation
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                alert('Por favor ingresa un correo válido');
                return;
            }
            
            // Aquí iría la integración con WordPress / servicio de email
            console.log('Formulario enviado:', { name, email, message });
            
            // Feedback visual
            alert('¡Gracias por tu interés! Nos pondremos en contacto pronto.');
            contactForm.reset();
        });
    }

    // ========================================
    // SMOOTH SCROLL PARA BOTONES "Quiero Asistir"
    // ========================================
    document.querySelectorAll('a[href="#contacto"]').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const contactSection = document.getElementById('contacto');
            if (contactSection) {
                contactSection.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });
});