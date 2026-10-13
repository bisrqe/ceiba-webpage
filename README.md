# CEIBA · Sitio web (demo funcional)

Sitio de **CEIBA · Capacitación e Incidencia en Bienestar Ambiental**, construido con **Web Components estándar + Lit 3.2.1**. No depende de React, Angular ni de un entorno local: cualquier servidor estático, CMS o app híbrida puede cargarlo.

## 1. Ejecutar

```bash
# Opción A: versión modular (desarrollo). Requiere servidor HTTP (los módulos ES no cargan con file://)
npx serve .            # abre http://localhost:3000

# Opción B: un solo archivo (producción rápida)
node build.mjs         # genera dist/index.html (documento completo) y dist/artifact.html (fragmento)
```

Publica `dist/index.html` en GitHub Pages, Netlify, Vercel, S3 o dentro de un CMS. Nada requiere Node en producción.

## 2. Arquitectura

```
index.html                 ← entrada modular (carga src/main.js)
build.mjs                  ← empaqueta todo en un archivo, detecta nombres duplicados
src/
  styles/tokens.css        ← ÚNICA fuente de colores, fuentes y radios (tema claro/oscuro/alto contraste)
  core/  lit.js · store.js · utils.js · icons.js · styles.js · base.js
  data/  content.js        ← TODO el texto del sitio (editar aquí, no en los componentes)
         diagnostics.js    ← motor de exámenes diagnósticos (datos + reglas de puntaje)
         search-index.js   ← índice de la barra de búsqueda
  components/  ui-button · ui-switch · ui-progress · ui-toast · ui-modal · ui-term · ui-qr · ui-search
               ui-button.ts  (versión TypeScript con decoradores, equivalente)
  layout/      ceiba-header · ceiba-sidebar · ceiba-footer
  views/       inicio · nosotros · programas · diagnostico · iniciativas · indicadores · calendario · testimonios · participa
  app.js       ← <ceiba-app>: layout, enrutador por hash, ventanas legales, aviso de almacenamiento
```

| Zona | Componente | Contenido |
|---|---|---|
| Cabecera | `<ceiba-header>` | Logotipo, navegación, menú «Más» (dropdown), búsqueda, accesibilidad, CTA «Participa» |
| Barra lateral | `<ceiba-sidebar>` | Recorrido con progreso, filtros (categoría = dropdown, nivel = radios), switches de accesibilidad, QR |
| Cuerpo | `view-*` | 9 secciones; se conservan montadas para no perder lo escrito al navegar |
| Pie | `<ceiba-footer>` | Mapa del sitio, legales, contacto, redes, © y créditos |

**Orden lógico de la experiencia:** Inicio (elige perfil → ruta sugerida) → Quiénes somos → Programas (3 pestañas) → Diagnóstico (3 exámenes) → Iniciativas (explorador + «mi idea») → Calendario → Indicadores → Testimonios → Participa (formulario que precarga nivel e idea).

## 3. Cambiar la paleta (Canva)

Edita solo el bloque `:root` de `src/styles/tokens.css` (`--c-primary`, `--c-accent`, `--c-sky`, neutros). Todos los componentes heredan las variables a través del Shadow DOM. Después ajusta los bloques de tema oscuro con tonos más claros de los mismos colores y verifica contraste AA (4.5:1 para texto).

## 4. Editar contenido

Todo vive en `src/data/content.js`. Convenciones:

- `simple`: versión en palabras sencillas (se muestra con «Modo sencillo»).
- `status`: `done` (Realizado), `meta` (Meta), `prop` (Propuesta), `ex` (Ejemplo ilustrativo). Evita afirmaciones sin respaldo.
- `null`: dato pendiente; el sitio muestra la etiqueta «Por definir».
- `TESTIMONIALS`: solo se publican entradas con `verified: true`, `consentDate`, `source`, `name` y `quote`.

Datos pendientes de llenar: `SITE.contact`, `SITE.social`, `SITE.privacyController`, `SITE.imageCredits`, `SITE.publicUrl`, `SITE.formEndpoint`, `ABOUT.team`, `COMPONENTS[1].link` (enlace Semana Tec).

## 5. Agregar componentes (ejemplo real: código QR)

