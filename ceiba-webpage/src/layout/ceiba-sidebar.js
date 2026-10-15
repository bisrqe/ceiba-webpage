import { LitElement, html, css, nothing } from '../core/lit.js';
import { store, StoreController } from '../core/store.js';
import { navigate, toast, copyText } from '../core/utils.js';
import { icon } from '../core/icons.js';
import { shared } from '../core/styles.js';
import { NAV, CATEGORIES, LEVELS, SITE } from '../data/content.js';
import { setFontStep } from './ceiba-header.js';

/** <ceiba-sidebar> · Barra lateral: recorrido, filtros (categoría/nivel), accesibilidad y QR. */
export class CeibaSidebar extends LitElement {
  static properties = { _open: { state: true }, _narrow: { state: true }, _qrUrl: { state: true } };

  static styles = [shared, css`
    :host { display: block; }
    .toggle { display: none; width: 100%; align-items: center; justify-content: space-between; gap: .75rem; min-height: 52px; padding: .75rem 1rem;
      border-radius: var(--radius-m); border: 1.5px solid var(--c-line); background: var(--c-surface); font-weight: 800; cursor: pointer; }
    .toggle .icon:last-child { transition: transform var(--dur); }
    .toggle[aria-expanded="true"] .icon:last-child { transform: rotate(180deg); }
    .panel { display: flex; flex-direction: column; gap: 1rem; }
    .block { background: var(--c-surface); border: 1px solid var(--c-line); border-radius: var(--radius-m); padding: 1rem; display: flex; flex-direction: column; gap: .75rem; }
    .block h3 { font-size: .8rem; letter-spacing: .1em; text-transform: uppercase; color: var(--c-muted); font-family: var(--font-body); font-weight: 800; }
    .route { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 2px; }
    .route li + li { margin: 0; }
    .route a { display: flex; align-items: center; gap: .6rem; padding: .5rem .6rem; min-height: 40px; border-radius: var(--radius-s); color: var(--c-ink); text-decoration: none; font-weight: 600; font-size: .95rem; }
    .route a:hover { background: var(--c-surface-2); }
    .route a[aria-current="page"] { background: var(--c-primary-soft); font-weight: 800; }
    .dot { width: 22px; height: 22px; flex: none; border-radius: 50%; border: 2px solid var(--c-line); display: grid; place-items: center; color: var(--c-surface); }
    .dot.v { background: var(--c-primary); border-color: var(--c-primary); }
    fieldset { border: 0; padding: 0; margin: 0; display: flex; flex-direction: column; gap: .4rem; }
    legend { font-weight: 700; margin-bottom: .35rem; padding: 0; }
    .choice { padding: .55rem .75rem; min-height: 44px; }
    .adv { font-size: .9rem; background: var(--c-surface-2); border-radius: var(--radius-s); padding: .6rem .75rem; }
    .fs { display: flex; align-items: center; justify-content: space-between; gap: .5rem; }
    .ib { display: inline-grid; place-items: center; min-width: 44px; height: 44px; border-radius: 999px; border: 1.5px solid var(--c-line); background: var(--c-surface); cursor: pointer; font-weight: 800; }
    .ib:hover { background: var(--c-surface-2); }
    .qr { display: flex; flex-direction: column; align-items: center; gap: .6rem; }
    @media (max-width: 1040px) { .toggle { display: flex; } }
  `];

  constructor() {
    super(); this._sc = new StoreController(this); this._open = false; this._qrUrl = '';
    this._mq = window.matchMedia('(max-width: 1040px)');
    this._narrow = this._mq.matches;
    this._onMq = (e) => { this._narrow = e.matches; };
  }
  connectedCallback() { super.connectedCallback(); this._mq.addEventListener('change', this._onMq); }
  disconnectedCallback() { this._mq.removeEventListener('change', this._onMq); super.disconnectedCallback(); }

  _shareUrl() {
    const base = (this._qrUrl || SITE.publicUrl || '').trim();
    if (!base) return '';
    return `${base.replace(/#.*$/, '')}#${store.state.view}`;
  }

