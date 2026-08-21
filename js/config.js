/**
 * config.js — Configuración global del frontend
 * IMPORTANTE: reemplace API_URL con la URL /exec de su implementación
 * de Google Apps Script (ver backend/Code.gs y docs/manual.md).
 */

const API_URL = 'https://script.google.com/macros/s/AKfycbzpm8ZPoPPxwvPdCcvlPKyxxz7UICcGBPK8uSCP5eIq3hqUDzd2E4afhTQTluOKYOTqPA/exec';

/**
 * Llama a la API de Apps Script. Usa POST + text/plain para evitar
 * problemas de preflight CORS con Apps Script.
 */
async function llamarAPI(action, datos = {}) {
  const token = localStorage.getItem('tic_token') || '';
  const cuerpo = Object.assign({ action, token }, datos);

  const respuesta = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(cuerpo)
  });

  if (!respuesta.ok) {
    throw new Error('Error de red al contactar el servidor (' + respuesta.status + ').');
  }

  const json = await respuesta.json();
  if (!json.ok) {
    throw new Error(json.error || 'Ocurrió un error inesperado.');
  }
  return json;
}

/** Convierte un archivo <input type="file"> a Base64 para subirlo como evidencia */
function archivoABase64(file) {
  return new Promise((resolve, reject) => {
    const lector = new FileReader();
    lector.onload = () => resolve(lector.result.split(',')[1]);
    lector.onerror = () => reject(new Error('No se pudo leer el archivo.'));
    lector.readAsDataURL(file);
  });
}

/** Protege una página: si no hay sesión, redirige al login */
function exigirSesion() {
  const token = localStorage.getItem('tic_token');
  const usuario = localStorage.getItem('tic_usuario');
  if (!token || !usuario) {
    window.location.href = 'index.html';
    return null;
  }
  return JSON.parse(usuario);
}

function cerrarSesion() {
  const token = localStorage.getItem('tic_token');
  if (token) llamarAPI('logout').catch(() => {});
  localStorage.removeItem('tic_token');
  localStorage.removeItem('tic_usuario');
  window.location.href = 'index.html';
}

function mostrarToast(mensaje, tipo = '') {
  let toast = document.getElementById('toast-global');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast-global';
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = mensaje;
  toast.className = 'toast mostrar ' + tipo;
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => toast.classList.remove('mostrar'), 3200);
}

function badgeEstado(estado) {
  const mapa = {
    'Programada': 'azul', 'En ejecución': 'amarillo', 'Suspendida': 'gris', 'Cerrada': 'verde',
    'Abierto': 'rojo', 'En proceso': 'amarillo', 'Cerrado': 'verde', 'Vencido': 'rojo',
    'Pendiente': 'gris', 'Verificado': 'verde', 'Rechazado': 'rojo',
    'Alto': 'rojo', 'Medio': 'amarillo', 'Bajo': 'verde'
  };
  const clase = mapa[estado] || 'gris';
  return '<span class="badge ' + clase + '">' + estado + '</span>';
}

function escaparHTML(texto) {
  const div = document.createElement('div');
  div.textContent = texto == null ? '' : texto;
  return div.innerHTML;
}

/** Marca: sello de verificación (SVG, sustituye cualquier emoji) */
const SELLO_SVG = `
  <svg class="sello" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="20" cy="20" r="18.5" stroke="currentColor" stroke-width="1.4" opacity=".55"/>
    <circle cx="20" cy="20" r="13.5" stroke="currentColor" stroke-width="1.4"/>
    <path d="M14 20.2L18 24.2L26.5 15.5" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`;

/** Íconos de navegación (trazo, sin emoji) */
const ICONOS_NAV = {
  dashboard: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7.5" height="9" rx="1.3"/><rect x="13.5" y="3" width="7.5" height="5.5" rx="1.3"/><rect x="13.5" y="11.5" width="7.5" height="9.5" rx="1.3"/><rect x="3" y="15" width="7.5" height="6" rx="1.3"/></svg>',
  auditorias: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="3.5" width="14" height="18" rx="1.6"/><path d="M9 3.5V2.5C9 2 9.4 1.6 9.9 1.6h4.2c.5 0 .9.4.9.9v1"/><path d="M8.5 10h7M8.5 13.3h7M8.5 16.6h4.5"/></svg>',
  checklist: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M9 5h10.5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V9"/><path d="M3.5 8.5l1.7 1.7L8.5 6.8"/><path d="M12.5 8h6M12.5 12.5h6M9 12.5h.01M12.5 17h6M9 17h.01"/></svg>',
  hallazgos: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3.5 21.5 20h-19L12 3.5Z"/><path d="M12 10v4.2M12 17.2h.01"/></svg>',
  seguimiento: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.2"/><circle cx="12" cy="12" r=".6" fill="currentColor"/></svg>'
};

/** Inyecta el sidebar de navegación común en todas las páginas internas */
function renderSidebar(paginaActiva) {
  const usuario = JSON.parse(localStorage.getItem('tic_usuario') || '{}');
  const enlaces = [
    { href: 'dashboard.html', icono: ICONOS_NAV.dashboard, texto: 'Dashboard' },
    { href: 'auditorias.html', icono: ICONOS_NAV.auditorias, texto: 'Auditorías' },
    { href: 'checklist.html', icono: ICONOS_NAV.checklist, texto: 'Lista de verificación' },
    { href: 'hallazgos.html', icono: ICONOS_NAV.hallazgos, texto: 'Hallazgos' },
    { href: 'seguimiento.html', icono: ICONOS_NAV.seguimiento, texto: 'Plan de acción' }
  ];

  const html = `
    <aside class="sidebar">
      <div class="sidebar__brand">
        ${SELLO_SVG}
        <div>
          <h1>Auditoría TIC</h1>
          <span>Control &amp; cumplimiento</span>
        </div>
      </div>
      <nav class="sidebar__nav">
        ${enlaces.map(e => `<a href="${e.href}" class="${paginaActiva === e.href ? 'activo' : ''}">
              ${e.icono} ${e.texto}
            </a>`).join('')}
      </nav>
      <div class="sidebar__user">
        <strong>${escaparHTML(usuario.nombre || 'Usuario')}</strong>
        ${escaparHTML(usuario.rol || '')}
        <button onclick="cerrarSesion()">Cerrar sesión</button>
      </div>
    </aside>`;

  document.getElementById('sidebar-slot').outerHTML = html;
}
