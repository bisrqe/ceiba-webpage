// ui-button.ts · Versión TypeScript (decoradores) EQUIVALENTE a ui-button.js.
// Úsala si el proyecto se compila con Vite/tsc: `npm i lit` y cambia la importación a 'lit'.
// Cambios respecto a la especificación original y por qué:
//  1. formAssociated + ElementInternals → type="submit" sí envía el <form> contenedor.
//     (Un <button> dentro de Shadow DOM NO pertenece al formulario del documento.)
//  2. aria-label vía `a11y-label` para botones que solo muestran icono.
//  3. :focus-visible y área táctil ≥ 44 px (WCAG 2.2, criterio 2.5.8).
//  4. Colores desde variables CSS (tokens) en lugar de hexadecimales fijos: el componente
//     respeta la paleta de marca, el tema oscuro y el alto contraste.
//  5. `disabled` es booleano: en HTML, `disabled="false"` TAMBIÉN deshabilita. Quita el atributo para habilitar.
import { LitElement, html, css, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';

type Variant = 'primary' | 'secondary' | 'ghost' | 'accent' | 'danger';
type Size = 'sm' | 'md' | 'lg';

@customElement('ui-button')
export class UIButton extends LitElement {
  static formAssociated = true;

  @property({ type: String, reflect: true }) variant: Variant = 'primary';
  @property({ type: String, reflect: true }) size: Size = 'md';
  @property({ type: String }) type: 'button' | 'submit' | 'reset' = 'button';
  @property({ type: String, attribute: 'a11y-label' }) a11yLabel = '';
  @property({ type: Boolean, reflect: true }) disabled = false;
  @property({ type: Boolean, reflect: true }) full = false;
  @property({ type: String }) label = '';

  private _internals = this.attachInternals();

  static styles = css`
    :host { display: inline-block; font-family: var(--font-body, system-ui, sans-serif); }
    :host([full]) { display: block; }
    button { display: inline-flex; align-items: center; justify-content: center; gap: .55rem; width: 100%;
      min-height: 46px; padding: .7rem 1.3rem; font: inherit; font-weight: 700; border: 2px solid transparent;
      border-radius: 999px; cursor: pointer; transition: background-color var(--dur, .18s), transform .1s; }
    button:active:not(:disabled) { transform: scale(.98); }
    button:focus-visible { outline: 3px solid var(--c-focus, #1C6A9C); outline-offset: 3px; }
    .primary { background: var(--c-primary, #1E6B4F); color: var(--c-surface, #fff); }
    .primary:hover:not(:disabled) { background: var(--c-primary-strong, #14503A); }
    .secondary { background: var(--c-surface, #fff); color: var(--c-primary-strong, #14503A); border-color: var(--c-primary, #1E6B4F); }
    .ghost { background: transparent; color: var(--c-ink, #14231C); border-color: var(--c-line, #D1DCD4); }
    .accent { background: var(--c-accent, #F2B33D); color: #2a1f00; }
    .danger { background: transparent; color: var(--c-bad, #B42318); border-color: var(--c-bad, #B42318); }
    button:disabled { background: var(--c-surface-2, #E8EFEA); color: var(--c-muted, #4B5D54); cursor: not-allowed; transform: none; }
  `;

  private _handleClick(e: Event) {
    if (this.disabled) { e.preventDefault(); e.stopPropagation(); return; }
    const form = this._internals.form;
    if (form && this.type === 'submit') form.requestSubmit();
    if (form && this.type === 'reset') form.reset();
    this.dispatchEvent(new CustomEvent('ui-click', {
      bubbles: true, composed: true,
      detail: { label: this.label || this.textContent?.trim(), variant: this.variant },
    }));
  }

  render() {
    return html`<button part="button" class=${this.variant} ?disabled=${this.disabled}
        aria-label=${this.a11yLabel || nothing} @click=${this._handleClick}>
        <slot>${this.label}</slot>
      </button>`;
  }
}

declare global {
  interface HTMLElementTagNameMap { 'ui-button': UIButton; }
  interface HTMLElementEventMap { 'ui-click': CustomEvent<{ label: string; variant: Variant }>; }
}
