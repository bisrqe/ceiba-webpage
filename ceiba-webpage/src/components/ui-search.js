import { LitElement, html, css, nothing } from '../core/lit.js';
import { icon } from '../core/icons.js';
import { search } from '../data/search-index.js';
import { navigate } from '../core/utils.js';

/**
 * <ui-search> · Barra de búsqueda con sugerencias (patrón combobox accesible).
 * Flechas ↑↓ para moverse, Enter para abrir, Esc para cerrar. Atajo global: tecla «/».
 * Ignora acentos: «capacitacion» encuentra «Capacitación».
 */
export class UISearch extends LitElement {
  static properties = { _q: { state: true }, _res: { state: true }, _active: { state: true }, _open: { state: true } };

  static styles = css`
    :host { display: block; position: relative; font-family: var(--font-body); }
    .wrap { position: relative; display: flex; align-items: center; }
    .wrap .icon { position: absolute; left: .8rem; color: var(--c-muted); pointer-events: none; }
    input { width: 100%; min-height: 44px; padding: .55rem 2.4rem .55rem 2.5rem; border-radius: 999px; border: 1.5px solid var(--c-line);
      background: var(--c-surface); color: var(--c-ink); font: inherit; }
    input:focus-visible { outline: 3px solid var(--c-focus); outline-offset: 1px; border-color: var(--c-focus); }
    input::-webkit-search-cancel-button { display: none; }
    kbd { position: absolute; right: .7rem; font: 700 .75rem var(--font-body); padding: .1rem .45rem; border: 1px solid var(--c-line); border-radius: 6px; color: var(--c-muted); background: var(--c-surface-2); }
    ul { position: absolute; z-index: 60; top: calc(100% + 6px); left: 0; right: 0; min-width: min(420px, calc(100vw - 32px)); margin: 0; padding: .35rem; list-style: none;
      background: var(--c-surface); border: 1px solid var(--c-line); border-radius: var(--radius-m); box-shadow: var(--shadow-2); max-height: 60vh; overflow: auto; }
    li { display: flex; flex-direction: column; gap: .1rem; padding: .6rem .75rem; border-radius: var(--radius-s); cursor: pointer; }
    li + li { margin-top: 2px; }
    li[aria-selected="true"], li:hover { background: var(--c-primary-soft); }
    .k { font-size: .72rem; font-weight: 800; letter-spacing: .08em; text-transform: uppercase; color: var(--c-primary); }
    .t { font-weight: 700; color: var(--c-ink); }
    .s { font-size: .85rem; color: var(--c-muted); display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
    .empty { padding: .8rem; color: var(--c-muted); font-size: .92rem; }
  `;

  constructor() {
    super(); this._q = ''; this._res = []; this._active = -1; this._open = false;
    this._global = (e) => {
      const tag = (e.composedPath()[0]?.tagName || '').toLowerCase();
      if (e.key === '/' && !['input', 'textarea', 'select'].includes(tag)) { e.preventDefault(); this.focus(); }
    };
    this._outside = (e) => { if (!e.composedPath().includes(this)) this._open = false; };
  }
  connectedCallback() { super.connectedCallback(); window.addEventListener('keydown', this._global); document.addEventListener('pointerdown', this._outside); }
  disconnectedCallback() { window.removeEventListener('keydown', this._global); document.removeEventListener('pointerdown', this._outside); super.disconnectedCallback(); }
  focus() { this.renderRoot.querySelector('input')?.focus(); }

  _input(e) { this._q = e.target.value; this._res = search(this._q); this._active = this._res.length ? 0 : -1; this._open = this._q.trim().length >= 2; }

  _key(e) {
    if (e.key === 'ArrowDown') { e.preventDefault(); this._open = true; this._active = Math.min(this._res.length - 1, this._active + 1); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); this._active = Math.max(0, this._active - 1); }
    else if (e.key === 'Enter') { e.preventDefault(); if (this._res[this._active]) this._go(this._res[this._active]); }
    else if (e.key === 'Escape') { this._open = false; }
  }

  _go(r) {
    this._open = false; this._q = ''; this._res = [];
    this.renderRoot.querySelector('input').value = '';
    this.dispatchEvent(new CustomEvent('ui-search-go', { bubbles: true, composed: true, detail: r }));
    navigate(r.view, { anchor: r.anchor, category: r.category });
  }

  render() {
    const listId = 'res';
    return html`<div class="wrap" role="search">
        ${icon('search', 18)}
        <label class="sr-only" for="q" style="position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)">Buscar en el sitio</label>
        <input id="q" type="search" placeholder="Buscar: nivel, COP, Semana Tec…" autocomplete="off"
          role="combobox" aria-autocomplete="list" aria-controls=${listId} aria-expanded=${this._open ? 'true' : 'false'}
          aria-activedescendant=${this._open && this._active >= 0 ? `o${this._active}` : nothing}
          .value=${this._q} @input=${this._input} @keydown=${this._key} @focus=${() => { if (this._q.trim().length >= 2) this._open = true; }} />
        ${this._q ? nothing : html`<kbd aria-hidden="true">/</kbd>`}
      </div>
      <ul id=${listId} role="listbox" aria-label="Resultados de búsqueda" ?hidden=${!this._open}>
        ${this._res.length ? this._res.map((r, i) => html`<li id="o${i}" role="option" aria-selected=${i === this._active ? 'true' : 'false'}
            @pointerdown=${(e) => { e.preventDefault(); this._go(r); }}>
            <span class="k">${r.kind}</span><span class="t">${r.title}</span><span class="s">${r.text}</span></li>`)
        : html`<li class="empty" role="option" aria-disabled="true">Sin resultados para «${this._q}». Prueba con «nivel», «COP» o «Semana Tec».</li>`}
      </ul>`;
  }
}
customElements.define('ui-search', UISearch);