  render() {
    const s = store.state;
    const visited = NAV.filter((n) => s.visited.includes(n.id)).length;
    const level = LEVELS.find((l) => l.id === s.level);
    const collapsed = this._narrow && !this._open;
    const shareUrl = this._shareUrl();
    return html`
      <button class="toggle" aria-expanded=${this._open ? 'true' : 'false'} aria-controls="panel" @click=${() => { this._open = !this._open; }}>
        <span class="row" style="--gap:.6rem">${icon('sliders')} Recorrido, filtros y accesibilidad</span>${icon('chevron')}
      </button>
      <div id="panel" class="panel" ?hidden=${collapsed}>
        <section class="block" aria-labelledby="h-route">
          <h3 id="h-route">Tu recorrido</h3>
          <ui-progress value=${visited} max=${NAV.length} label="${visited} de ${NAV.length} secciones exploradas"></ui-progress>
          <nav aria-label="Secciones del sitio">
            <ul class="route">
              ${NAV.map((n) => html`<li><a href="#${n.id}" aria-current=${s.view === n.id ? 'page' : nothing}
                @click=${(e) => { e.preventDefault(); navigate(n.id); if (this._narrow) this._open = false; }}>
                <span class="dot ${s.visited.includes(n.id) ? 'v' : ''}" aria-hidden="true">${s.visited.includes(n.id) ? icon('check', 14) : nothing}</span>
                ${n.label}<span class="sr-only">${s.visited.includes(n.id) ? ' (visitada)' : ''}</span></a></li>`)}
            </ul>
          </nav>
        </section>

        <section class="block" aria-labelledby="h-filters">
          <h3 id="h-filters">Filtros</h3>
          <div class="field">
            <label for="cat">Categoría</label>
            <select id="cat" .value=${s.category} @change=${(e) => {
              const category = e.target.value; store.set({ category });
              const c = CATEGORIES.find((x) => x.id === category);
              toast(`Categoría: ${c.short}`, 'info', 2000);
              if (category !== 'todas' && !['programas', 'diagnostico', 'calendario'].includes(s.view)) navigate('programas', { category });
            }}>
              ${CATEGORIES.map((c) => html`<option value=${c.id} ?selected=${c.id === s.category}>${c.label}</option>`)}
            </select>
            <span class="hint">Filtra programas, diagnóstico y calendario.</span>
          </div>
          <fieldset>
            <legend>Nivel de participante</legend>
            ${[{ id: '', label: 'Aún no lo sé' }, ...LEVELS].map((l) => html`<label class="choice">
              <input type="radio" name="level" .value=${l.id} .checked=${s.level === l.id} @change=${() => { store.set({ level: l.id }); if (l.id) toast(`Nivel ${l.label} seleccionado`, 'ok', 2000); }} />
              <span>${l.label}</span></label>`)}
          </fieldset>
          ${level ? html`<p class="adv"><strong>Para avanzar de nivel ${level.label.toLowerCase()}:</strong> ${level.advance}</p>`
            : html`<ui-button variant="secondary" size="sm" full icon="clipboard" @ui-click=${() => navigate('diagnostico', { category: 'anual' })}>Descubre tu nivel</ui-button>`}
        </section>

        <section class="block" aria-labelledby="h-a11y">
          <h3 id="h-a11y">Accesibilidad</h3>
          <div class="fs"><span class="label">Letra</span>
            <span class="row" style="--gap:.35rem">
              <button class="ib" aria-label="Reducir tamaño de letra" @click=${() => setFontStep(-1)}>A−</button>
              <span class="num" style="min-width:4ch;text-align:center;font-weight:800">${Math.round(s.fontScale * 100)} %</span>
              <button class="ib" aria-label="Aumentar tamaño de letra" @click=${() => setFontStep(1)}>A+</button>
            </span>
          </div>
          <ui-switch label="Modo sencillo" description="Palabras fáciles y ejemplos" ?checked=${s.simple} @ui-change=${(e) => { store.set({ simple: e.detail.checked }); toast(e.detail.checked ? 'Modo sencillo activado' : 'Modo sencillo desactivado', 'ok', 2000); }}></ui-switch>
          <ui-switch label="Alto contraste" ?checked=${s.contrast} @ui-change=${(e) => store.set({ contrast: e.detail.checked })}></ui-switch>
          <ui-switch label="Reducir movimiento" ?checked=${s.reduceMotion} @ui-change=${(e) => store.set({ reduceMotion: e.detail.checked })}></ui-switch>
        </section>

        <section class="block" aria-labelledby="h-qr">
          <h3 id="h-qr">Comparte esta sección</h3>
          <div class="field">
            <label for="qrurl">Enlace público del sitio</label>
            <input id="qrurl" type="url" inputmode="url" placeholder="https://…" .value=${this._qrUrl || SITE.publicUrl}
              @change=${(e) => { this._qrUrl = e.target.value; }} />
            <span class="hint">El QR abre la sección actual: «${NAV.find((n) => n.id === s.view)?.label}».</span>
          </div>
          <div class="qr">
            <ui-qr value=${shareUrl} size="168" label="Código QR para abrir la sección ${NAV.find((n) => n.id === s.view)?.label} de CEIBA"
              @ui-qr-error=${() => toast('No se pudo generar el código QR. Revisa tu conexión.', 'bad')}></ui-qr>
            ${shareUrl ? html`<ui-button variant="ghost" size="sm" icon="copy" @ui-click=${() => copyText(shareUrl, 'Enlace copiado.')}>Copiar enlace</ui-button>` : nothing}
          </div>
        </section>
      </div>`;
  }
}
customElements.define('ceiba-sidebar', CeibaSidebar);
