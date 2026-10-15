import { LitElement, html, css, nothing } from '../core/lit.js';
import { store, StoreController } from '../core/store.js';
import { navigate, toast } from '../core/utils.js';
import { icon, logo } from '../core/icons.js';
import { shared } from '../core/styles.js';
import { NAV, SITE } from '../data/content.js';

export const FONT_STEPS = [0.9, 1, 1.15, 1.3, 1.5];

export function setFontStep(dir) {
  const i = FONT_STEPS.indexOf(store.state.fontScale);
  const next = FONT_STEPS[Math.max(0, Math.min(FONT_STEPS.length - 1, (i < 0 ? 1 : i) + dir))];
  store.set({ fontScale: next });
  toast(`Tamaño de letra: ${Math.round(next * 100)} %`, 'info', 1800);
}

/** <ceiba-header> · Cabecera: logotipo, navegación principal, búsqueda y accesos directos. */
export class CeibaHeader extends LitElement {
  static properties = { _menu: { state: true } };

  static styles = [shared, css`
    :host { display: block; position: sticky; top: env(safe-area-inset-top, 0px); z-index: 50; }
    .bar { background: color-mix(in srgb, var(--c-surface) 92%, transparent); backdrop-filter: saturate(1.4) blur(10px); -webkit-backdrop-filter: saturate(1.4) blur(10px); border-bottom: 1px solid var(--c-line); }
    .inner { max-width: var(--maxw); margin: 0 auto; padding-inline: clamp(16px, 3vw, 32px); min-height: var(--header-h); display: flex; align-items: center; gap: 1rem; }
    .brand { display: flex; align-items: center; gap: .65rem; text-decoration: none; color: var(--c-ink); flex: none; border-radius: var(--radius-s); }
    .brand strong { display: block; font-family: var(--font-display); font-size: 1.35rem; letter-spacing: .08em; line-height: 1; }
    .brand small { display: block; font-size: .7rem; color: var(--c-muted); max-width: 17ch; line-height: 1.2; margin-top: .15rem; }
    nav { flex: 1; min-width: 0; }
    nav ul { list-style: none; display: flex; align-items: center; gap: .15rem; padding: 0; margin: 0; }
    nav li + li { margin: 0; }
    .nl { display: inline-flex; align-items: center; gap: .4rem; min-height: 44px; padding: .4rem .7rem; border-radius: 999px; font-weight: 700; font-size: .95rem;
      color: var(--c-ink); text-decoration: none; white-space: nowrap; background: none; border: 0; cursor: pointer; }
    .nl:hover { background: var(--c-surface-2); }
    .nl[aria-current="page"] { background: var(--c-primary-soft); color: var(--c-primary-strong); }
    .nl .icon { color: var(--c-primary); }
    nav .nl .icon { display: none; }
    .mobile .nl .icon { display: inline; }
    .tools { display: flex; align-items: center; gap: .5rem; margin-left: auto; }
    ui-search { width: clamp(190px, 18vw, 260px); }
    .ib { display: inline-grid; place-items: center; min-width: 44px; height: 44px; padding: 0 .6rem; border-radius: 999px; border: 1.5px solid var(--c-line); background: var(--c-surface); cursor: pointer; font-weight: 800; gap: .3rem; grid-auto-flow: column; }
    .ib:hover { background: var(--c-surface-2); }
    .ib[aria-expanded="true"] { border-color: var(--c-primary); background: var(--c-primary-soft); }
    .dd { position: relative; }
    .menu { position: absolute; right: 0; top: calc(100% + 8px); z-index: 70; min-width: 240px; padding: .5rem; background: var(--c-surface); border: 1px solid var(--c-line); border-radius: var(--radius-m); box-shadow: var(--shadow-2); }
    .menu.left { left: 0; right: auto; }
    .menu a { display: flex; align-items: center; gap: .6rem; padding: .7rem .8rem; border-radius: var(--radius-s); color: var(--c-ink); text-decoration: none; font-weight: 700; }
    .menu a:hover, .menu a[aria-current="page"] { background: var(--c-primary-soft); }
    .a11y { width: min(320px, calc(100vw - 32px)); padding: 1rem; display: flex; flex-direction: column; gap: .5rem; }
    .fs { display: flex; align-items: center; justify-content: space-between; gap: .5rem; padding-bottom: .5rem; border-bottom: 1px solid var(--c-line); }
    .fs .num { font-weight: 800; min-width: 4ch; text-align: center; }
    .burger { display: none; }
    .mobile { border-top: 1px solid var(--c-line); background: var(--c-surface); padding: 1rem clamp(16px, 3vw, 32px) 1.25rem; }
    .mobile ul { list-style: none; padding: 0; display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: .4rem; margin-top: .9rem; }
    .mobile li + li { margin: 0; }
    .mobile .nl { width: 100%; border: 1px solid var(--c-line); border-radius: var(--radius-s); justify-content: flex-start; }
    .only-wide { display: block; }
    .mobile ui-search { display: none; }
    @media (max-width: 1459px) { .brand small { display: none; } }
    @media (max-width: 1339px) { nav { display: none; } .burger { display: inline-grid; } }
    @media (min-width: 1340px) { .mobile { display: none; } }
    @media (max-width: 759px) { .only-wide { display: none; } .mobile ui-search { display: block; } }
    @media (max-width: 520px) { .cta-label { display: none; } }
  `];

