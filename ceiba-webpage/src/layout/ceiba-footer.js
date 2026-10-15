import { LitElement, html, css, nothing } from '../core/lit.js';
import { navigate, openLegal, copyText } from '../core/utils.js';
import { icon, logo } from '../core/icons.js';
import { shared } from '../core/styles.js';
import { NAV, SITE } from '../data/content.js';
import { store } from '../core/store.js';

export const LEGAL_LINKS = [
  { id: 'privacidad', label: 'Aviso de privacidad' },
  { id: 'terminos', label: 'Términos de uso' },
  { id: 'accesibilidad', label: 'Declaración de accesibilidad' },
  { id: 'terceros', label: 'Integraciones de terceros' },
  { id: 'creditos', label: 'Créditos de imágenes' },
  { id: 'testimonios', label: 'Política de testimonios' },
  { id: 'editorial', label: 'Política editorial' },
];

/** <ceiba-footer> · Pie: mapa del sitio, enlaces legales, contacto y redes. */
export class CeibaFooter extends LitElement {
  static styles = [shared, css`
    :host { display: block; background: var(--c-primary-strong); color: #EAF4EE; margin-top: 3rem; }
    :host-context([data-contrast="high"]) { background: #000; }
    .inner { max-width: var(--maxw); margin: 0 auto; padding-inline: clamp(16px, 3vw, 32px); padding-block: 2.75rem 1.5rem; display: grid; gap: 2rem;
      grid-template-columns: 1.4fr repeat(3, 1fr); }
    @media (max-width: 960px) { .inner { grid-template-columns: 1fr 1fr; } }
    @media (max-width: 560px) { .inner { grid-template-columns: 1fr; } }
    h2 { color: #fff; font-size: .8rem; letter-spacing: .12em; text-transform: uppercase; font-family: var(--font-body); font-weight: 800; margin-bottom: .75rem; }
    ul { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: .15rem; }
    li + li { margin: 0; }
    a, .lnk { color: #EAF4EE; text-decoration: none; background: none; border: 0; padding: .3rem 0; cursor: pointer; font: inherit; text-align: left; display: inline-flex; gap: .45rem; align-items: center; min-height: 36px; }
    a:hover, .lnk:hover { text-decoration: underline; color: #fff; }
    :focus-visible { outline-color: var(--c-accent); }
    .brand { display: flex; gap: .75rem; align-items: center; }
    .brand strong { font-family: var(--font-display); font-size: 1.6rem; letter-spacing: .08em; color: #fff; }
    .brand-logo { background: #F3F6F2; border-radius: 14px; padding: 4px; display: grid; }
    .brand-logo svg { --c-primary: #1E6B4F; --c-leaf: #3E9B6E; --c-trunk: #6B4A2F; --c-accent: #F2B33D; }
    .about p { color: #CFE3D7; margin-top: .75rem; font-size: .95rem; }
    .pend { display: inline-flex; font-size: .78rem; font-weight: 700; border: 1.5px dashed #F5C15A; color: #F5C15A; border-radius: 999px; padding: .1rem .55rem; margin-left: .35rem; }
    .contact li { display: flex; align-items: center; gap: .5rem; min-height: 36px; flex-wrap: wrap; }
    .bottom { max-width: var(--maxw); margin: 0 auto; padding-inline: clamp(16px, 3vw, 32px); padding-block: 1rem calc(1.25rem + env(safe-area-inset-bottom, 0px));
      border-top: 1px solid rgb(255 255 255 / .18); display: flex; flex-wrap: wrap; gap: .75rem 1.5rem; justify-content: space-between; font-size: .88rem; color: #CFE3D7; }
    .copy { all: unset; cursor: pointer; display: inline-grid; place-items: center; width: 32px; height: 32px; border-radius: 50%; }
    .copy:focus-visible { outline: 3px solid var(--c-accent); }
  `];

  _contact(kind, value, ic) {
    return html`<li>${icon(ic, 18)}<span>${kind}:</span>
      ${value ? html`<span>${value}</span><button class="copy" aria-label="Copiar ${kind.toLowerCase()}" @click=${() => copyText(value)}>${icon('copy', 16)}</button>`
        : html`<span class="pend">Por definir</span>`}</li>`;
  }

  render() {
    const c = SITE.contact;
    return html`<footer>
      <div class="inner">
        <div class="about">
          <div class="brand"><span class="brand-logo">${logo(44)}</span><strong>${SITE.name}</strong></div>
          <p>${SITE.fullName}. Formamos a estudiantes para incidir en sostenibilidad y cambio climático, desde espacios internacionales hasta su universidad y su territorio.</p>
        </div>
        <nav aria-label="Mapa del sitio">
          <h2>Mapa del sitio</h2>
          <ul>${NAV.map((n) => html`<li><a href="#${n.id}" @click=${(e) => { e.preventDefault(); navigate(n.id); }}>${n.label}</a></li>`)}</ul>
        </nav>
        <nav aria-label="Información legal">
          <h2>Legal</h2>
          <ul>${LEGAL_LINKS.map((l) => html`<li><button class="lnk" @click=${() => openLegal(l.id)}>${l.label}</button></li>`)}
            <li><button class="lnk" @click=${() => openLegal('cookies')}>Preferencias de almacenamiento</button></li></ul>
        </nav>
        <div>
          <h2>Contacto</h2>
          <ul class="contact">
            ${this._contact('Correo', c.email, 'mail')}
            ${this._contact('Teléfono', c.phone, 'phone')}
            ${this._contact('Dirección', c.address, 'pin')}
          </ul>
          <h2 style="margin-top:1.25rem">Redes sociales</h2>
          <ul>${SITE.social.map((r) => html`<li>${r.url
            ? html`<a href=${r.url} target="_blank" rel="noopener noreferrer">${icon('share', 18)}${r.name}<span class="sr-only"> (se abre en otra pestaña)</span></a>`
            : html`<span class="lnk" style="cursor:default">${icon('share', 18)}${r.name}<span class="pend">Por definir</span></span>`}</li>`)}</ul>
        </div>
      </div>
      <div class="bottom">
        <span>© ${new Date().getFullYear()} ${SITE.name}. Todos los derechos reservados. Imágenes: ver <button class="lnk" style="display:inline;min-height:0;text-decoration:underline" @click=${() => openLegal('creditos')}>créditos</button>.</span>
        <span>Última actualización del contenido: ${SITE.lastUpdate}${store.state.consent ? nothing : ''}</span>
      </div>
    </footer>`;
  }
}
customElements.define('ceiba-footer', CeibaFooter);
