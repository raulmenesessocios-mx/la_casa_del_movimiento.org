/**
 * MODAL DE TALLERES - Abre/cierra detalles con los 5 bloques
 */

// Datos de los talleres (estructura con 5 bloques)
const workshopsData = {
    cartoneria: {
        hookTitle: "El Arte de dar Vida al Papel",
        hookSubtitle: "Transforma lo ordinario en algo extraordinario. La cartonería es mucho más que papel y engrudo; es la técnica que ha dado forma a la imaginación de México durante siglos.",
        hookImage: "https://via.placeholder.com/600x350?text=Cartonería",
        bloques2: [
            { icon: "🎭", text: "Alebrijes: Criaturas que desafían la lógica" },
            { icon: "🎭", text: "Máscaras: Para contar tus propias historias" },
            { icon: "🎭", text: "Figuras tradicionales: Un homenaje a nuestras raíces" }
        ],
        instructorName: "Profesor Jaime",
        instructorPhoto: "https://via.placeholder.com/150x150?text=Prof.+Jaime",
        instructorBio: "Maestro de cartonería con décadas de experiencia. Su enfoque se centra en el acompañamiento individual y la expresión personal.",
        paraQuien: "Para mentes curiosas, manos inquietas y cualquier persona que desee desconectarse del ruido digital para conectar con la satisfacción de crear algo desde cero.",
        horario: "Martes y Jueves, 4:00 PM - 6:00 PM",
        proximaSesion: "18 de Octubre, 2026"
    },
    pintura: {
        hookTitle: "El Lenguaje del Color",
        hookSubtitle: "No pintes lo que ves, pinta lo que sientes. El lienzo es un espacio para explorar posibilidades.",
        hookImage: "https://via.placeholder.com/600x350?text=Pintura",
        bloques2: [
            { icon: "🎨", text: "Domina los fundamentos: Composición, teoría del color" },
            { icon: "🎨", text: "Experimenta con texturas: Nuevas técnicas y materiales" },
            { icon: "🎨", text: "Desarrolla tu estilo: Descubre tu voz visual" }
        ],
        instructorName: "Profesor Jcos",
        instructorPhoto: "https://via.placeholder.com/150x150?text=Prof.+Jcos",
        instructorBio: "Artista y educador apasionado. Enseña a mirar, no solo a pintar.",
        paraQuien: "Para quienes sienten curiosidad por el color, para quienes necesitan desconectarse de la rutina y para quienes creen que el arte es un derecho, no un privilegio.",
        horario: "Lunes y Miércoles, 5:00 PM - 7:00 PM",
        proximaSesion: "21 de Octubre, 2026"
    },
    musica: {
        hookTitle: "Encuentra tu Propia Frecuencia",
        hookSubtitle: "La música no se explica, se siente. Y tú tienes algo que decir.",
        hookImage: "https://via.placeholder.com/600x350?text=Música",
        bloques2: [
            { icon: "🎵", text: "Técnica e Instrumento: Domina las herramientas" },
            { icon: "🎵", text: "Ensamble y Escucha: Toca con otros" },
            { icon: "🎵", text: "Improvisación y Composición: Crea tu propia música" }
        ],
        instructorName: "Blue Sky Music",
        instructorPhoto: "https://via.placeholder.com/150x150?text=Blue+Sky",
        instructorBio: "Colectivo musical colaborativo. Enseñan desde la técnica académica hasta la energía del escenario.",
        paraQuien: "Para los que siempre han querido tocar un instrumento, para quienes ya tocan pero necesitan un espacio donde 'jamsear' y crear.",
        horario: "Viernes y Sábados, 6:00 PM - 8:00 PM",
        proximaSesion: "25 de Octubre, 2026"
    },
    psicologia: {
        hookTitle: "Espacio de Bienestar",
        hookSubtitle: "Mover la mente para transformar tu realidad. El bienestar es integral.",
        hookImage: "https://via.placeholder.com/600x350?text=Psicología",
        bloques2: [
            { icon: "💚", text: "Gestión Emocional: Identifica y canaliza lo que sientes" },
            { icon: "💚", text: "Fortalecimiento del Autoestima: Reconoce tus capacidades" },
            { icon: "💚", text: "Habilidades de Comunicación: Mejora tus vínculos" }
        ],
        instructorName: "Psicóloga Sthephany Fontan",
        instructorPhoto: "https://via.placeholder.com/150x150?text=Psic.+Fany",
        instructorBio: "Profesional comprometida con la salud mental comunitaria. Enfoque empático, humano y libre de juicios.",
        paraQuien: "Para ti si buscas un lugar donde expresarte con libertad, herramientas para resolver conflictos y conectar con otros que, al igual que tú, buscan crecer y sanar.",
        horario: "Jueves, 7:00 PM - 8:30 PM",
        proximaSesion: "24 de Octubre, 2026"
    },
    "cafe-literario": {
        hookTitle: "Entre Letras y Aromas",
        hookSubtitle: "Porque los libros no se terminan de leer hasta que se comparten.",
        hookImage: "https://via.placeholder.com/600x350?text=Café+Literario",
        bloques2: [
            { icon: "📚", text: "Se analiza el subtexto: ¿Qué nos quiso decir el autor?" },
            { icon: "📚", text: "Se comparten perspectivas: Tu interpretación enriquece la de otros" },
            { icon: "📚", text: "Se construye comunidad: Los libros son el pretexto; la conexión es el resultado" }
        ],
        instructorName: "Maestra Marvel",
        instructorPhoto: "https://via.placeholder.com/150x150?text=Maestra+Marvel",
        instructorBio: "Curadora de este espacio con vasta experiencia y sensibilidad única. Hace que los textos más complejos se vuelvan cercanos.",
        paraQuien: "A lectores voraces, a quienes quieren retomar el hábito de la lectura, o a quienes simplemente buscan una tarde distinta rodeados de buena compañía.",
        horario: "Domingos, 11:00 AM - 1:00 PM",
        proximaSesion: "20 de Octubre, 2026"
    },
    "cine-club": {
        hookTitle: "Una Mirada a lo Profundo",
        hookSubtitle: "Donde la pantalla se apaga, la conversación comienza.",
        hookImage: "https://via.placeholder.com/600x350?text=Cine+Club",
        bloques2: [
            { icon: "🎬", text: "Analiza el subtexto: Descubre qué dicen los personajes más allá de sus palabras" },
            { icon: "🎬", text: "Debate en comunidad: Comparte cómo resonó la historia en tu realidad" },
            { icon: "🎬", text: "Explora la narrativa: Entiende el cine como herramienta de introspección" }
        ],
        instructorName: "Psicólogo Julio",
        instructorPhoto: "https://via.placeholder.com/150x150?text=Psic.+Julio",
        instructorBio: "Combina apreciación cinematográfica con análisis de conducta. Facilita diálogo enriquecedor tras cada función.",
        paraQuien: "A cinéfilos, curiosos, estudiantes de la mente y a cualquier persona que alguna vez haya salido de una película con el corazón acelerado.",
        horario: "Viernes, 8:00 PM - 10:00 PM",
        proximaSesion: "18 de Octubre, 2026"
    }
};

