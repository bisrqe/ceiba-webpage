// Genera versiones de UN SOLO ARCHIVO del sitio (sin dependencias de Node en tiempo de ejecución):
//   dist/index.html   → documento completo, listo para cualquier hosting o CMS
//   dist/artifact.html → fragmento sin <html>/<head>/<body> (para plataformas que añaden su propio esqueleto)
// Uso: node build.mjs
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(fileURLToPath(import.meta.url));
const LIT = "import { LitElement, html, css, svg, nothing } from 'https://cdn.jsdelivr.net/npm/lit@3.2.1/+esm';";

const main = readFileSync(join(ROOT, 'src', 'main.js'), 'utf8');
const files = [...main.matchAll(/^import '\.\/(.+?)';$/gm)].map((m) => m[1]).filter((f) => f !== 'core/lit.js');

const seen = new Map();
let code = '';
for (const f of files) {
  let src = readFileSync(resolve(ROOT, 'src', f), 'utf8');
  src = src.replace(/^import\s.+?;\s*$/gm, '');            // imports de una línea
  src = src.replace(/^export\s+(const|let|function|class|async function)\s/gm, '$1 ');
  for (const m of src.matchAll(/^(?:const|let|function|class|async function)\s+([A-Za-z_$][\w$]*)/gm)) {
    if (seen.has(m[1])) throw new Error(`Nombre duplicado «${m[1]}» en ${f} y ${seen.get(m[1])}`);
    seen.set(m[1], f);
  }
  code += `\n// ===== src/${f} =====\n${src.trim()}\n`;
}

const tokens = readFileSync(join(ROOT, 'src/styles/tokens.css'), 'utf8');
const fonts = '<link rel="preconnect" href="https://fonts.googleapis.com">\n<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible:ital,wght@0,400;0,700;1,400&family=Bricolage+Grotesque:opsz,wght@12..96,500..800&display=swap">';
const boot = `<ceiba-app><div class="boot" role="status"><div><strong>CEIBA</strong><span id="boot-msg">Cargando el sitio…</span><div class="bar" aria-hidden="true"><i></i></div></div></div></ceiba-app>
<script>setTimeout(function(){if(!customElements.get('ceiba-app')){var m=document.getElementById('boot-msg');if(m)m.textContent='No pudimos cargar el sitio. Revisa tu conexión a internet y recarga la página.';}},12000);</script>`;
const script = `<script type="module">\n${LIT}\n${code}\n</script>`;
const title = '<title>CEIBA · Capacitación e Incidencia en Bienestar Ambiental</title>';

mkdirSync(join(ROOT, 'dist'), { recursive: true });
writeFileSync(join(ROOT, 'dist/bundle.js'), `${LIT}\n${code}`);
writeFileSync(join(ROOT, 'dist/artifact.html'), `${title}\n${fonts}\n<style>\n${tokens}\n</style>\n${boot}\n${script}\n`);
writeFileSync(join(ROOT, 'dist/index.html'), `<!DOCTYPE html>\n<html lang="es-MX">\n<head>\n<meta charset="UTF-8">\n<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n${title}\n<meta name="theme-color" content="#1E6B4F">\n${fonts}\n<style>\n${tokens}\n</style>\n</head>\n<body>\n${boot}\n${script}\n</body>\n</html>\n`);
console.log(`OK · ${files.length} módulos · ${(code.length / 1024).toFixed(1)} KB de código`);
