import { LitElement, html, css } from '../core/lit.js';
import { icon } from '../core/icons.js';

/**
 * <ui-toast-stack> · Pila de notificaciones emergentes (feedback de acciones).
 * Uso desde cualquier parte: toast('Mensaje', 'ok' | 'info' | 'warn' | 'bad')
 * Se anuncian a lectores de pantalla mediante aria-live.
 */
const ICONS = { ok: 'check', info: 'info', warn: 'alert', bad: 'alert' };

export class UIToastStack extends LitElement {
  static properties = { _items: { state: true } };

  static styles = css`
    :host { position: fixed; z-index: 90; right: 16px; bottom: calc(16px + env(safe-area-inset-bottom, 0px));
      display: flex; flex-direction: column; gap: .6rem; width: min(420px, calc(100vw - 32px)); pointer-events: none; font-family: var(--font-body); }
    .t { pointer-events: auto; display: flex; gap: .75rem; align-items: flex-start; padding: .85rem .9rem .85rem 1rem; border-radius: var(--radius-m);
      background: var(--c-ink); color: var(--c-bg); box-shadow: var(--shadow-2); animation: in var(--dur-slow) cubic-bezier(.2,.9,.3,1.2); border-left: 6px solid var(--c-sky); }
    .t.ok { border-left-color: var(--c-ok); } .t.warn { border-left-color: var(--c-accent); } .t.bad { border-left-color: var(--c-bad); }
    .t p { margin: 0; flex: 1; line-height: 1.4; }
    .x { all: unset; cursor: pointer; display: grid; place-items: center; width: 32px; height: 32px; border-radius: 50%; margin: -.3rem -.2rem 0 0; }
    .x:focus-visible { outline: 3px solid var(--c-accent); }
    @keyframes in { from { opacity: 0; transform: translateY(12px); } }
    @media (max-width: 600px) { :host { left: 16px; right: 16px; width: auto; } }
  `;

  constructor() { super(); this._items = []; this._id = 0; this._on = (e) => this.push(e.detail); }
  connectedCallback() { super.connectedCallback(); window.addEventListener('ceiba-toast', this._on); }
  disconnectedCallback() { window.removeEventListener('ceiba-toast', this._on); super.disconnectedCallback(); }

  push({ message, type = 'info', timeout = 4500 }) {
    const id = ++this._id;
    this._items = [...this._items.slice(-2), { id, message, type }];
    if (timeout) setTimeout(() => this.dismiss(id), timeout);
  }
  dismiss(id) { this._items = this._items.filter((t) => t.id !== id); }

  render() {
    return html`<div role="status" aria-live="polite" aria-atomic="false" style="display:contents">
      ${this._items.map((t) => html`<div class="t ${t.type}">
        ${icon(ICONS[t.type] || 'info')}
        <p>${t.message}</p>
        <button class="x" aria-label="Cerrar notificación" @click=${() => this.dismiss(t.id)}>${icon('close', 18)}</button>
      </div>`)}
    </div>`;
  }
}
customElements.define('ui-toast-stack', UIToastStack);
