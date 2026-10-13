/**
 * <ceiba-bot> · Widget de chat de CEIBA bot (Web Component sin dependencias).
 * -----------------------------------------------------------------------------
 * USO EN CUALQUIER PÁGINA (incluido el sitio CEIBA hecho con Lit):
 *
 *   <script type="module" src="https://TU-SERVIDOR/widget/ceiba-bot.js"></script>
 *   <ceiba-bot api="https://TU-SERVIDOR"></ceiba-bot>
 *
 * Atributos:
 *   api       → URL del backend (sin / final). Vacío = mismo dominio.   ← EDITA AQUÍ al incrustarlo
 *   mode      → "floating" (burbuja en la esquina, por defecto) | "inline" (ocupa su contenedor)
 *   position  → "right" (por defecto) | "left"
 *   open      → si está presente, el chat inicia abierto
 *   title     → nombre visible (por defecto lo toma del backend)
 *
 * PERSONALIZAR COLORES desde la página anfitriona (sin tocar este archivo):
 *   ceiba-bot { --cb-primary: #1E6B4F; --cb-accent: #F2B33D; }
 *
 * DISEÑO ADAPTABLE:
 *   · Celular (< 600 px): pantalla completa; menú de acciones en 2 columnas justo
 *     arriba de la caja de texto (zona del pulgar); plegable.
 *   · Tablet (600 a 1023 px): ventana flotante; botones en filas que se acomodan.
 *   · Laptop (≥ 1024 px): en modo "inline", el menú pasa a una columna lateral.
 *   · Enter envía en equipos con mouse; en pantallas táctiles Enter hace salto de
 *     línea y se envía con el botón ➤ (evita envíos accidentales).
 */

const DEFAULT_TOKENS = `
  :host {
    --cb-primary: #1E6B4F; --cb-primary-strong: #14503A; --cb-primary-soft: #DCEBE3;
    --cb-accent: #F2B33D; --cb-bg: #F6FAF7; --cb-surface: #FFFFFF; --cb-ink: #14231C;
    --cb-muted: #4B5D54; --cb-line: #D1DCD4; --cb-focus: #1C6A9C; --cb-bad: #B42318;
    --cb-radius: 18px; --cb-font: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  }
  @media (prefers-color-scheme: dark) {
    :host(:not([theme="light"])) {
      --cb-primary: #5CC196; --cb-primary-strong: #8AD8B5; --cb-primary-soft: #1D3A2E;
      --cb-bg: #0F1814; --cb-surface: #17231D; --cb-ink: #E8F2EC; --cb-muted: #A9BDB2;
      --cb-line: #2C3E35; --cb-focus: #7CC4F0;
    }
  }
  :host([theme="dark"]) {
    --cb-primary: #5CC196; --cb-primary-strong: #8AD8B5; --cb-primary-soft: #1D3A2E;
    --cb-bg: #0F1814; --cb-surface: #17231D; --cb-ink: #E8F2EC; --cb-muted: #A9BDB2;
    --cb-line: #2C3E35; --cb-focus: #7CC4F0;
  }
`;

