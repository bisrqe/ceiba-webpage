import { html, svg } from './lit.js';

// Iconos de trazo (24×24). Son decorativos: el texto visible o aria-label describe la acción.
const P = {
  home: svg`<path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/><path d="M10 20v-6h4v6"/>`,
  users: svg`<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.8-3.5 3.4-5.5 6.5-5.5s5.7 2 6.5 5.5"/><circle cx="17" cy="9" r="2.5"/><path d="M16.5 14.6c2.6.2 4.4 2 5 4.9"/>`,
  book: svg`<path d="M4 4h6a2 2 0 0 1 2 2v14a2 2 0 0 0-2-2H4z"/><path d="M20 4h-6a2 2 0 0 0-2 2v14a2 2 0 0 1 2-2h6z"/>`,
  clipboard: svg`<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4V3h6v1"/><path d="M9 13l2 2 4-4"/>`,
  bulb: svg`<path d="M9 18h6"/><path d="M10 21h4"/><path d="M12 3a6 6 0 0 0-4 10.5c.7.7 1 1.5 1 2.5h6c0-1 .3-1.8 1-2.5A6 6 0 0 0 12 3z"/>`,
  chart: svg`<path d="M4 20V11"/><path d="M10 20V5"/><path d="M16 20v-7"/><path d="M3 20h18"/>`,
  calendar: svg`<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18"/><path d="M8 3v4"/><path d="M16 3v4"/>`,
  message: svg`<path d="M4 5h16v11H9l-5 4z"/><path d="M8 9h8"/><path d="M8 12h5"/>`,
  pen: svg`<path d="M4 20l4-1 11-11-3-3L5 16z"/><path d="M14 6l3 3"/>`,
  search: svg`<circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/>`,
  menu: svg`<path d="M4 7h16"/><path d="M4 12h16"/><path d="M4 17h16"/>`,
  close: svg`<path d="M6 6l12 12"/><path d="M18 6L6 18"/>`,
  sliders: svg`<path d="M4 7h10"/><path d="M18 7h2"/><path d="M4 17h4"/><path d="M12 17h8"/><circle cx="16" cy="7" r="2"/><circle cx="10" cy="17" r="2"/>`,
  speaker: svg`<path d="M4 10v4h4l5 4V6L8 10z"/><path d="M16 9a4 4 0 0 1 0 6"/><path d="M18.5 6.5a8 8 0 0 1 0 11"/>`,
  contrast: svg`<circle cx="12" cy="12" r="9"/><path d="M12 3a9 9 0 0 1 0 18z" fill="currentColor"/>`,
  text: svg`<path d="M3 19l5-14 5 14"/><path d="M5 14h6"/><path d="M14 19l3.5-9 3.5 9"/><path d="M15.2 16h4.6"/>`,
  qr: svg`<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><path d="M14 14h3v3h-3z"/><path d="M20 14v1"/><path d="M14 20h1"/><path d="M18 18h3v3h-3z"/>`,
  check: svg`<path d="M5 12.5l4.5 4.5L19 7.5"/>`,
  arrowR: svg`<path d="M5 12h14"/><path d="M13 6l6 6-6 6"/>`,
  arrowL: svg`<path d="M19 12H5"/><path d="M11 6l-6 6 6 6"/>`,
  chevron: svg`<path d="M6 9l6 6 6-6"/>`,
  copy: svg`<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h8"/>`,
  info: svg`<circle cx="12" cy="12" r="9"/><path d="M12 11v5"/><path d="M12 8h.01"/>`,
  alert: svg`<path d="M12 3l10 18H2z"/><path d="M12 10v4"/><path d="M12 17h.01"/>`,
  leaf: svg`<path d="M5 19c0-8 5-14 15-14 0 10-6 15-14 15"/><path d="M5 19l8-8"/>`,
  globe: svg`<circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3c3 3 3 15 0 18"/><path d="M12 3c-3 3-3 15 0 18"/>`,
  link: svg`<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>`,
  mail: svg`<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>`,
  phone: svg`<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/>`,
  pin: svg`<path d="M12 21s-7-6.2-7-12a7 7 0 0 1 14 0c0 5.8-7 12-7 12z"/><circle cx="12" cy="9" r="2.5"/>`,
  share: svg`<circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="6" r="2.5"/><circle cx="18" cy="18" r="2.5"/><path d="M8.2 10.9l7.6-3.8"/><path d="M8.2 13.1l7.6 3.8"/>`,
  shield: svg`<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/><path d="M9 12l2 2 4-4"/>`,
  building: svg`<path d="M4 21h16"/><path d="M6 21V10"/><path d="M18 21V10"/><path d="M12 3l9 5H3z"/><path d="M10 21v-6h4v6"/>`,
  briefcase: svg`<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V5h6v2"/><path d="M3 13h18"/>`,
  handshake: svg`<path d="M2 12l4-4 4 2 2-1 2 1 4-2 4 4"/><path d="M6 8l6 7 6-7"/><path d="M9 11.5l3 3.5 3-3.5"/>`,
  target: svg`<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5"/>`,
  sparkle: svg`<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/><path d="M19 17l.7 1.8 1.8.7-1.8.7L19 22l-.7-1.8-1.8-.7 1.8-.7z"/>`,
  lock: svg`<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>`,
  refresh: svg`<path d="M20 11a8 8 0 0 0-14.3-4.9L4 8"/><path d="M4 3v5h5"/><path d="M4 13a8 8 0 0 0 14.3 4.9L20 16"/><path d="M20 21v-5h-5"/>`,
};

export function icon(name, size = 20) {
  const body = P[name] || P.info;
  return html`<svg class="icon" width=${size} height=${size} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${body}</svg>`;
}

// Logotipo provisional (ilustración original). Reemplázalo por el logotipo oficial en SVG.
export function logo(size = 40) {
  return html`<svg width=${size} height=${size} viewBox="0 0 48 48" role="img" aria-label="Logotipo de CEIBA: ilustración de un árbol de ceiba con copa amplia" focusable="false">
    <circle cx="14.5" cy="20" r="10" fill="var(--c-primary)"/>
    <circle cx="33.5" cy="20" r="10" fill="var(--c-primary)"/>
    <circle cx="24" cy="14" r="11.5" fill="var(--c-leaf)"/>
    <path d="M21.6 24h4.8v11.5c0 2.6 3.6 5.6 8.6 6.5H13c5-.9 8.6-3.9 8.6-6.5z" fill="var(--c-trunk)"/>
    <circle cx="36" cy="9" r="3.2" fill="var(--c-accent)"/>
  </svg>`;
}
