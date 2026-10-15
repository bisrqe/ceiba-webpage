import { LitElement, html, css } from '../core/lit.js';
import { GLOSSARY } from '../data/content.js';
import { store, StoreController } from '../core/store.js';

/**
 * <ui-term key="cmnucc">CMNUCC</ui-term> · Término de glosario con definición emergente.
 * Se abre con clic, toque, Enter o Espacio; se cierra con Esc o al salir del foco.
 * En modo sencillo muestra la definición para niñas y niños.
 */
export class UITerm extends LitElement {
  static properties = { key: { type: String }, _open: { state: true } };

  static styles = css`
    :host { display: inline; position: relative; }
    button { all: unset; cursor: help; font-weight: 700; color: inherit; border-bottom: 2px dotted var(--c-sky); border-radius: 2px; }
    button:focus-visible { outline: 3px solid var(--c-focus); outline-offset: 2px; }
    .pop { position: absolute; z-index: 30; left: 0; top: calc(100% + 8px); width: min(300px, 78vw); padding: .75rem .9rem;
      background: var(--c-ink); color: var(--c-bg); border-radius: var(--radius-s); box-shadow: var(--shadow-2);
      font-size: .9rem; font-weight: 400; line-height: 1.45; font-family: var(--font-body); }
    .pop strong { display: block; margin-bottom: .2rem; color: var(--c-accent); }
  `;

  constructor() { super(); this.key = ''; this._open = false; this._sc = new StoreController(this); }

  render() {
    const g = GLOSSARY[this.key];
    if (!g) return html`<slot></slot>`;
    const text = store.state.simple ? g.simple : g.def;
    return html`<button aria-expanded=${this._open ? 'true' : 'false'} aria-describedby="d"
        @click=${() => { this._open = !this._open; }}
        @keydown=${(e) => { if (e.key === 'Escape') this._open = false; }}
        @blur=${() => { this._open = false; }}><slot></slot></button>
      <span id="d" role="tooltip" class="pop" ?hidden=${!this._open}><strong>${g.term}</strong>${text}</span>`;
  }
}
customElements.define('ui-term', UITerm);
