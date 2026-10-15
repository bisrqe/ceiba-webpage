import { store } from './store.js';

// ---- Navegación (hash simple: #inicio, #programas, ...) -------------------
export function navigate(view, { anchor = '', category = '' } = {}) {
  if (!store.views.includes(view)) view = 'inicio';
  const visited = store.state.visited.includes(view) ? store.state.visited : [...store.state.visited, view];
  const patch = { view, visited };
  if (category) patch.category = category;
  store.set(patch);
  if (location.hash.replace('#', '') !== view) {
    try { history.pushState(null, '', `#${view}`); } catch { location.hash = view; }
  }
  window.dispatchEvent(new CustomEvent('ceiba-navigated', { detail: { view, anchor } }));
}

// ---- Notificaciones -----------------------------------------------------------
// type: 'ok' | 'info' | 'warn' | 'bad'
export function toast(message, type = 'info', timeout = 4500) {
  window.dispatchEvent(new CustomEvent('ceiba-toast', { detail: { message, type, timeout } }));
}

// ---- Ventanas legales -----------------------------------------------------------
export function openLegal(id) {
  window.dispatchEvent(new CustomEvent('ceiba-legal', { detail: { id } }));
}

// ---- Lectura en voz alta (API nativa del navegador, sin terceros) ---------------
let speaking = false;
export function speak(text) {
  if (!('speechSynthesis' in window)) { toast('Tu navegador no permite la lectura en voz alta.', 'warn'); return; }
  if (speaking) { window.speechSynthesis.cancel(); speaking = false; toast('Lectura detenida.', 'info', 2500); return; }
  const clean = (text || '').replace(/\s+/g, ' ').trim();
  if (!clean) return;
  const u = new SpeechSynthesisUtterance(clean);
  u.lang = 'es-MX';
  u.rate = store.state.simple ? 0.9 : 1;
  u.onend = () => { speaking = false; };
  u.onerror = () => { speaking = false; };
  speaking = true;
  window.speechSynthesis.speak(u);
  toast('Leyendo en voz alta. Presiona «Escuchar» de nuevo para detener.', 'info', 3500);
}

// ---- Portapapeles --------------------------------------------------------------
export async function copyText(text, okMsg = 'Copiado al portapapeles.') {
  try {
    await navigator.clipboard.writeText(text);
    toast(okMsg, 'ok', 2500);
    return true;
  } catch {
    toast('No se pudo copiar automáticamente. Selecciona el texto y cópialo manualmente.', 'warn');
    return false;
  }
}

// ---- Texto --------------------------------------------------------------------
export const normalize = (s) => (s || '').toString().normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

export function formatDate(iso) {
  try { return new Date(iso).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' }); } catch { return iso; }
}
