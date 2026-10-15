import { LitElement, html, css, nothing } from '../core/lit.js';
import { icon } from '../core/icons.js';

/**
 * <ui-button> · Botón / Call to Action agnóstico (Web Component + Lit).
 *
 * Atributos:  variant = primary | secondary | ghost | accent | danger
 *             size = sm | md | lg     type = button | submit | reset
 *             icon = nombre de icono  icon-end = nombre de icono al final
 *             a11y-label = etiqueta accesible (obligatoria si el botón solo tiene icono)
 *             disabled, full (ocupa todo el ancho), pressed (estado de conmutación)
 * Evento:     ui-click → detail { label, variant }
 *
 * Mejoras respecto a la especificación base:
 *  · formAssociated + ElementInternals: `type="submit"` envía el <form> que lo contiene
 *    (un <button> dentro de Shadow DOM, por sí solo, NO envía formularios externos).
 *  · `disabled` refleja el atributo: `disabled="false"` en HTML sigue deshabilitando
 *    (regla de atributos booleanos); para habilitar, elimina el atributo.
 *  · Área táctil mínima de 44 px, foco visible y soporte de alto contraste.
 */
export class UIButton extends LitElement {
  static formAssociated = true;
  static properties = {
    variant: { type: String, reflect: true },
    size: { type: String, reflect: true },
    type: { type: String },
    icon: { type: String },
    iconEnd: { type: String, attribute: 'icon-end' },
    a11yLabel: { type: String, attribute: 'a11y-label' },
    disabled: { type: Boolean, reflect: true },
    full: { type: Boolean, reflect: true },
    pressed: { type: String },
    label: { type: String },
  };

  static styles = css`
    :host { display: inline-block; font-family: var(--font-body); }
    :host([full]) { display: block; }
    button {
      display: inline-flex; align-items: center; justify-content: center; gap: .55rem; width: 100%;
      min-height: 46px; padding: .7rem 1.3rem; font: inherit; font-size: 1rem; font-weight: 700; line-height: 1.15;
      border: 2px solid transparent; border-radius: 999px; cursor: pointer; text-align: center;
      transition: background-color var(--dur), border-color var(--dur), color var(--dur), transform .1s;
    }
    button:active:not(:disabled) { transform: scale(.98); }
    button:focus-visible { outline: 3px solid var(--c-focus); outline-offset: 3px; }
    :host([size="sm"]) button { min-height: 44px; padding: .45rem .95rem; font-size: .92rem; }
    :host([size="lg"]) button { min-height: 56px; padding: .9rem 1.8rem; font-size: 1.1rem; }

    .primary { background: var(--c-primary); color: var(--c-surface); }
    .primary:hover:not(:disabled) { background: var(--c-primary-strong); }
    .secondary { background: var(--c-surface); color: var(--c-primary-strong); border-color: var(--c-primary); }
    .secondary:hover:not(:disabled) { background: var(--c-primary-soft); }
    .ghost { background: transparent; color: var(--c-ink); border-color: var(--c-line); }
    .ghost:hover:not(:disabled) { background: var(--c-surface-2); }
    .ghost[aria-pressed="true"] { background: var(--c-primary-soft); border-color: var(--c-primary); }
    .accent { background: var(--c-accent); color: #2a1f00; }
    .accent:hover:not(:disabled) { filter: brightness(.95); }
    .danger { background: transparent; color: var(--c-bad); border-color: var(--c-bad); }
    .danger:hover:not(:disabled) { background: var(--c-bad-soft); }
    button:disabled { background: var(--c-surface-2); color: var(--c-muted); border-color: var(--c-line); cursor: not-allowed; transform: none; opacity: .8; }
  `;

  constructor() {
    super();
    this.variant = 'primary';
    this.size = 'md';
    this.type = 'button';
    this.disabled = false;
    this.full = false;
    this.label = '';
    this._internals = this.attachInternals ? this.attachInternals() : null;
  }

  focus(opts) { this.renderRoot?.querySelector('button')?.focus(opts); }

  _onClick(e) {
    if (this.disabled) { e.preventDefault(); e.stopPropagation(); return; }
    const form = this._internals?.form;
    if (form && this.type === 'submit') form.requestSubmit();
    if (form && this.type === 'reset') form.reset();
    this.dispatchEvent(new CustomEvent('ui-click', {
      bubbles: true, composed: true,
      detail: { label: this.label || this.textContent.trim(), variant: this.variant },
    }));
  }

  render() {
    return html`<button
        part="button"
        class=${this.variant}
        ?disabled=${this.disabled}
        aria-label=${this.a11yLabel || nothing}
        aria-pressed=${this.pressed ?? nothing}
        @click=${this._onClick}>
        ${this.icon ? icon(this.icon) : nothing}
        <slot>${this.label}</slot>
        ${this.iconEnd ? icon(this.iconEnd) : nothing}
      </button>`;
  }
}
customElements.define('ui-button', UIButton);