const STYLES = `
  ${DEFAULT_TOKENS}
  :host { font-family: var(--cb-font); color: var(--cb-ink); }
  * { box-sizing: border-box; }
  button { font: inherit; cursor: pointer; }
  :focus-visible { outline: 3px solid var(--cb-focus); outline-offset: 2px; }
  .sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }

  /* ---------- Burbuja de lanzamiento ---------- */
  .launcher { position: fixed; bottom: max(16px, env(safe-area-inset-bottom)); right: 16px; z-index: 2147483000;
    display: inline-flex; align-items: center; gap: .5rem; min-height: 56px; padding: 0 1.1rem 0 .9rem;
    border: none; border-radius: 999px; background: var(--cb-primary); color: #fff; font-weight: 700;
    box-shadow: 0 10px 30px rgba(0,0,0,.22); }
  :host([position="left"]) .launcher { right: auto; left: 16px; }
  .launcher .dot { position: absolute; top: 6px; right: 8px; width: 12px; height: 12px; border-radius: 50%;
    background: var(--cb-accent); border: 2px solid var(--cb-primary); }
  :host([data-open]) .launcher { display: none; }
  :host([mode="inline"]) .launcher { display: none; }

  /* ---------- Panel ---------- */
  .panel { position: fixed; z-index: 2147483001; display: none; flex-direction: column; background: var(--cb-bg);
    inset: 0; height: 100dvh; width: 100vw; }                                  /* celular: pantalla completa */
  :host([data-open]) .panel, :host([mode="inline"]) .panel { display: flex; }
  :host([mode="inline"]) .panel { position: relative; inset: auto; width: 100%; height: 100%; min-height: 520px;
    border: 1px solid var(--cb-line); border-radius: var(--cb-radius); overflow: hidden; }

  header { display: flex; align-items: center; gap: .7rem; padding: .7rem .9rem; padding-top: max(.7rem, env(safe-area-inset-top));
    background: var(--cb-primary); color: #fff; }
  header .avatar { width: 38px; height: 38px; border-radius: 50%; background: rgba(255,255,255,.18); display: grid; place-items: center; font-size: 1.25rem; }
  header .who { flex: 1; min-width: 0; }
  header strong { display: block; font-size: 1.02rem; }
  header small { opacity: .85; }
  .icon-btn { width: 44px; height: 44px; border-radius: 12px; border: none; background: transparent; color: inherit; font-size: 1.25rem; }
  .icon-btn:hover { background: rgba(255,255,255,.14); }
  :host([mode="inline"]) .close { display: none; }

  .body { flex: 1; display: flex; flex-direction: column; min-height: 0; }      /* menú DEBAJO de la conversación: zona del pulgar */
  .convo { flex: 1; display: flex; flex-direction: column; min-width: 0; min-height: 0; }

  /* ---------- Conversación ---------- */
  .log { flex: 1; overflow-y: auto; padding: 1rem .9rem .5rem; display: flex; flex-direction: column; gap: .55rem; scroll-behavior: smooth; }
  .msg { max-width: 88%; padding: .65rem .85rem; border-radius: var(--cb-radius); line-height: 1.45; font-size: .97rem; word-wrap: break-word; }
  .msg.bot { align-self: flex-start; background: var(--cb-surface); border: 1px solid var(--cb-line); border-bottom-left-radius: 6px; }
  .msg.user { align-self: flex-end; background: var(--cb-primary); color: #fff; border-bottom-right-radius: 6px; }
  .msg a { color: var(--cb-primary-strong); font-weight: 600; }
  .msg.user a { color: #fff; }
  .msg.error { border-color: var(--cb-bad); }

  .card { align-self: flex-start; width: min(100%, 340px); background: var(--cb-surface); border: 1px solid var(--cb-line);
    border-left: 4px solid var(--cb-primary); border-radius: 14px; padding: .8rem .9rem; display: flex; flex-direction: column; gap: .4rem; }
  .card .tag { font-size: .74rem; font-weight: 700; letter-spacing: .02em; color: var(--cb-muted); text-transform: uppercase; }
  .card h4 { margin: 0; font-size: 1rem; line-height: 1.3; }
  .card p { margin: 0; font-size: .92rem; color: var(--cb-muted); white-space: pre-line; }
  .card .actions { display: flex; flex-wrap: wrap; gap: .4rem; margin-top: .2rem; }
  .card a.btn, .card button { display: inline-flex; align-items: center; min-height: 40px; padding: 0 .85rem; border-radius: 999px;
    border: 1.5px solid var(--cb-primary); color: var(--cb-primary-strong); background: transparent; font-weight: 700; font-size: .88rem; text-decoration: none; }
  .card a.btn.primary { background: var(--cb-primary); color: #fff; }

  .typing { align-self: flex-start; display: inline-flex; gap: 5px; padding: .75rem .9rem; background: var(--cb-surface);
    border: 1px solid var(--cb-line); border-radius: var(--cb-radius); }
  .typing span { width: 7px; height: 7px; border-radius: 50%; background: var(--cb-muted); animation: blink 1.2s infinite; }
  .typing span:nth-child(2) { animation-delay: .2s; } .typing span:nth-child(3) { animation-delay: .4s; }
  @keyframes blink { 0%, 80%, 100% { opacity: .25; } 40% { opacity: 1; } }

  /* Respuestas rápidas (chips) de la última respuesta del bot */
  .quick { display: flex; flex-wrap: wrap; gap: .45rem; padding: .25rem .9rem .6rem; }
  .chip { min-height: 44px; padding: .45rem .95rem; border-radius: 999px; border: 1.5px solid var(--cb-primary);
    background: var(--cb-surface); color: var(--cb-primary-strong); font-weight: 600; font-size: .92rem; text-align: left; }
  .chip:hover { background: var(--cb-primary-soft); }

  /* ---------- Menú de acciones: CELULAR por defecto (2 columnas, zona del pulgar) ---------- */
  .actions-menu { order: 2; display: grid; grid-template-columns: 1fr 1fr; gap: .45rem; padding: .55rem .9rem;
    border-top: 1px solid var(--cb-line); background: var(--cb-surface); max-height: 46vh; overflow-y: auto; }
  .actions-menu[hidden] { display: none; }
  .actions-menu:not([hidden]) + .convo .quick { display: none; }   /* con el menú abierto, sin chips repetidos */
  .action { min-height: 48px; padding: .5rem .6rem; border-radius: 12px; border: 1px solid var(--cb-line);
    background: var(--cb-bg); color: var(--cb-ink); font-weight: 600; font-size: .9rem; text-align: left; line-height: 1.25; }
  .action:hover { border-color: var(--cb-primary); background: var(--cb-primary-soft); }

  /* ---------- Caja de texto ---------- */
  form { display: flex; align-items: flex-end; gap: .45rem; padding: .55rem .7rem; padding-bottom: max(.55rem, env(safe-area-inset-bottom));
    border-top: 1px solid var(--cb-line); background: var(--cb-surface); }
  textarea { flex: 1; resize: none; min-height: 46px; max-height: 120px; padding: .7rem .85rem; border-radius: 14px;
    border: 1.5px solid var(--cb-line); background: var(--cb-bg); color: var(--cb-ink); font: inherit; font-size: 1rem; line-height: 1.35; }
  textarea:focus { border-color: var(--cb-primary); outline: none; box-shadow: 0 0 0 3px var(--cb-primary-soft); }
  .menu-toggle { width: 46px; height: 46px; border-radius: 14px; border: 1.5px solid var(--cb-line); background: var(--cb-bg); color: var(--cb-ink); font-size: 1.15rem; }
  .menu-toggle[aria-expanded="true"] { background: var(--cb-primary-soft); border-color: var(--cb-primary); }
  .send { width: 50px; height: 46px; border-radius: 14px; border: none; background: var(--cb-primary); color: #fff; font-size: 1.2rem; }
  .send:disabled { opacity: .45; cursor: not-allowed; }

  /* ---------- TABLET (≥ 600 px): ventana flotante, botones que se acomodan ---------- */
  @media (min-width: 600px) {
    :host(:not([mode="inline"])) .panel { inset: auto 20px 20px auto; width: 400px; height: min(680px, calc(100dvh - 40px));
      border-radius: var(--cb-radius); border: 1px solid var(--cb-line); box-shadow: 0 18px 50px rgba(0,0,0,.25); overflow: hidden; }
    :host([position="left"]:not([mode="inline"])) .panel { inset: auto auto 20px 20px; }
    .actions-menu { display: flex; flex-wrap: wrap; }
    .action { flex: 1 1 45%; }
  }

  /* ---------- LAPTOP (≥ 1024 px) ---------- */
  @media (min-width: 1024px) {
    :host(:not([mode="inline"])) .panel { width: 420px; height: min(720px, calc(100dvh - 48px)); }
    .action { font-size: .93rem; }
    /* En modo inline (página completa) el menú se vuelve una columna lateral siempre visible */
    :host([mode="inline"]) .body { flex-direction: row; }
    :host([mode="inline"]) .actions-menu { display: flex !important; flex-direction: column; flex-wrap: nowrap; width: 260px;
      max-height: none; border-top: none; border-left: 1px solid var(--cb-line); padding: 1rem; }
    :host([mode="inline"]) .actions-menu .action { flex: 0 0 auto; }
    :host([mode="inline"]) .menu-toggle { display: none; }
  }

  @media (prefers-reduced-motion: reduce) {
    .log { scroll-behavior: auto; }
    .typing span { animation: none; opacity: .7; }
  }
`;

