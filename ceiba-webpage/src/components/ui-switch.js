import { LitElement, html, css, nothing } from '../core/lit.js';

/**
 * <ui-switch> · Conmutador accesible (role="switch").
 * Atributos: checked, disabled, label, description
 * Evento:    ui-change → detail { checked }
 */
export class UISwitch extends LitElement {
  static properties = {
    checked: { type: Boolean, reflect: true },
    disabled: { type: Boolean, reflect: true },
    label: { type: String },
    description: { type: String },
  };

  static styles = css`
    :host { display: block; font-family: var(--font-body); color: var(--c-ink); }
    button { all: unset; box-sizing: border-box; display: flex; align-items: center; justify-content: space-between; gap: .9rem;
      width: 100%; min-height: 48px; padding: .35rem 0; cursor: pointer; border-radius: var(--radius-s); }
    button:focus-visible { outline: 3px solid var(--c-focus); outline-offset: 3px; }
    button[disabled] { cursor: not-allowed; opacity: .6; }
    .txt { display: flex; flex-direction: column; gap: .1rem; min-width: 0; }
    .label { font-weight: 700; }
    .desc { font-size: .85rem; color: var(--c-muted); }
    .track { flex: none; position: relative; width: 52px; height: 30px; border-radius: 999px; background: var(--c-line);
      border: 2px solid var(--c-muted); transition: background var(--dur), border-color var(--dur); }
    .thumb { position: absolute; top: 2px; left: 2px; width: 22px; height: 22px; border-radius: 50%; background: var(--c-surface);
      box-shadow: 0 1px 3px rgb(0 0 0 / .3); transition: transform var(--dur); display: grid; place-items: center; font-size: 12px; font-weight: 800; color: var(--c-primary); }
    :host([checked]) .track { background: var(--c-primary); border-color: var(--c-primary); }
    :host([checked]) .thumb { transform: translateX(22px); }
  `;

  constructor() { super(); this.checked = false; this.disabled = false; this.label = ''; this.description = ''; }

  _toggle() {
    if (this.disabled) return;
    this.checked = !this.checked;
    this.dispatchEvent(new CustomEvent('ui-change', { bubbles: true, composed: true, detail: { checked: this.checked } }));
  }

  render() {
    return html`<button role="switch" aria-checked=${this.checked ? 'true' : 'false'} ?disabled=${this.disabled} @click=${this._toggle}>
      <span class="txt"><span class="label">${this.label}</span>${this.description ? html`<span class="desc">${this.description}</span>` : nothing}</span>
      <span class="track" aria-hidden="true"><span class="thumb">${this.checked ? '✓' : ''}</span></span>
    </button>`;
  }
}
customElements.define('ui-switch', UISwitch);