// Función para abrir modal
function openWorkshopModal(workshopId) {
    const data = workshopsData[workshopId];
    if (!data) return;

    // Llenar Bloque 1
    document.getElementById('modal-hook-title').textContent = data.hookTitle;
    document.getElementById('modal-hook-subtitle').textContent = data.hookSubtitle;
    document.getElementById('modal-hook-image').src = data.hookImage;

    // Llenar Bloque 2
    const bloque2Container = document.getElementById('modal-bloque-2');
    bloque2Container.innerHTML = '';
    data.bloques2.forEach(item => {
        const div = document.createElement('div');
        div.className = 'bloque-2-item';
        div.innerHTML = `
            <div class="bloque-2-icon">${item.icon}</div>
            <div class="bloque-2-text">${item.text}</div>
        `;
        bloque2Container.appendChild(div);
    });

    // Llenar Bloque 3
    document.getElementById('modal-instructor-name').textContent = data.instructorName;
    document.getElementById('modal-instructor-photo').src = data.instructorPhoto;
    document.getElementById('modal-instructor-bio').textContent = data.instructorBio;

    // Llenar Bloque 4
    document.getElementById('modal-para-quien').textContent = data.paraQuien;

    // Llenar Bloque 5
    document.getElementById('modal-horario').textContent = data.horario;
    document.getElementById('modal-proxima-sesion').textContent = data.proximaSesion;

    // Mostrar modal
    const modal = document.getElementById('workshop-modal');
    modal.classList.add('active');
    document.body.classList.add('no-scroll');
}

// Función para cerrar modal
function closeWorkshopModal() {
    const modal = document.getElementById('workshop-modal');
    modal.classList.remove('active');
    document.body.classList.remove('no-scroll');
}

// Event listeners
document.addEventListener('DOMContentLoaded', function() {
    // Botones para abrir modal
    document.querySelectorAll('.btn-workshop-open').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            const workshopId = this.getAttribute('data-workshop-id');
            openWorkshopModal(workshopId);
        });
    });

    // Botón para cerrar modal
    document.querySelector('.workshop-modal-close').addEventListener('click', closeWorkshopModal);

    // Cerrar modal al hacer clic en el backdrop
    document.querySelector('.workshop-modal-backdrop').addEventListener('click', closeWorkshopModal);

    // Cerrar modal con tecla ESC
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeWorkshopModal();
        }
    });
});