  constructor() {
    super(); this._sc = new StoreController(this); this._menu = '';
    this._outside = (e) => { if (this._menu && !e.composedPath().includes(this)) this._menu = ''; };
    this._esc = (e) => { if (e.key === 'Escape' && this._menu) { const m = this._menu; this._menu = ''; this.renderRoot.querySelector(`[data-trigger="${m}"]`)?.focus(); } };
  }
  connectedCallback() { super.connectedCallback(); document.addEventListener('pointerdown', this._outside); window.addEventListener('keydown', this._esc); }
  disconnectedCallback() { document.removeEventListener('pointerdown', this._outside); window.removeEventListener('keydown', this._esc); super.disconnectedCallback(); }

  _toggle(name) { this._menu = this._menu === name ? '' : name; }
  _go(e, id) { e.preventDefault(); this._menu = ''; navigate(id); }

  _link(n, cls = 'nl') {
    const s = store.state;
    return html`<a class=${cls} href="#${n.id}" aria-current=${s.view === n.id ? 'page' : nothing} @click=${(e) => this._go(e, n.id)}>${icon(n.icon, 18)}${n.label}</a>`;
  }

  _a11yPanel() {
    const s = store.state;
    return html`<div class="menu a11y" role="group" aria-label="Opciones de accesibilidad">
      <div class="fs"><span class="label">Tamaño de letra</span>
        <span class="row" style="--gap:.35rem">
          <button class="ib" aria-label="Reducir tamaño de letra" @click=${() => setFontStep(-1)}>A−</button>
          <span class="num" aria-live="polite">${Math.round(s.fontScale * 100)} %</span>
          <button class="ib" aria-label="Aumentar tamaño de letra" @click=${() => setFontStep(1)}>A+</button>
        </span>
      </div>
      <ui-switch label="Modo sencillo" description="Explicaciones cortas para niñas, niños y primera visita" ?checked=${s.simple} @ui-change=${(e) => store.set({ simple: e.detail.checked })}></ui-switch>
      <ui-switch label="Alto contraste" ?checked=${s.contrast} @ui-change=${(e) => store.set({ contrast: e.detail.checked })}></ui-switch>
      <ui-switch label="Reducir movimiento" ?checked=${s.reduceMotion} @ui-change=${(e) => store.set({ reduceMotion: e.detail.checked })}></ui-switch>
    </div>`;
  }

  render() {
    const main = NAV.filter((n) => !n.more && !n.cta);
    const more = NAV.filter((n) => n.more);
    const moreActive = more.some((n) => n.id === store.state.view);
    return html`<div class="bar">
      <div class="inner">
        <a class="brand" href="#inicio" @click=${(e) => this._go(e, 'inicio')} aria-label="${SITE.name}, ir al inicio">
          ${logo(42)}<span><strong>${SITE.name}</strong><small>${SITE.fullName}</small></span>
        </a>
        <nav aria-label="Navegación principal">
          <ul>
            ${main.map((n) => html`<li>${this._link(n)}</li>`)}
            <li class="dd">
              <button class="nl" data-trigger="more" aria-expanded=${this._menu === 'more' ? 'true' : 'false'} aria-controls="more-menu"
                aria-current=${moreActive ? 'page' : nothing} @click=${() => this._toggle('more')}>Más ${icon('chevron', 16)}</button>
              <div id="more-menu" class="menu left" ?hidden=${this._menu !== 'more'}>${more.map((n) => this._link(n, ''))}</div>
            </li>
          </ul>
        </nav>
        <div class="tools">
          <ui-search class="only-wide"></ui-search>
          <div class="dd">
            <button class="ib" data-trigger="a11y" aria-label="Accesibilidad: tamaño de letra, modo sencillo y contraste" aria-expanded=${this._menu === 'a11y' ? 'true' : 'false'}
              @click=${() => this._toggle('a11y')}>${icon('text', 20)}</button>
            ${this._menu === 'a11y' ? this._a11yPanel() : nothing}
          </div>
          <ui-button variant="accent" size="sm" icon="pen" a11y-label="Participa: inscríbete o contáctanos" @ui-click=${() => navigate('participa')}><span class="cta-label">Participa</span></ui-button>
          <button class="ib burger" data-trigger="mobile" aria-label="Abrir menú de navegación" aria-expanded=${this._menu === 'mobile' ? 'true' : 'false'} aria-controls="mnav"
            @click=${() => this._toggle('mobile')}>${icon(this._menu === 'mobile' ? 'close' : 'menu')}</button>
        </div>
      </div>
      <div id="mnav" class="mobile" ?hidden=${this._menu !== 'mobile'} @ui-search-go=${() => { this._menu = ''; }}>
        <ui-search></ui-search>
        <nav aria-label="Navegación principal (móvil)" style="display:block"><ul>${NAV.map((n) => html`<li>${this._link(n)}</li>`)}</ul></nav>
      </div>
    </div>`;
  }
}
customElements.define('ceiba-header', CeibaHeader);
