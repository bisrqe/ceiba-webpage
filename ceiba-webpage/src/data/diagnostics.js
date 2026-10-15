import { PROGRAMS } from './content.js';

// Motor de diagnósticos basado en datos. Tipos de pregunta:
//   'choice' → opción múltiple (con `correct` opcional y retroalimentación)
//   'rubric' → autoevaluación en 4 niveles (Inicial … Destacado)
//   'scale'  → ubicación en una línea de 0 a 10 (control deslizante)
// Para agregar un diagnóstico nuevo, añade una entrada a DIAGNOSTICS con `questions` y `score()`.

const rubricOptions = (skill) => [
  { value: 1, label: 'Inicial', text: 'Aún no lo logro.' },
  { value: 2, label: 'En desarrollo', text: 'Lo logro con apoyo o solo a veces.' },
  { value: 3, label: 'Competente', text: 'Lo logro por mi cuenta la mayoría de las veces.' },
  { value: 4, label: 'Destacado', text: skill.excellent },
];

export const DIAGNOSTICS = {
  anual: {
    id: 'anual',
    category: 'anual',
    title: 'Diagnóstico de entrada',
    subtitle: 'Programa Anual · te sugiere un nivel (Básico, Intermedio o Avanzado)',
    duration: '5 minutos',
    moments: null,
    intro: 'Responde con sinceridad. «Aún no lo sé» también es una respuesta válida: después de cada pregunta verás una explicación breve.',
    simple: 'Son 6 preguntas. No es un examen con calificación: sirve para saber por dónde empezar.',
    questions: [
      {
        id: 'q1', type: 'choice', prompt: '¿Qué significa «sostenibilidad»?',
        options: [
          { value: 'a', text: 'Satisfacer las necesidades de hoy sin comprometer las de las generaciones futuras.' },
          { value: 'b', text: 'Reciclar papel y plástico.' },
          { value: 'c', text: 'Plantar árboles en la ciudad.' },
          { value: 'x', text: 'Aún no lo sé.' },
        ],
        correct: 'a',
        explain: 'Reciclar y reforestar ayudan, pero sostenibilidad es un concepto más amplio: equilibrar lo ambiental, lo social y lo económico a largo plazo.',
      },
      {
        id: 'q2', type: 'choice', prompt: '¿Qué es hacer incidencia en política pública?',
        options: [
          { value: 'a', text: 'Compartir publicaciones en redes sociales.' },
          { value: 'b', text: 'Influir de forma organizada y con evidencia en decisiones del gobierno o de instituciones.' },
          { value: 'c', text: 'Votar en las elecciones.' },
          { value: 'x', text: 'Aún no lo sé.' },
        ],
        correct: 'b',
        explain: 'La incidencia combina evidencia, propuestas concretas y diálogo con quienes toman decisiones. Las redes y el voto pueden ser parte, pero no son lo mismo.',
      },
      {
        id: 'q3', type: 'choice', prompt: '¿Cuál es la diferencia entre mitigación y adaptación al cambio climático?',
        options: [
          { value: 'a', text: 'Son sinónimos.' },
          { value: 'b', text: 'La mitigación es para ciudades y la adaptación para el campo.' },
          { value: 'c', text: 'La mitigación reduce las emisiones que lo causan; la adaptación prepara a las comunidades para sus efectos.' },
          { value: 'x', text: 'Aún no lo sé.' },
        ],
        correct: 'c',
        explain: 'Ejemplo: usar energía solar es mitigación; diseñar calles que no se inunden es adaptación.',
      },
      {
        id: 'q4', type: 'choice', prompt: '¿Qué es la CMNUCC?',
        options: [
          { value: 'a', text: 'El tratado de la ONU en el que los países negocian acciones frente al cambio climático.' },
          { value: 'b', text: 'Una organización civil mexicana.' },
          { value: 'c', text: 'Un programa de becas universitarias.' },
          { value: 'x', text: 'Aún no lo sé.' },
        ],
        correct: 'a',
        explain: 'La CMNUCC (UNFCCC en inglés) organiza cada año la COP y, a mitad de año, las sesiones SB en Bonn.',
      },
      {
        id: 'q5', type: 'choice', prompt: '¿Qué es una teoría del cambio?',
        options: [
          { value: 'a', text: 'Una teoría de física sobre la energía.' },
          { value: 'b', text: 'Una explicación de cómo tus actividades llevan a los resultados e impacto que buscas.' },
          { value: 'c', text: 'Un tipo de encuesta de satisfacción.' },
          { value: 'x', text: 'Aún no lo sé.' },
        ],
        correct: 'b',
        explain: 'Es el «mapa» de tu iniciativa: insumos → actividades → productos → resultados → impacto.',
      },
      {
        id: 'q6', type: 'choice', prompt: '¿En qué punto está tu iniciativa?',
        options: [
          { value: 'none', text: 'Aún no tengo una idea.' },
          { value: 'idea', text: 'Tengo una idea, pero todavía sin estructura.' },
          { value: 'design', text: 'Mi iniciativa está en fase de diseño.' },
          { value: 'impl', text: 'Mi iniciativa ya se está implementando.' },
        ],
        explain: 'Esta respuesta no tiene opción correcta: nos dice cuánto acompañamiento necesitas.',
      },
    ],
    // Regla de nivel (alineada a los perfiles del programa):
    //  · Avanzado: ya tiene iniciativa en diseño o implementación.
    //  · Intermedio: domina los conceptos (≥ 4 de 5 correctas).
    //  · Básico: en cualquier otro caso.
    score(answers) {
      const knowledge = ['q1', 'q2', 'q3', 'q4', 'q5'];
      const correct = knowledge.filter((id) => {
        const q = this.questions.find((x) => x.id === id);
        return answers[id] === q.correct;
      }).length;
      const stage = answers.q6;
      let level = 'basico';
      if (stage === 'design' || stage === 'impl') level = 'avanzado';
      else if (correct >= 4) level = 'intermedio';
      return { level, correct, total: knowledge.length };
    },
  },

  internacionales: {
    id: 'internacionales',
    category: 'internacionales',
    title: 'Diagnóstico de habilidades',
    subtitle: 'Capacitaciones para eventos internacionales · formulario inicial y de cierre',
    duration: '3 minutos',
    moments: [{ id: 'inicial', label: 'Diagnóstico inicial' }, { id: 'cierre', label: 'Formulario de cierre' }],
    intro: 'Elige el nivel que mejor te describe hoy en cada habilidad. Responde el diagnóstico inicial antes de las sesiones y el formulario de cierre al terminar para ver tu avance.',
    simple: 'Son 3 preguntas sobre cómo hablas, cuánto sabes y cómo escuchas. Elige la frase que más se parece a ti.',
    questions: PROGRAMS.internacionales.skills.map((skill) => ({
      id: skill.id, type: 'rubric', prompt: skill.question, skill: skill.title, options: rubricOptions(skill),
      explain: `Evidencia de nivel destacado: ${skill.evidence}`,
    })),
    score(answers) {
      const skills = PROGRAMS.internacionales.skills.map((s) => ({ id: s.id, title: s.title, value: Number(answers[s.id] || 0) }));
      const avg = skills.reduce((a, s) => a + s.value, 0) / skills.length;
      return { skills, avg };
    },
  },

  semanatec: {
    id: 'semanatec',
    category: 'semanatec',
    title: 'Encuesta de sensibilización e interés',
    subtitle: 'Semana Tec · aplicación inicial y final',
    duration: '2 minutos',
    moments: [{ id: 'inicial', label: 'Inicio de la Semana Tec' }, { id: 'cierre', label: 'Cierre de la Semana Tec' }],
    intro: 'Esta encuesta mide cómo cambia tu sensibilización e interés durante la Semana Tec. La calidad de las propuestas la evalúa el equipo con una rúbrica en las presentaciones finales.',
    simple: 'Tres preguntas rápidas al inicio y otras tres al final de la semana para ver cuánto cambiaste.',
    questions: [
      { id: 'sens', type: 'scale', prompt: 'Ubícate en la línea: ¿qué tanto afecta el cambio climático a tu comunidad?', min: 0, max: 10, minLabel: 'Nada', maxLabel: 'Muchísimo', explain: 'Mide sensibilización mediante ubicación inicial vs. final.' },
      {
        id: 'int', type: 'choice', prompt: '¿Qué tanto te interesa participar en una iniciativa climática?',
        options: [
          { value: '1', text: 'Nada' }, { value: '2', text: 'Poco' }, { value: '3', text: 'Algo' }, { value: '4', text: 'Bastante' }, { value: '5', text: 'Muchísimo' },
        ],
        explain: 'Mide interés mediante encuesta inicial vs. final.',
      },
      {
        id: 'forms', type: 'choice', prompt: '¿Cuántas formas de hacer incidencia climática podrías explicar a otra persona?',
        options: [
          { value: '0', text: 'Ninguna todavía' }, { value: '1', text: 'Una' }, { value: '2', text: 'Dos' }, { value: '3', text: 'Tres o más' },
        ],
        explain: 'Los sectores de la Semana Tec son: sociedad civil, política pública, expresión artística, investigación académica y proyectos del sector privado.',
      },
    ],
    score(answers) {
      return { sens: Number(answers.sens ?? 0), int: Number(answers.int ?? 0), forms: Number(answers.forms ?? 0) };
    },
  },
};
