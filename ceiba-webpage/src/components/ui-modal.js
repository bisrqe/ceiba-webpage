import { LitElement, html, css } from '../core/lit.js';
import { icon } from '../core/icons.js';

/**
 * <ui-modal> · Ventana modal basada en <dialog> nativo (trampa de foco y Esc incluidos).
 * Atributos: open, heading     Evento: ui-close
 */
export class UIModal extends LitElement {
  static properties = { open: { type: Boolean, reflect: true }, heading: { type: String } };

  static styles = css`
    dialog { width: min(760px, calc(100vw - 32px)); max-height: min(86vh, 900px); padding: 0; border: 1px solid var(--c-line); border-radius: var(--radius-l);
      background: var(--c-surface); color: var(--c-ink); box-shadow: var(--shadow-2); font-family: var(--font-body); }
    dialog::backdrop { background: rgb(8 18 13 / .55); }
    header { position: sticky; top: 0; display: flex; align-items: center; justify-content: space-between; gap: 1rem; padding: 1rem 1.25rem;
      background: var(--c-surface); border-bottom: 1px solid var(--c-line); z-index: 1; }
    h2 { margin: 0; font-family: var(--font-display); font-size: 1.35rem; text-wrap: balance; }
    .x { all: unset; cursor: pointer; display: grid; place-items: center; width: 44px; height: 44px; border-radius: 50%; flex: none; }
    .x:hover { background: var(--c-surface-2); }
    .x:focus-visible { outline: 3px solid var(--c-focus); }
    .body { padding: 1.25rem 1.25rem 1.5rem; line-height: 1.6; }
  `;

  constructor() { super(); this.open = false; this.heading = ''; }

  updated(changed) {
    if (!changed.has('open')) return;
    const d = this.renderRoot.querySelector('dialog');
    if (!d) return;
    if (this.open && !d.open) { this._returnFocus = document.activeElement; d.showModal(); }
    if (!this.open && d.open) d.close();
  }

  _close() {
    this.open = false;
    this.dispatchEvent(new CustomEvent('ui-close', { bubbles: true, composed: true }));
    this._returnFocus?.focus?.();
  }

  render() {
    return html`<dialog aria-labelledby="h" @close=${() => this.open && this._close()} @click=${(e) => { if (e.target.localName === 'dialog') this._close(); }}>
      <header><h2 id="h">${this.heading}</h2><button class="x" aria-label="Cerrar ventana" @click=${this._close}>${icon('close')}</button></header>
      <div class="body"><slot></slot></div>
    </dialog>`;
  }
}
customElements.define('ui-modal', UIModal);
