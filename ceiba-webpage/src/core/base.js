import { LitElement, html, nothing } from './lit.js';
import { store, StoreController } from './store.js';
import { speak } from './utils.js';
import { shared } from './styles.js';

// Clase base de todas las vistas: suscripción al estado, cabecera estándar,
// explicación en modo sencillo, lectura en voz alta y enfoque de anclas (búsqueda).
export class CeibaView extends LitElement {
  static styles = [shared];

  constructor() {
    super();
    this._sc = new StoreController(this);
  }

  get s() { return store.state; }

  head({ eyebrow, title, lead, simple }) {
    return html`
      <header class="view-head">
        <div class="titles">
          <p class="eyebrow">${eyebrow}</p>
          <h2 id="view-title" tabindex="-1">${title}</h2>
          ${lead ? html`<p class="lead">${lead}</p>` : nothing}
        </div>
        <ui-button variant="ghost" size="sm" icon="speaker" a11y-label="Escuchar esta sección en voz alta" @ui-click=${() => this.readAloud()}>Escuchar</ui-button>
      </header>
      ${this.simpleBox(simple)}`;
  }

  simpleBox(text) {
    if (!this.s.simple || !text) return nothing;
    return html`<div class="simple-box" role="note" aria-label="Explicación sencilla"><span class="tag">En sencillo</span><p>${text}</p></div>`;
  }

  simpleInline(text) {
    return this.s.simple && text ? html`<span class="simple-inline">${text}</span>` : nothing;
  }

  readAloud() {
    const el = this.renderRoot.querySelector('article');
    speak(el ? el.innerText : '');
  }

  // La app llama a este método tras navegar desde la búsqueda.
  async focusAnchor(id) {
    await this.updateComplete;
    const target = id ? this.renderRoot.getElementById(id) : this.renderRoot.getElementById('view-title');
    if (!target) return false;
    if (id) target.scrollIntoView({ behavior: store.state.reduceMotion ? 'auto' : 'smooth', block: 'start' });
    if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
    target.focus({ preventScroll: true });
    if (id) {
      target.classList.remove('flash');
      void target.offsetWidth;
      target.classList.add('flash');
    }
    return true;
  }
}