const STORAGE_KEY = 'ceiba-bot-session';

/** Markdown ligero → HTML SEGURO. Primero escapa todo; luego aplica negritas, cursivas y enlaces http(s)/mailto. */
function renderMarkdown(text) {
  const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  let html = esc(String(text ?? ''));
  html = html.replace(/\[([^\]]+)\]\(((?:https?:\/\/|mailto:)[^)\s]+)\)/g,
    (_, label, url) => `<a href="${url}" target="_blank" rel="noopener noreferrer">${label}</a>`);
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/(^|[\s(])_(.+?)_(?=[\s.,;:!?)]|$)/g, '$1<em>$2</em>');
  html = html.replace(/(^|[\s(])\*(?!\s)(.+?)\*(?=[\s.,;:!?)]|$)/g, '$1<em>$2</em>');
  return html.replace(/\n/g, '<br>');
}

function sessionId() {
  const make = () => (crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random().toString(16).slice(2)).replace(/[^A-Za-z0-9_-]/g, '');
  try {
    let id = localStorage.getItem(STORAGE_KEY);
    if (!id) { id = make(); localStorage.setItem(STORAGE_KEY, id); }
    return id;
  } catch { return make(); }                 // navegación privada o almacenamiento bloqueado
}

class CeibaBot extends HTMLElement {
  static get observedAttributes() { return ['open']; }

