import { css } from './lit.js';

// Estilos compartidos que cada componente adopta dentro de su Shadow DOM.
// Solo usan variables de tokens.css, así que responden a tema, contraste y tamaño de letra.
export const shared = css`
  :host { display: block; font-family: var(--font-body); color: var(--c-ink); }
  *, *::before, *::after { box-sizing: border-box; }
  [hidden] { display: none !important; }
  [id] { scroll-margin-top: calc(var(--header-h) + 24px); }
  h1, h2, h3, h4 { font-family: var(--font-display); line-height: 1.15; text-wrap: balance; margin: 0; color: var(--c-ink); }
  h1 { font-size: clamp(2.4rem, 1.6rem + 3.4vw, 4.2rem); font-weight: 800; letter-spacing: -.02em; }
  h2 { font-size: clamp(1.7rem, 1.25rem + 1.6vw, 2.4rem); font-weight: 750; letter-spacing: -.01em; }
  h3 { font-size: 1.22rem; font-weight: 700; }
  h4 { font-size: 1.02rem; font-weight: 700; }
  p { margin: 0; max-width: 68ch; }
  ul, ol { margin: 0; padding-left: 1.2rem; }
  li + li { margin-top: .35rem; }
  a { color: var(--c-sky); text-underline-offset: 3px; }
  button { font: inherit; color: inherit; }
  input, select, textarea { font: inherit; color: inherit; }
  :focus-visible { outline: 3px solid var(--c-focus); outline-offset: 2px; }
  .icon { flex: none; }

  .stack { display: flex; flex-direction: column; gap: var(--gap, 1rem); }
  .row { display: flex; flex-wrap: wrap; gap: var(--gap, .75rem); align-items: center; }
  .grid { display: grid; gap: var(--gap, 1rem); grid-template-columns: repeat(auto-fit, minmax(min(100%, var(--min, 250px)), 1fr)); }
  .card { background: var(--c-surface); border: 1px solid var(--c-line); border-radius: var(--radius-m); padding: 1.25rem; }
  .card.soft { background: var(--c-surface-2); border-color: transparent; }
  .muted { color: var(--c-muted); }
  .small { font-size: .9rem; }
  .lead { font-size: 1.15rem; color: var(--c-muted); }
  .num { font-variant-numeric: tabular-nums; }
  .eyebrow { font-size: .78rem; letter-spacing: .1em; text-transform: uppercase; font-weight: 700; color: var(--c-primary); }
  .sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0; }

  /* Etiquetas de estado: dicen si algo ya ocurrió, es meta o es propuesta (afirmaciones con respaldo) */
  .chip { display: inline-flex; align-items: center; gap: .35rem; font-size: .78rem; font-weight: 700; line-height: 1.2;
    padding: .25rem .6rem; border-radius: 999px; background: var(--c-surface-2); color: var(--c-muted); white-space: nowrap; }
  .chip.done { background: var(--c-ok-soft); color: var(--c-ok); }
  .chip.meta { background: var(--c-sky-soft); color: var(--c-sky); }
  .chip.prop { background: var(--c-warn-soft); color: var(--c-warn); }
  .chip.pending { background: transparent; color: var(--c-warn); border: 1.5px dashed currentColor; }
  .chip.ex { background: var(--c-accent-soft); color: var(--c-accent-ink); }

  /* Cabecera de cada vista */
  .view-head { display: flex; flex-wrap: wrap; align-items: flex-end; justify-content: space-between; gap: 1rem; padding-bottom: 1.25rem; border-bottom: 1px solid var(--c-line); }
  .view-head .titles { display: flex; flex-direction: column; gap: .5rem; min-width: 0; flex: 1 1 420px; }
  .view-head h2:focus { outline: none; }
  article { display: flex; flex-direction: column; gap: 2rem; }
  section { display: flex; flex-direction: column; gap: 1rem; scroll-margin-top: calc(var(--header-h) + 16px); }

  /* Caja de "modo sencillo" (para niñas y niños o primera visita) */
  .simple-box { display: flex; gap: .85rem; align-items: flex-start; background: var(--c-accent-soft); color: var(--c-ink);
    border-radius: var(--radius-m); padding: .9rem 1.1rem; }
  .simple-box .tag { flex: none; font-size: .72rem; font-weight: 800; letter-spacing: .08em; text-transform: uppercase;
    background: var(--c-accent); color: #2a1f00; border-radius: 999px; padding: .25rem .6rem; margin-top: .1rem; }
  .simple-inline { display: block; margin-top: .5rem; padding: .5rem .75rem; border-radius: var(--radius-s); background: var(--c-accent-soft); font-size: .95rem; }

  /* Controles de formulario nativos */
  .field { display: flex; flex-direction: column; gap: .4rem; }
  .field label, .label { font-weight: 700; }
  .hint { font-size: .88rem; color: var(--c-muted); }
  .error { font-size: .9rem; color: var(--c-bad); font-weight: 700; display: flex; gap: .35rem; align-items: center; }
  input[type="text"], input[type="email"], input[type="search"], input[type="url"], input[type="number"], select, textarea {
    width: 100%; min-height: 48px; padding: .7rem .85rem; border-radius: var(--radius-s); border: 1.5px solid var(--c-line);
    background: var(--c-surface); color: var(--c-ink); transition: border-color var(--dur); }
  textarea { min-height: 120px; resize: vertical; }
  input:hover, select:hover, textarea:hover { border-color: var(--c-muted); }
  input:focus-visible, select:focus-visible, textarea:focus-visible { outline: 3px solid var(--c-focus); outline-offset: 1px; border-color: var(--c-focus); }
  [aria-invalid="true"] { border-color: var(--c-bad) !important; }
  .choice { display: flex; gap: .7rem; align-items: flex-start; padding: .8rem .95rem; border: 1.5px solid var(--c-line); border-radius: var(--radius-s);
    background: var(--c-surface); cursor: pointer; transition: border-color var(--dur), background var(--dur); min-height: 48px; }
  .choice:hover { border-color: var(--c-primary); }
  .choice:has(input:checked) { border-color: var(--c-primary); background: var(--c-primary-soft); }
  .choice:has(input:focus-visible) { outline: 3px solid var(--c-focus); outline-offset: 2px; }
  .choice input { margin: .2rem 0 0; width: 1.2rem; height: 1.2rem; accent-color: var(--c-primary); flex: none; }
  input[type="checkbox"], input[type="radio"] { accent-color: var(--c-primary); }

  /* Segmentado (radio group con apariencia de botones) */
  .segmented { display: flex; flex-wrap: wrap; gap: .5rem; }
  .segmented button { display: inline-flex; align-items: center; gap: .5rem; min-height: 46px; padding: .55rem 1rem; border-radius: 999px;
    border: 1.5px solid var(--c-line); background: var(--c-surface); cursor: pointer; font-weight: 700; transition: all var(--dur); }
  .segmented button:hover { border-color: var(--c-primary); }
  .segmented button[aria-pressed="true"], .segmented button[aria-selected="true"], .segmented button[aria-checked="true"] {
    background: var(--c-primary); color: var(--c-surface); border-color: var(--c-primary); }

  .flash { animation: flash var(--dur-slow) ease 2; }
  @keyframes flash { 50% { box-shadow: 0 0 0 6px var(--c-accent); } }
  .pending-text { font-style: italic; color: var(--c-warn); }
`;
