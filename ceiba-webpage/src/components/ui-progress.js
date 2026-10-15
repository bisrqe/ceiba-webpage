import { LitElement, html, css, nothing } from '../core/lit.js';

/**
 * <ui-progress> · Barra de progreso accesible.
 * Atributos: value, max, label, show-value, indeterminate, tone = primary | ok | warn | bad
 */
export class UIProgress extends LitElement {
  static properties = {
    value: { type: Number }, max: { type: Number }, label: { type: String },
    showValue: { type: Boolean, attribute: 'show-value' }, indeterminate: { type: Boolean }, tone: { type: String, reflect: true },
  };

  static styles = css`
    :host { display: block; font-family: var(--font-body); }
    .top { display: flex; justify-content: space-between; gap: .75rem; font-size: .88rem; font-weight: 700; margin-bottom: .35rem; color: var(--c-ink); }
    .val { font-variant-numeric: tabular-nums; color: var(--c-muted); }
    .track { height: 10px; border-radius: 999px; background: var(--c-surface-2); overflow: hidden; border: 1px solid var(--c-line); }
    .bar { height: 100%; border-radius: inherit; background: var(--c-primary); transition: width var(--dur-slow) ease; }
    :host([tone="ok"]) .bar { background: var(--c-ok); }
    :host([tone="warn"]) .bar { background: var(--c-warn); }
    :host([tone="bad"]) .bar { background: var(--c-bad); }
    :host([tone="accent"]) .bar { background: var(--c-accent); }
    .ind { width: 35%; animation: slide 1.1s ease-in-out infinite; }
    @keyframes slide { from { transform: translateX(-100%); } to { transform: translateX(300%); } }
  `;

  constructor() { super(); this.value = 0; this.max = 100; this.label = ''; this.showValue = false; this.indeterminate = false; this.tone = 'primary'; }

  render() {
    const pct = this.max > 0 ? Math.max(0, Math.min(100, (this.value / this.max) * 100)) : 0;
    return html`
      ${this.label || this.showValue ? html`<div class="top"><span>${this.label}</span>${this.showValue && !this.indeterminate ? html`<span class="val">${Math.round(pct)} %</span>` : nothing}</div>` : nothing}
      <div class="track" role="progressbar" aria-label=${this.label || 'Progreso'}
        aria-valuemin="0" aria-valuemax=${this.max} aria-valuenow=${this.indeterminate ? nothing : this.value}
        aria-valuetext=${this.indeterminate ? 'Cargando' : `${Math.round(pct)} por ciento`}>
        <div class="bar ${this.indeterminate ? 'ind' : ''}" style="width:${this.indeterminate ? 35 : pct}%"></div>
      </div>`;
  }
}
customElements.define('ui-progress', UIProgress);
