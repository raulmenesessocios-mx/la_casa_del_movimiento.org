/**
 * TABS INTERACTIVOS - VERSIÓN OPTIMIZADA
 * Usa classList para mejor performance
 */

document.addEventListener('DOMContentLoaded', function() {
    const tabButtons = document.querySelectorAll('.tab-button');
    const newsCards = document.querySelectorAll('[data-category]');

    tabButtons.forEach(button => {
        button.addEventListener('click', function() {
            const filterValue = this.getAttribute('data-filter');

            // Actualizar tab activo
            tabButtons.forEach(btn => btn.classList.remove('tab-active'));
            this.classList.add('tab-active');

            // Filtrar tarjetas
            newsCards.forEach(card => {
                const cardCategory = card.getAttribute('data-category');
                const shouldShow = filterValue === 'todos' || cardCategory === filterValue;

                if (shouldShow) {
                    card.classList.add('news-visible');
                    card.classList.remove('news-hidden');
                } else {
                    card.classList.add('news-hidden');
                    card.classList.remove('news-visible');
                }
            });
        });
    });
});