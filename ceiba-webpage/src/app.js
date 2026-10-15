import { LitElement, html, css, nothing } from './core/lit.js';
import { store, StoreController } from './core/store.js';
import { navigate, toast, openLegal } from './core/utils.js';
import { icon } from './core/icons.js';
import { shared } from './core/styles.js';
import { NAV, SITE } from './data/content.js';
import { LEGAL_LINKS } from './layout/ceiba-footer.js';

/**
 * <ceiba-app> · Contenedor principal (layout + enrutador + ventanas legales + consentimiento).
 * Estructura: Cabecera · Barra lateral · Cuerpo (vistas) · Pie de página.
 * Todas las vistas permanecen montadas (ocultas con `hidden`) para conservar lo que la
 * persona escribió al cambiar de sección.
 */
const VIEW_TAGS = {
  inicio: 'view-inicio', nosotros: 'view-nosotros', programas: 'view-programas', diagnostico: 'view-diagnostico',
  iniciativas: 'view-iniciativas', indicadores: 'view-indicadores', calendario: 'view-calendario',
  testimonios: 'view-testimonios', participa: 'view-participa',
};

export class CeibaApp extends LitElement {
  static properties = { _legal: { state: true } };

  static styles = [shared, css`
    :host { display: block; min-height: 100%; background: var(--c-bg); }
    .skip { position: absolute; left: 16px; top: -100px; z-index: 100; background: var(--c-ink); color: var(--c-bg); padding: .75rem 1rem; border-radius: var(--radius-s); font-weight: 800; text-decoration: none; }
    .skip:focus { top: calc(8px + env(safe-area-inset-top, 0px)); }
    .layout { max-width: var(--maxw); margin: 0 auto; padding-inline: clamp(16px, 3vw, 32px); padding-block: 1.5rem 1rem;
      display: grid; grid-template-columns: 290px minmax(0, 1fr); gap: 2rem; align-items: start; }
    aside { position: sticky; top: calc(var(--header-h) + 16px + env(safe-area-inset-top, 0px)); max-height: calc(100vh - var(--header-h) - 32px); overflow: auto;
      scrollbar-width: thin; padding: 2px; border-radius: var(--radius-m); }
    main { min-width: 0; outline: none; }
    @media (max-width: 1040px) { .layout { grid-template-columns: 1fr; gap: 1.25rem; } aside { position: static; max-height: none; overflow: visible; } }
    .legal h3 { font-size: 1.05rem; margin-top: 1.1rem; margin-bottom: .35rem; }
    .legal p + p, .legal ul { margin-top: .5rem; }
    .legal .draft { display: flex; gap: .5rem; padding: .7rem .9rem; border-radius: var(--radius-s); background: var(--c-warn-soft); color: var(--c-ink); font-size: .92rem; margin-bottom: .5rem; }
    .legal table { width: 100%; border-collapse: collapse; font-size: .92rem; }
    .legal th, .legal td { text-align: left; padding: .5rem; border-bottom: 1px solid var(--c-line); vertical-align: top; }
    .legal .tbl { overflow-x: auto; }
    .banner { position: fixed; z-index: 80; left: 16px; right: 16px; bottom: calc(16px + env(safe-area-inset-bottom, 0px)); max-width: 760px; margin: 0 auto;
      background: var(--c-surface); color: var(--c-ink); border: 1px solid var(--c-line); border-radius: var(--radius-l); box-shadow: var(--shadow-2);
      padding: 1rem 1.15rem; display: flex; flex-wrap: wrap; gap: .75rem 1rem; align-items: center; }
    .banner p { flex: 1 1 320px; font-size: .95rem; }
    .banner .icon { color: var(--c-primary); }
  `];

  constructor() {
    super();
    this._sc = new StoreController(this);
    this._legal = '';
    this._onNav = (e) => this._afterNav(e.detail);
    this._onLegal = (e) => { this._legal = e.detail.id; };
    this._onPop = () => {
      const v = location.hash.replace('#', '');
      if (store.views.includes(v) && v !== store.state.view) navigate(v);
    };
  }

  connectedCallback() {
    super.connectedCallback();
    window.addEventListener('ceiba-navigated', this._onNav);
    window.addEventListener('ceiba-legal', this._onLegal);
    window.addEventListener('popstate', this._onPop);
    window.addEventListener('hashchange', this._onPop);
    if (!document.documentElement.lang) document.documentElement.lang = 'es-MX';
    this._setTitle();
  }
  disconnectedCallback() {
    window.removeEventListener('ceiba-navigated', this._onNav);
    window.removeEventListener('ceiba-legal', this._onLegal);
    window.removeEventListener('popstate', this._onPop);
    window.removeEventListener('hashchange', this._onPop);
    super.disconnectedCallback();
  }

