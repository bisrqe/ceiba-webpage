import { ABOUT, COMPONENTS, PROGRAMS, INITIATIVES, INDICATORS, GLOSSARY, LEVELS } from './content.js';
import { DIAGNOSTICS } from './diagnostics.js';
import { normalize } from '../core/utils.js';

// Índice de búsqueda generado a partir del contenido. Cada entrada sabe a qué vista,
// ancla y categoría llevar. Si agregas contenido, añade aquí su entrada.
function build() {
  const I = [];
  const add = (title, text, view, anchor = '', category = '', kind = 'Sección') => I.push({ title, text, view, anchor, category, kind, hay: normalize(`${title} ${text}`) });

  add('Quiénes somos', 'CEIBA Capacitación e Incidencia en Bienestar Ambiental', 'nosotros', '', '', 'Sección');
  add(ABOUT.mision.title, ABOUT.mision.text, 'nosotros', 'mision');
  add(ABOUT.vision.title, ABOUT.vision.text, 'nosotros', 'vision');
  add(ABOUT.objetivo.title, ABOUT.objetivo.text, 'nosotros', 'objetivo');
  COMPONENTS.forEach((c) => add(c.title, c.text, 'programas', 'top', c.id, 'Programa'));

  const P = PROGRAMS;
  add('Público objetivo · Eventos internacionales', P.internacionales.publico, 'programas', 'publico', 'internacionales', 'Programa');
  add(P.internacionales.sb64.title, P.internacionales.sb64.text, 'programas', 'sb64', 'internacionales', 'Programa');
  P.internacionales.skills.forEach((s) => add(s.title, `${s.question} ${s.excellent} ${s.evidence}`, 'programas', 'habilidades', 'internacionales', 'Habilidad'));
  add('Medición e indicadores · niveles 1 a 4', `${P.internacionales.measurement} Inicial En desarrollo Competente Destacado`, 'programas', 'medicion', 'internacionales', 'Programa');
  P.internacionales.sessions.forEach((s) => add(`Sesión ${s.n}: ${s.title}`, s.text, 'programas', 'sesiones', 'internacionales', 'Sesión'));

  add('Semana Tec · público objetivo', P.semanatec.publico, 'programas', 'publico', 'semanatec', 'Programa');
  add('Semana Tec · metodología', `${P.semanatec.metodologia} ${P.semanatec.sectors.join(' ')}`, 'programas', 'metodologia', 'semanatec', 'Programa');
  add('Semana Tec · entrega y medidores', `${P.semanatec.entrega} ${P.semanatec.result.text}`, 'programas', 'entrega', 'semanatec', 'Programa');
  add('Semana Tec · mejora de indicadores', 'Sensibilización Interés Calidad inicial final', 'programas', 'mejora', 'semanatec', 'Programa');

  add('Programa Anual · público objetivo', P.anual.publico, 'programas', 'publico', 'anual', 'Programa');
  LEVELS.forEach((l) => add(`Nivel ${l.label}`, `${l.desc} Condición de avance: ${l.advance}`, 'programas', 'niveles', 'anual', 'Nivel'));
  add('Duración del programa', 'Primer periodo investigación y diseño, segundo periodo implementación e impacto', 'programas', 'duracion', 'anual', 'Programa');
  P.anual.accompaniment.forEach((s) => add(s.title, s.steps.join(' · '), 'programas', 'acompanamiento', 'anual', 'Metodología'));

  INITIATIVES.forEach((sec) => {
    add(`Iniciativas del ${sec.title.toLowerCase()}`, sec.def, 'iniciativas', `sector-${sec.id}`, '', 'Iniciativa');
    sec.items.forEach((it) => add(it.title, it.text, 'iniciativas', `sector-${sec.id}`, '', 'Iniciativa'));
  });

  add('Cadena de resultados', INDICATORS.chain.map((c) => `${c.title} ${c.text}`).join(' '), 'indicadores', 'cadena', '', 'Indicadores');
  [...INDICATORS.process.s1, ...INDICATORS.process.s2].forEach((k) => add(k.title, `${k.num} ${k.den}`, 'indicadores', 'proceso', '', 'Indicador'));
  INDICATORS.results.forEach((g) => add(g.title, g.items.join(' '), 'indicadores', 'resultados', '', 'Indicador'));
  add('Instrumentos de recolección de información', INDICATORS.instruments.join(' '), 'indicadores', 'instrumentos', '', 'Indicadores');

  Object.values(DIAGNOSTICS).forEach((d) => add(d.title, `${d.subtitle} examen evaluación encuesta`, 'diagnostico', '', d.category, 'Diagnóstico'));
  add('Calendario anual', 'Semana Tec COP Bonn SB capacitación agosto septiembre octubre noviembre diciembre enero febrero marzo abril mayo junio julio', 'calendario', '', '', 'Calendario');
  add('Inscripción y contacto', 'formulario participa registro contacto', 'participa', '', '', 'Formulario');
  add('Testimonios verificados', 'reseñas opiniones experiencias', 'testimonios', '', '', 'Sección');
  Object.values(GLOSSARY).forEach((g) => add(g.term, g.def, 'nosotros', 'glosario', '', 'Glosario'));
  return I;
}

let INDEX = null;
export function search(query, limit = 8) {
  const q = normalize(query).trim();
  if (q.length < 2) return [];
  INDEX = INDEX || build();
  const terms = q.split(/\s+/);
  return INDEX
    .map((e) => {
      let score = 0;
      for (const t of terms) {
        if (!e.hay.includes(t)) return null;
        score += normalize(e.title).includes(t) ? 3 : 1;
      }
      return { ...e, score };
    })
    .filter(Boolean)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}