`ui-qr` se agregó sin tocar el resto del sitio. El patrón:

1. Crea `src/components/ui-mi-componente.js`:

```js
import { LitElement, html, css } from '../core/lit.js';
export class UIMiComponente extends LitElement {
  static properties = { valor: { type: String } };
  static styles = css`:host { display: block; color: var(--c-ink); }`;   // usa tokens
  constructor() { super(); this.valor = ''; }                              // NO uses campos de clase para propiedades reactivas
  render() { return html`<p>${this.valor}</p>`; }
}
customElements.define('ui-mi-componente', UIMiComponente);
```

2. Impórtalo en `src/main.js` (antes de `layout/` y `views/`).
3. Úsalo como etiqueta HTML en cualquier vista: `<ui-mi-componente valor="Hola"></ui-mi-componente>`.
4. Si carga una librería externa, hazlo bajo demanda (ver `loadLib()` en `ui-qr.js`) y regístrala en «Integraciones de terceros» (`app.js`).

QR en cualquier página externa, sin el resto del sitio:

```html
<script type="module" src="https://tu-dominio.mx/ceiba/components/ui-qr.js"></script>
<ui-qr value="https://tu-dominio.mx/ceiba#participa" label="QR para inscribirte en CEIBA" size="200"></ui-qr>
```

**Agregar una sección nueva:** crea `src/views/view-x.js` extendiendo `CeibaView`, añádela a `NAV` (content.js), a `VIEWS` (store.js), a `VIEW_TAGS` y al `switch` de `app.js`, y a `main.js`.

## 6. Conectar el formulario

Define `SITE.formEndpoint` con la URL de tu servicio (Google Apps Script, Formspree, Supabase Edge Function, API propia). El componente envía `POST` con JSON:

```json
{ "name": "", "email": "", "age": "", "role": "", "school": "", "semester": "", "interests": [], "level": "",
  "message": "", "tutorName": "", "tutorEmail": "", "tutorConsent": false, "newsletter": false, "privacy": true,
  "submittedAt": "ISO-8601", "source": "ceiba-web" }
```

Requisitos del servidor: HTTPS, CORS limitado a tu dominio, validación del lado del servidor (no confíes en la del navegador), límite de peticiones y registro de la fecha de consentimiento. No guardes claves de API en el front-end.

## 7. Consumo desde frameworks

```jsx
// React 19+: soporta Custom Elements de forma nativa (propiedades y eventos).
// React 18: pasa strings como atributos y escucha eventos personalizados con ref + addEventListener.
import './ceiba/components/ui-button.js';   // ruta del bundle, NO una URL remota en un import de bundler
export const Cta = () => <ui-button variant="primary" onui-click={(e) => console.log(e.detail)}>Descargar</ui-button>;
```

Vue: `app.config.compilerOptions.isCustomElement = (tag) => tag.startsWith('ui-') || tag.startsWith('ceiba-')`.

## 8. Accesibilidad y privacidad incluidas

Enlace «Saltar al contenido», navegación con teclado (pestañas con flechas, búsqueda con `/`), foco visible, `aria-live` en notificaciones, etiquetas visibles, errores con resumen enlazado, tamaño de letra 90–150 %, alto contraste, reducir movimiento, tema oscuro, modo sencillo y lectura en voz alta. Aviso de almacenamiento previo a guardar nada, consentimiento explícito en el formulario, consentimiento de tutor para menores y finalidad secundaria (boletín) separada. Los textos legales son **borradores**: requieren revisión jurídica.

## 9. Pendientes detectados en el contenido fuente

1. Semana Tec: el texto dice «seis equipos», pero lista cinco sectores.
2. «Intervenciones urbanas / política pública» repetía la definición de iniciativas público-privadas; se usó un texto derivado de la definición del sector público, marcado «Texto por validar».
3. «Infraestructura y servicios públicos sostenibles» terminaba en coma («…el sector privado lo financia,»); se cerró la frase y se marcó por validar.
4. Hay dos calendarios en la fuente (julio–junio y agosto–julio); se usó el «Calendario anual completo» (agosto–julio).
5. La paleta es provisional: el enlace de Canva no permite lectura automática.