  constructor() {
    super();
    this.root = this.attachShadow({ mode: 'open' });
    this.sid = sessionId();
    this.busy = false;
    this.started = false;
    this.cfg = { name: this.getAttribute('title') || 'CEIBA bot', typing: { typing_delay_ms_per_char: 12, typing_delay_max_ms: 1400 }, menu: [] };
    this.coarse = window.matchMedia('(pointer: coarse)').matches;
    this.reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  get api() { return (this.getAttribute('api') || '').replace(/\/$/, ''); }

  connectedCallback() {
    this.render();
    this.loadConfig();
    if (this.hasAttribute('open') || this.getAttribute('mode') === 'inline') this.openPanel(false);
  }

  attributeChangedCallback(name, _old, value) {
    if (name === 'open' && this.isConnected && value !== null) this.openPanel(false);
  }

  render() {
    this.root.innerHTML = `
      <style>${STYLES}</style>
      <button class="launcher" part="launcher" aria-haspopup="dialog" aria-expanded="false" aria-controls="panel">
        <span aria-hidden="true">🌳</span><span class="label">${this.cfg.name}</span>
      </button>
      <section class="panel" id="panel" part="panel" role="dialog" aria-label="${this.cfg.name}">
        <header>
          <div class="avatar" aria-hidden="true">🌳</div>
          <div class="who"><strong class="name">${this.cfg.name}</strong><small>Capacitación e Incidencia en Bienestar Ambiental</small></div>
          <button class="icon-btn close" aria-label="Cerrar chat">✕</button>
        </header>
        <div class="body">
          <nav class="actions-menu" aria-label="Menú de acciones" hidden></nav>
          <div class="convo">
            <div class="log" role="log" aria-live="polite" aria-relevant="additions"></div>
            <div class="quick" role="group" aria-label="Respuestas sugeridas"></div>
          </div>
        </div>
        <form>
          <button type="button" class="menu-toggle" aria-label="Mostrar menú de acciones" aria-expanded="false">☰</button>
          <label class="sr" for="cb-input">Escribe tu mensaje</label>
          <textarea id="cb-input" rows="1" placeholder="Escribe tu pregunta…" enterkeyhint="${this.coarse ? 'enter' : 'send'}" maxlength="1000"></textarea>
          <button type="submit" class="send" aria-label="Enviar mensaje" disabled>➤</button>
        </form>
      </section>`;

    const $ = (s) => this.root.querySelector(s);
    this.$ = { launcher: $('.launcher'), panel: $('.panel'), log: $('.log'), quick: $('.quick'), menu: $('.actions-menu'),
      toggle: $('.menu-toggle'), input: $('textarea'), send: $('.send'), form: $('form'), close: $('.close') };

    this.$.launcher.addEventListener('click', () => this.openPanel(true));
    this.$.close.addEventListener('click', () => this.closePanel());
    this.$.toggle.addEventListener('click', () => this.toggleMenu());
    this.$.panel.addEventListener('keydown', (e) => { if (e.key === 'Escape' && this.getAttribute('mode') !== 'inline') this.closePanel(); });
    this.$.input.addEventListener('input', () => {
      this.$.send.disabled = !this.$.input.value.trim() || this.busy;
      this.$.input.style.height = 'auto';
      this.$.input.style.height = Math.min(this.$.input.scrollHeight, 120) + 'px';
    });
    // Enter: envía en equipos con mouse/teclado; en táctiles solo el botón envía.
    this.$.input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey && !this.coarse) { e.preventDefault(); this.$.form.requestSubmit(); }
    });
    this.$.form.addEventListener('submit', (e) => {
      e.preventDefault();
      const text = this.$.input.value.trim();
      if (!text || this.busy) return;
      this.$.input.value = ''; this.$.input.style.height = 'auto'; this.$.send.disabled = true;
      this.send({ text }, text);
    });
  }

  async loadConfig() {
    try {
      const r = await fetch(`${this.api}/api/config`);
      if (!r.ok) return;
      this.cfg = { ...this.cfg, ...(await r.json()) };
      this.root.querySelectorAll('.name, .launcher .label').forEach((el) => { el.textContent = this.cfg.name; });
      this.$.panel.setAttribute('aria-label', this.cfg.name);
      this.renderMenu();
    } catch { /* sin conexión: el chat mostrará el error al enviar */ }
  }

  renderMenu() {
    this.$.menu.innerHTML = '';
    for (const item of this.cfg.menu || []) {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'action'; b.textContent = item.label;
      b.addEventListener('click', () => {
        if (window.matchMedia('(max-width: 599px)').matches) this.toggleMenu(false);
        this.send({ payload: item.payload }, item.label);
      });
      this.$.menu.appendChild(b);
    }
  }

  toggleMenu(force) {
    const show = typeof force === 'boolean' ? force : this.$.menu.hidden;
    this.$.menu.hidden = !show;
    this.$.toggle.setAttribute('aria-expanded', String(show));
    this.$.toggle.setAttribute('aria-label', show ? 'Ocultar menú de acciones' : 'Mostrar menú de acciones');
  }

  openPanel(focus) {
    this.setAttribute('data-open', '');
    this.$.launcher.setAttribute('aria-expanded', 'true');
    this.root.querySelector('.launcher .dot')?.remove();
    if (!this.started) { this.started = true; this.send({ event: 'start' }, null); }
    if (focus) setTimeout(() => this.$.input.focus(), 50);
  }

  closePanel() {
    this.removeAttribute('data-open');
    this.$.launcher.setAttribute('aria-expanded', 'false');
    this.$.launcher.focus();
  }

  addBubble(html, who, extraClass = '') {
    const div = document.createElement('div');
    div.className = `msg ${who} ${extraClass}`.trim();
    div.innerHTML = html;
    this.$.log.appendChild(div);
    this.scroll();
    return div;
  }

  addCard(card) {
    const el = document.createElement('article');
    el.className = 'card';
    const tag = card.tag ? `<span class="tag">${renderMarkdown(card.tag)}</span>` : '';
    const body = card.body ? `<p>${renderMarkdown(card.body)}</p>` : '';
    el.innerHTML = `${tag}<h4>${renderMarkdown(card.title)}</h4>${body}<div class="actions"></div>`;
    const actions = el.querySelector('.actions');
    const safe = (u) => /^(https?:\/\/|mailto:)/i.test(u || '');
    if (safe(card.url)) {
      const a = document.createElement('a');
      a.className = 'btn primary'; a.href = card.url; a.target = '_blank'; a.rel = 'noopener noreferrer'; a.textContent = card.url_label || 'Abrir';
      actions.appendChild(a);
    }
    if (safe(card.download_url)) {
      const d = document.createElement('a');
      d.className = 'btn'; d.href = card.download_url; d.target = '_blank'; d.rel = 'noopener noreferrer'; d.setAttribute('download', ''); d.textContent = '📥 Descargar';
      actions.appendChild(d);
    }
    for (const b of card.buttons || []) {
      const btn = document.createElement('button');
      btn.type = 'button'; btn.textContent = b.label;
      btn.addEventListener('click', () => this.send({ payload: b.payload }, b.label));
      actions.appendChild(btn);
    }
    if (!actions.children.length) actions.remove();
    this.$.log.appendChild(el);
    this.scroll();
  }

  setQuick(buttons) {
    this.$.quick.innerHTML = '';
    for (const b of buttons || []) {
      const chip = document.createElement('button');
      chip.type = 'button'; chip.className = 'chip'; chip.textContent = b.label;
      chip.addEventListener('click', () => this.send({ payload: b.payload }, b.label));
      this.$.quick.appendChild(chip);
    }
  }

  showTyping() {
    const t = document.createElement('div');
    t.className = 'typing'; t.setAttribute('role', 'status');
    t.innerHTML = '<span></span><span></span><span></span><b class="sr">CEIBA bot está escribiendo…</b>';
    this.$.log.appendChild(t); this.scroll();
    return t;
  }

  scroll() { this.$.log.scrollTop = this.$.log.scrollHeight; }
  wait(ms) { return new Promise((r) => setTimeout(r, ms)); }

  async send(body, echo) {
    if (this.busy) return;
    this.busy = true; this.$.send.disabled = true;
    if (echo) this.addBubble(renderMarkdown(echo), 'user');
    this.setQuick([]);
    const typing = this.showTyping();
    try {
      const r = await fetch(`${this.api}/api/chat`, { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: this.sid, ...body }) });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const reply = await r.json();
      const { typing_delay_ms_per_char: perChar = 12, typing_delay_max_ms: max = 1400 } = this.cfg.typing || {};
      for (const [i, m] of (reply.messages || []).entries()) {
        if (i > 0 || echo) await this.wait(this.reduced ? 120 : Math.min(max, m.length * perChar));
        this.$.log.insertBefore(Object.assign(document.createElement('div'), { className: 'msg bot', innerHTML: renderMarkdown(m) }), typing);
        this.scroll();
      }
      typing.remove();
      for (const c of reply.cards || []) this.addCard(c);
      this.setQuick(reply.buttons);
      if (!this.hasAttribute('data-open') && this.getAttribute('mode') !== 'inline' && !this.root.querySelector('.launcher .dot')) {
        this.$.launcher.insertAdjacentHTML('beforeend', '<span class="dot" aria-hidden="true"></span>');
      }
    } catch (err) {
      typing.remove();
      const bubble = this.addBubble('No pude conectarme con CEIBA bot. Revisa tu conexión e inténtalo de nuevo.', 'bot', 'error');
      const retry = document.createElement('button');
      retry.type = 'button'; retry.className = 'chip'; retry.textContent = '🔄 Reintentar';
      retry.addEventListener('click', () => { bubble.remove(); this.setQuick([]); this.busy = false; this.send(body, null); });
      this.$.quick.appendChild(retry);
      console.warn('[ceiba-bot]', err);
    } finally {
      this.busy = false;
      this.$.send.disabled = !this.$.input.value.trim();
    }
  }
}

if (!customElements.get('ceiba-bot')) customElements.define('ceiba-bot', CeibaBot);
export { CeibaBot, renderMarkdown };
