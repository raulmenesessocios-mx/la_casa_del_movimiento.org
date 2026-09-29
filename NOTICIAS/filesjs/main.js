
if (typeof headerStyle === 'undefined') {
  var headerStyle = "color: red; font-size: 36px; font-weight: bold; -webkit-text-stroke: 1px black;";
  var bodyStyle = "font-size: 14px; font-weight: bold;";

  console.log("%c¡Detente!", headerStyle);
  console.log(
    "%cEsta función del navegador está pensada para desarrolladores. Si alguien te pidió copiar y pegar código aquí, se trata de una estafa.",
    bodyStyle
  );
}



// noticias/filesjs/main.js

class CustomModal {
  constructor() {
    this.initStyles();
  }

  // Injecta estilos minimalistas y responsivos en la página
  initStyles() {
    if (document.getElementById('custom-modal-styles')) return;
    const style = document.createElement('style');
    style.id = 'custom-modal-styles';
    style.textContent = `
      .title-page{
        color: #9E1B22;
      }
      .cm-overlay {
        position: fixed;
        top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(0, 0, 0, 0.5);
        display: flex; align-items: center; justify-content: center;
        z-index: 99999; opacity: 0; transition: opacity 0.2s ease;
      }
      .cm-overlay.cm-active { opacity: 1; }
      .cm-box {
        background: #fff; border-radius: 8px; width: 90%; max-width: 420px;
        padding: 20px; box-shadow: 0 10px 25px rgba(0,0,0,0.2);
        transform: translateY(-20px); transition: transform 0.2s ease;
        position: relative; font-family: system-ui, sans-serif;
      }
      .cm-overlay.cm-active .cm-box { transform: translateY(0); }
      .cm-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
      .cm-header-2 { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
      .cm-title { font-size: 1.1rem; font-weight: 600; color: #333; margin: 0; }
      .cm-close {
        background: none; border: none; font-size: 1.4rem; cursor: pointer;
        color: #888; line-height: 1; padding: 0 4px;
      }
      .cm-close:hover { color: #000; }
      .cm-body { font-size: 0.95rem; color: #555; margin-bottom: 20px; line-height: 1.4; }
      .cm-footer { display: flex; justify-content: flex-end; gap: 10px; }
      .cm-btn {
        padding: 8px 16px; border-radius: 6px; border: none;
        cursor: pointer; font-size: 0.9rem; font-weight: 500;
      }
      .cm-btn-primary { background: #2563eb; color: #fff; }
      .cm-btn-primary:hover { background: #1d4ed8; }
      .cm-btn-secondary { background: #e5e7eb; color: #374151; }
      .cm-btn-secondary:hover { background: #d1d5db; }
    `;
    document.head.appendChild(style);
  }

  // Estructura base para renderizar el modal en el DOM
  _render({ title, message, type }) {
    return new Promise((resolve) => {
      const overlay = document.createElement('div');
      overlay.className = 'cm-overlay';

      const isConfirm = type === 'confirm';

      overlay.innerHTML = `
        <div class="cm-box">
          <div class="cm-heder">
            <h2 class="title-page">La Casa del Mvimento</h2>
            <button class="cm-close" aria-label="Cerrar">&times;</button>
          </div>
          <div class="cm-header-2">
            <h3 class="cm-title">${title}</h3>
          </div>
          <div class="cm-body">${message}</div>
          <div class="cm-footer">
            ${isConfirm ? `<button class="cm-btn cm-btn-secondary cm-cancel">Cancelar</button>` : ''}
            <button class="cm-btn cm-btn-primary cm-accept">Aceptar</button>
          </div>
        </div>
      `;

      document.body.appendChild(overlay);
      
      // Forzar un reflow para activar animación CSS
      setTimeout(() => overlay.classList.add('cm-active'), 10);

      const close = (value) => {
        overlay.classList.remove('cm-active');
        setTimeout(() => {
          overlay.remove();
          resolve(value);
        }, 200);
      };

      // Eventos
      overlay.querySelector('.cm-accept').addEventListener('click', () => close(true));
      overlay.querySelector('.cm-close').addEventListener('click', () => close(false));
      
      if (isConfirm) {
        overlay.querySelector('.cm-cancel').addEventListener('click', () => close(false));
      }
    });
  }

  // Método Alerta (solo Aceptar o Tache = resuelve true)
  alert(message, title = 'Aviso') {
    return this._render({ title, message, type: 'alert' });
  }

  // Método Confirmación (Aceptar = true | Cancelar/Tache = false)
  confirm(message, title = 'Confirmación') {
    return this._render({ title, message, type: 'confirm' });
  }
}

// Instancia global disponible en todo el proyecto
const Modal = new CustomModal();