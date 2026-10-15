import { LitElement, html, css, svg, nothing } from '../core/lit.js';

/**
 * <ui-qr value="https://..." label="..."> · Código QR como Web Component.
 * EJEMPLO DE EXTENSIÓN: así se agrega una capacidad nueva sin tocar el resto del sitio.
 *  1. La librería (qrcode-generator, MIT, ~20 KB) se carga SOLO cuando se usa el componente.
 *  2. El QR se dibuja como SVG propio (sin innerHTML), siempre negro sobre blanco para
 *     que cualquier cámara lo lea, sin importar el tema claro u oscuro.
 * Atributos: value (texto o URL), label (texto alternativo), size (px), ecc = L | M | Q | H
 */
const QR_LIB = 'https://cdn.jsdelivr.net/npm/qrcode-generator@1.4.4/qrcode.js';
let libPromise = null;
function loadLib() {
  if (window.qrcode) return Promise.resolve(window.qrcode);
  if (!libPromise) {
    libPromise = new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = QR_LIB; s.async = true; s.crossOrigin = 'anonymous';
      s.onload = () => (window.qrcode ? resolve(window.qrcode) : reject(new Error('QR no disponible')));
      s.onerror = () => { libPromise = null; reject(new Error('No se pudo cargar la librería QR')); };
      document.head.appendChild(s);
    });
  }
  return libPromise;
}

export class UIQr extends LitElement {
  static properties = {
    value: { type: String }, label: { type: String }, size: { type: Number }, ecc: { type: String },
    _state: { state: true }, _path: { state: true }, _count: { state: true },
  };

  static styles = css`
    :host { display: inline-block; font-family: var(--font-body); }
    .box { display: grid; place-items: center; width: var(--qr-size); height: var(--qr-size); max-width: 100%; aspect-ratio: 1; background: #fff; border-radius: 10px; border: 1px solid var(--c-line); }
    svg { width: 100%; height: 100%; display: block; }
    .msg { padding: .75rem; text-align: center; font-size: .85rem; color: #333; }
    .spin { width: 28px; height: 28px; border-radius: 50%; border: 3px solid #d8e2dc; border-top-color: #1E6B4F; animation: r .8s linear infinite; margin: 0 auto .4rem; }
    @keyframes r { to { transform: rotate(360deg); } }
  `;

  constructor() { super(); this.value = ''; this.label = ''; this.size = 180; this.ecc = 'M'; this._state = 'idle'; this._path = ''; this._count = 0; }

  updated(changed) { if (changed.has('value') || changed.has('ecc')) this._generate(); }

  async _generate() {
    if (!this.value) { this._state = 'empty'; return; }
    this._state = 'loading';
    try {
      const qrcode = await loadLib();
      const qr = qrcode(0, this.ecc || 'M');
      qr.addData(this.value);
      qr.make();
      const n = qr.getModuleCount();
      let d = '';
      for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (qr.isDark(r, c)) d += `M${c} ${r}h1v1h-1z`;
      this._count = n; this._path = d; this._state = 'ready';
      this.dispatchEvent(new CustomEvent('ui-qr-ready', { bubbles: true, composed: true, detail: { value: this.value } }));
    } catch (err) {
      this._state = 'error';
      this.dispatchEvent(new CustomEvent('ui-qr-error', { bubbles: true, composed: true, detail: { message: err.message } }));
    }
  }

  render() {
    const q = 4; // zona de silencio estándar (4 módulos)
    const n = this._count + q * 2;
    return html`<div class="box" style="--qr-size:${this.size}px">
      ${this._state === 'ready' ? html`<svg viewBox="0 0 ${n} ${n}" role="img" aria-label=${this.label || `Código QR que abre: ${this.value}`} shape-rendering="crispEdges">
          ${svg`<rect width=${n} height=${n} fill="#fff"/><path transform="translate(${q} ${q})" d=${this._path} fill="#000"/>`}
        </svg>`
      : this._state === 'loading' ? html`<div class="msg" role="status"><div class="spin" aria-hidden="true"></div>Generando código…</div>`
      : this._state === 'error' ? html`<div class="msg" role="alert">No se pudo generar el QR. Revisa tu conexión e inténtalo de nuevo.</div>`
      : html`<div class="msg">Escribe un enlace para generar el código.</div>`}
    </div>${nothing}`;
  }
}
customElements.define('ui-qr', UIQr);