  _setTitle() {
    const n = NAV.find((x) => x.id === store.state.view);
    document.title = n && n.id !== 'inicio' ? `${n.label} · ${SITE.name}` : `${SITE.name} · ${SITE.fullName}`;
  }

  async _afterNav({ view, anchor }) {
    await this.updateComplete;
    this._setTitle();
    const el = this.renderRoot.querySelector(VIEW_TAGS[view]);
    if (!el) return;
    await el.updateComplete;
    if (anchor) {
      const found = await el.focusAnchor(anchor);
      if (found) return;
    }
    const main = this.renderRoot.querySelector('main');
    const top = main.getBoundingClientRect().top + window.scrollY - 90;
    window.scrollTo({ top: Math.max(0, top), behavior: store.state.reduceMotion ? 'auto' : 'smooth' });
    el.focusAnchor('');
  }

  // ---------- Ventanas legales (BORRADORES para revisión jurídica) --------------------
  _pending(v) { return v || html`<span class="chip pending">Por definir</span>`; }

  _legalContent(id) {
    const draft = html`<p class="draft">${icon('alert', 18)}<span><strong>Borrador para revisión jurídica.</strong> Sustituye los campos «Por definir» y valida el texto con el área legal antes de publicar.</span></p>`;
    const c = SITE.contact;
    switch (id) {
      case 'privacidad': return { title: 'Aviso de privacidad integral', body: html`${draft}
        <p>Este aviso se elabora conforme a la Ley Federal de Protección de Datos Personales en Posesión de los Particulares (publicada en el Diario Oficial de la Federación el 20 de marzo de 2025).</p>
        <h3>Responsable</h3><p>${this._pending(SITE.privacyController)}, con domicilio en ${this._pending(c.address)}, es responsable del tratamiento de tus datos personales.</p>
        <h3>Datos que recabamos</h3><p>Nombre, correo electrónico, rango de edad, perfil, carrera o institución, semestre, programas de interés, nivel de participante y el mensaje que escribas. Si eres menor de 18 años: nombre y correo de tu madre, padre o tutor y su autorización. No solicitamos datos personales sensibles.</p>
        <h3>Finalidades necesarias</h3><ul><li>Registrar tu inscripción y contactarte sobre el programa elegido.</li><li>Asignar tu nivel y acompañamiento.</li><li>Generar estadísticas agregadas y anónimas de los indicadores del programa.</li></ul>
        <h3>Finalidad secundaria (opcional)</h3><p>Enviarte el boletín de CEIBA, solo si activas el conmutador correspondiente. Puedes negarte o revocar esta finalidad en cualquier momento sin afectar tu inscripción.</p>
        <h3>Transferencias</h3><p>No transferimos tus datos a terceros sin tu consentimiento, salvo las excepciones que marca la ley.</p>
        <h3>Derechos ARCO y revocación</h3><p>Puedes acceder, rectificar, cancelar u oponerte al tratamiento de tus datos, así como revocar tu consentimiento, escribiendo a ${this._pending(c.email)}. Responderemos en los plazos que establece la ley.</p>
        <h3>Datos en este navegador</h3><p>Tus preferencias y resultados del diagnóstico se guardan en tu propio navegador solo si lo permites, y puedes borrarlos desde «Preferencias de almacenamiento». Este sitio no usa cookies de rastreo ni herramientas de analítica.</p>
        <h3>Cambios al aviso</h3><p>Publicaremos cualquier cambio en esta misma sección. Última actualización: ${SITE.lastUpdate}.</p>` };
      case 'terminos': return { title: 'Términos de uso', body: html`${draft}
        <p>El contenido de este sitio es informativo y educativo. Los resultados de los diagnósticos son orientativos y el equipo de CEIBA los confirma con cada participante.</p>
        <p>Las metas (por ejemplo, la visión) y las propuestas (por ejemplo, fórmulas de indicadores) se identifican con etiquetas y no constituyen resultados alcanzados.</p>
        <p>Los textos, ilustraciones y la marca CEIBA pertenecen a sus titulares. Consulta los créditos de imágenes para conocer autores y licencias.</p>` };
      case 'accesibilidad': return { title: 'Declaración de accesibilidad', body: html`
        <p>Diseñamos este sitio con la meta de cumplir las Pautas de Accesibilidad para el Contenido Web (WCAG) 2.2, nivel AA. Aún no cuenta con una auditoría externa.</p>
        <h3>Qué incluye</h3><ul>
          <li>Navegación completa con teclado, enlace «Saltar al contenido» y foco visible.</li>
          <li>Texto alternativo en imágenes informativas; las decorativas se ocultan a lectores de pantalla.</li>
          <li>Etiquetas visibles en todos los campos y mensajes de error que explican cómo corregir.</li>
          <li>Tamaño de letra ajustable (90 % a 150 %), alto contraste, reducción de movimiento y tema oscuro automático.</li>
          <li>Modo sencillo con explicaciones para niñas y niños, y lectura en voz alta de cada sección.</li>
          <li>El estado nunca depende solo del color: siempre lleva texto o icono.</li></ul>
        <h3>¿Encontraste una barrera?</h3><p>Escríbenos a ${this._pending(c.email)} indicando la página y el problema.</p>` };
      case 'terceros': return { title: 'Integraciones de terceros', body: html`
        <p>Este sitio no incluye publicidad, píxeles de seguimiento, analítica ni redes sociales incrustadas. Solo carga estos recursos externos:</p>
        <div class="tbl"><table><thead><tr><th>Servicio</th><th>Para qué</th><th>Qué recibe</th></tr></thead><tbody>
          <tr><td>jsDelivr (CDN)</td><td>Entregar la librería Lit (componentes) y qrcode-generator (solo al generar un QR)</td><td>Dirección IP y datos técnicos del navegador</td></tr>
          <tr><td>Google Fonts</td><td>Tipografías Bricolage Grotesque y Atkinson Hyperlegible</td><td>Dirección IP y datos técnicos del navegador</td></tr>
          <tr><td>Servicio del formulario</td><td>Recibir inscripciones (${SITE.formEndpoint ? 'activo' : 'desactivado en esta demostración'})</td><td>Los datos que envíes en el formulario</td></tr>
        </tbody></table></div>
        <p>Para eliminar estas dependencias en producción, aloja Lit, la librería QR y las fuentes en tu propio servidor (ver README).</p>` };
      case 'creditos': return { title: 'Créditos de imágenes', body: html`
        <div class="tbl"><table><thead><tr><th>Recurso</th><th>Autor / fuente</th><th>Licencia</th></tr></thead><tbody>
          ${SITE.imageCredits.map((cr) => html`<tr><td>${cr.asset}</td><td>${this._pending(cr.author)}</td><td>${this._pending(cr.license)}</td></tr>`)}
        </tbody></table></div>
        <p>Toda fotografía que se agregue debe incluir autor, fuente, licencia y, si aparecen personas, su autorización de uso de imagen (y la de su tutor si es menor de edad).</p>` };
      case 'testimonios': return { title: 'Política de testimonios', body: html`
        <ul><li>Solo publicamos testimonios de participantes reales que lo autorizaron por escrito.</li>
          <li>Cada testimonio indica nombre, cohorte, fuente y fecha de consentimiento.</li>
          <li>No publicamos reseñas anónimas, pagadas, incentivadas, inventadas ni generadas con inteligencia artificial.</li>
          <li>No editamos el sentido de un testimonio; solo corregimos ortografía con permiso.</li>
          <li>Retiramos un testimonio en un máximo de 5 días hábiles si la persona lo solicita o si no se puede verificar.</li></ul>` };
      case 'editorial': return { title: 'Política editorial', body: html`
        <p>Cada afirmación del sitio se clasifica para evitar afirmaciones sin respaldo:</p>
        <ul><li><span class="chip done">Realizado</span> Hecho documentado por el equipo (por ejemplo, la capacitación hacia SB64).</li>
          <li><span class="chip meta">Meta</span> Aspiración del programa, no un logro (por ejemplo, la visión).</li>
          <li><span class="chip prop">Propuesta</span> Diseño aún no validado (por ejemplo, fórmulas y umbrales de indicadores).</li>
          <li><span class="chip ex">Ejemplo ilustrativo</span> Caso hipotético para explicar un concepto.</li></ul>
        <p>No publicamos cifras de impacto sin su fuente. Si detectas un dato sin respaldo, escríbenos a ${this._pending(c.email)}.</p>` };
      case 'cookies': return { title: 'Preferencias de almacenamiento', body: html`
        <p>Podemos recordar en este navegador tu tamaño de letra, modo sencillo, contraste, nivel, ruta y resultados de diagnóstico. Nada de esto se envía a ningún servidor.</p>
        <p>Estado actual: <strong>${store.state.consent === 'accepted' ? 'Permitido' : store.state.consent === 'rejected' ? 'Solo lo esencial' : 'Sin decidir'}</strong>.</p>
        <div class="row" style="margin-top:1rem">
          <ui-button icon="check" @ui-click=${() => { store.setConsent('accepted'); toast('Guardaremos tus preferencias en este navegador.', 'ok'); }}>Permitir</ui-button>
          <ui-button variant="secondary" @ui-click=${() => { store.setConsent('rejected'); toast('Solo usaremos lo esencial. Borramos tus datos guardados.', 'info'); }}>Solo lo esencial</ui-button>
          <ui-button variant="danger" icon="close" @ui-click=${() => { store.clearAll(); toast('Borramos todos tus datos de este navegador.', 'ok'); }}>Borrar mis datos</ui-button>
        </div>` };
      default: return null;
    }
  }

