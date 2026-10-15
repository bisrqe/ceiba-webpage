// Estado global mínimo, sin dependencias. Los componentes se suscriben con StoreController.
// Persistencia: SOLO si la persona acepta en el aviso de almacenamiento (consentimiento).

const KEYS = { consent: 'ceiba.consent.v1', prefs: 'ceiba.prefs.v1', data: 'ceiba.data.v1' };
const VIEWS = ['inicio', 'nosotros', 'programas', 'diagnostico', 'iniciativas', 'indicadores', 'calendario', 'testimonios', 'participa'];

function readLS(key) { try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : null; } catch { return null; } }
function writeLS(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch { return false; } }
function removeLS(key) { try { localStorage.removeItem(key); } catch { /* sin acceso */ } }

class Store extends EventTarget {
  constructor() {
    super();
    const consent = readLS(KEYS.consent);
    const allowed = consent === 'accepted';
    const prefs = allowed ? readLS(KEYS.prefs) || {} : {};
    const data = allowed ? readLS(KEYS.data) || {} : {};
    const hashView = (location.hash || '').replace('#', '');
    this.state = {
      view: VIEWS.includes(hashView) ? hashView : 'inicio',
      category: 'todas',
      level: '',
      profile: '',
      simple: false,
      contrast: false,
      reduceMotion: false,
      fontScale: 1,
      visited: [],
      results: {},
      idea: { text: '', sector: '', subtype: '' },
      consent,
      ...prefs,
      ...data,
    };
    if (!this.state.visited.includes(this.state.view)) this.state.visited = [...this.state.visited, this.state.view];
    this.applyGlobals();
  }

  get views() { return VIEWS; }

  set(patch) {
    Object.assign(this.state, patch);
    this.persist();
    this.applyGlobals();
    this.dispatchEvent(new CustomEvent('change', { detail: patch }));
  }

  saveResult(diagId, moment, payload) {
    const results = structuredClone(this.state.results || {});
    results[diagId] = results[diagId] || {};
    results[diagId][moment] = { ...payload, date: new Date().toISOString() };
    this.set({ results });
  }

  setConsent(value) {
    this.state.consent = value;
    writeLS(KEYS.consent, value); // guardar la decisión es estrictamente necesario para no volver a preguntar
    if (value !== 'accepted') { removeLS(KEYS.prefs); removeLS(KEYS.data); }
    this.set({});
  }

  clearAll() {
    Object.values(KEYS).forEach(removeLS);
    this.set({ results: {}, idea: { text: '', sector: '', subtype: '' }, visited: [this.state.view], level: '', profile: '', consent: null });
  }

  persist() {
    if (this.state.consent !== 'accepted') return;
    const { simple, contrast, reduceMotion, fontScale, level, profile, visited, category, results, idea } = this.state;
    writeLS(KEYS.prefs, { simple, contrast, reduceMotion, fontScale, level, profile, visited, category });
    writeLS(KEYS.data, { results, idea });
  }

  applyGlobals() {
    const root = document.documentElement;
    root.style.fontSize = `${Math.round(this.state.fontScale * 100)}%`;
    if (this.state.contrast) root.dataset.contrast = 'high'; else delete root.dataset.contrast;
    if (this.state.reduceMotion) root.dataset.motion = 'reduce'; else delete root.dataset.motion;
  }
}

export const store = new Store();

// Controlador reactivo de Lit: re-renderiza el componente cuando cambia el estado.
export class StoreController {
  constructor(host) {
    this.host = host;
    this._onChange = () => host.requestUpdate();
    host.addController(this);
  }
  hostConnected() { store.addEventListener('change', this._onChange); }
  hostDisconnected() { store.removeEventListener('change', this._onChange); }
}
