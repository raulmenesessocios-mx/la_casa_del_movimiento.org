const observerOptions = {
            threshold: 0.5, // Activa cuando el 50% de la sección es visible
            rootMargin: '0px'
        };

        const animateCounters = () => {
            const counters = document.querySelectorAll('.metric-number');
            
            counters.forEach(counter => {
                const target = parseInt(counter.getAttribute('data-target'));
                const duration = 2000; // 2 segundos de animación
                const start = 0;
                const increment = target / (duration / 50); // Incremento por cada 50ms

                let current = start;

                const timer = setInterval(() => {
                    current += increment;
                    if (current >= target) {
                        counter.textContent = target;
                        clearInterval(timer);
                    } else {
                        counter.textContent = Math.floor(current);
                    }
                }, 50);
            });
        };

        // Observador para activar contadores solo cuando son visibles
        const metricsSection = document.querySelector('.about-metrics');
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && !metricsSection.classList.contains('animated')) {
                    animateCounters();
                    metricsSection.classList.add('animated');
                }
            });
        }, observerOptions);

        observer.observe(metricsSection);

        /**
         * BONUS: Smooth scroll para enlaces de navegación
         */
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                const target = document.querySelector(this.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({ behavior: 'smooth' });
                }
            });
        });