  _banner() {
    if (store.state.consent) return nothing;
    return html`<div class="banner" role="region" aria-label="Aviso de almacenamiento">
      ${icon('shield', 26)}
      <p>¿Podemos recordar tus preferencias (letra, modo sencillo, resultados) <strong>solo en este navegador</strong>? No usamos cookies de rastreo ni analítica. <a href="#" @click=${(e) => { e.preventDefault(); openLegal('privacidad'); }}>Aviso de privacidad</a></p>
      <div class="row" style="--gap:.5rem">
        <ui-button size="sm" @ui-click=${() => { store.setConsent('accepted'); toast('Listo. Recordaremos tus preferencias.', 'ok'); }}>Permitir</ui-button>
        <ui-button size="sm" variant="ghost" @ui-click=${() => { store.setConsent('rejected'); toast('Entendido. No guardaremos nada.', 'info'); }}>Solo lo esencial</ui-button>
      </div>
    </div>`;
  }

  render() {
    const s = store.state;
    const legal = this._legal ? this._legalContent(this._legal) : null;
    return html`
      <a class="skip" href="#main" @click=${(e) => { e.preventDefault(); this.renderRoot.querySelector('main')?.focus(); }}>Saltar al contenido</a>
      <ceiba-header></ceiba-header>
      <div class="layout">
        <aside aria-label="Barra lateral: recorrido, filtros y accesibilidad"><ceiba-sidebar></ceiba-sidebar></aside>
        <main id="main" tabindex="-1">
          ${Object.entries(VIEW_TAGS).map(([id, tag]) => {
            const hidden = s.view !== id;
            switch (tag) {
              case 'view-inicio': return html`<view-inicio ?hidden=${hidden}></view-inicio>`;
              case 'view-nosotros': return html`<view-nosotros ?hidden=${hidden}></view-nosotros>`;
              case 'view-programas': return html`<view-programas ?hidden=${hidden}></view-programas>`;
              case 'view-diagnostico': return html`<view-diagnostico ?hidden=${hidden}></view-diagnostico>`;
              case 'view-iniciativas': return html`<view-iniciativas ?hidden=${hidden}></view-iniciativas>`;
              case 'view-indicadores': return html`<view-indicadores ?hidden=${hidden}></view-indicadores>`;
              case 'view-calendario': return html`<view-calendario ?hidden=${hidden}></view-calendario>`;
              case 'view-testimonios': return html`<view-testimonios ?hidden=${hidden}></view-testimonios>`;
              default: return html`<view-participa ?hidden=${hidden}></view-participa>`;
            }
          })}
        </main>
      </div>
      <ceiba-footer></ceiba-footer>
      <ui-modal ?open=${!!legal} heading=${legal?.title || ''} @ui-close=${() => { this._legal = ''; }}>
        <div class="legal">${legal?.body || nothing}</div>
      </ui-modal>
      ${this._banner()}
      <ui-toast-stack></ui-toast-stack>`;
  }
}
customElements.define('ceiba-app', CeibaApp);

// Exponer utilidades para integraciones externas (CMS, otras apps, consola):
window.CEIBA = { store, navigate, toast, openLegal, legal: LEGAL_LINKS.map((l) => l.id) };
