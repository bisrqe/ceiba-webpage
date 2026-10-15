// =============================================================================
// CEIBA · Contenido del sitio
// -----------------------------------------------------------------------------
// Todo el texto vive aquí, separado de los componentes. Para actualizar el sitio
// NO necesitas tocar la lógica: edita estos objetos.
//   · `simple`  → versión en palabras sencillas (se muestra con «Modo sencillo»).
//   · `status`  → 'done' (realizado, con evidencia) | 'meta' (aspiración) |
//                 'prop' (propuesta, aún no validada) | 'ex' (ejemplo ilustrativo).
//   · `null`    → dato pendiente: el sitio lo muestra con la etiqueta «Por definir».
// =============================================================================

export const SITE = {
  name: 'CEIBA',
  fullName: 'Capacitación e Incidencia en Bienestar Ambiental',
  publicUrl: 'https://claude.ai/artifact/HHdm31CAWet4kcUKewN6Aw', // URL pública (la usa el QR). Reemplázala por tu dominio definitivo
  formEndpoint: null,       // URL del servicio que recibe el formulario. null = modo demostración (no envía nada)
  privacyController: null,  // Nombre legal del responsable del tratamiento de datos
  contact: { email: null, phone: null, address: null },
  social: [
    { name: 'Instagram', url: null },
    { name: 'LinkedIn', url: null },
    { name: 'Facebook', url: null },
  ],
  imageCredits: [
    { asset: 'Logotipo e ilustraciones de este prototipo', author: 'Ilustraciones vectoriales originales creadas para el prototipo (provisionales)', license: 'Uso interno del proyecto CEIBA', status: 'prop' },
    { asset: 'Fotografías de eventos (SB64, Semana Tec)', author: null, license: null, status: 'pending' },
    { asset: 'Logotipo oficial de CEIBA', author: null, license: null, status: 'pending' },
  ],
  lastUpdate: '2026-09-24',
};

export const NAV = [
  { id: 'inicio', label: 'Inicio', icon: 'home' },
  { id: 'nosotros', label: 'Quiénes somos', icon: 'users' },
  { id: 'programas', label: 'Programas', icon: 'book' },
  { id: 'diagnostico', label: 'Diagnóstico', icon: 'clipboard' },
  { id: 'iniciativas', label: 'Iniciativas', icon: 'bulb' },
  { id: 'calendario', label: 'Calendario', icon: 'calendar' },
  { id: 'indicadores', label: 'Indicadores', icon: 'chart', more: true },
  { id: 'testimonios', label: 'Testimonios', icon: 'message', more: true },
  { id: 'participa', label: 'Participa', icon: 'pen', cta: true },
];

export const CATEGORIES = [
  { id: 'todas', label: 'Todas las categorías', short: 'Todas' },
  { id: 'internacionales', label: 'Capacitaciones para eventos internacionales', short: 'Eventos internacionales', icon: 'globe' },
  { id: 'semanatec', label: 'Semana Tec: Emergencia Climática', short: 'Semana Tec', icon: 'leaf' },
  { id: 'anual', label: 'Programa Anual de Iniciativas Climáticas', short: 'Programa Anual', icon: 'bulb' },
];

export const LEVELS = [
  {
    id: 'basico', label: 'Básico',
    desc: 'Poco o dominio básico de conceptos de sostenibilidad y política pública. Desconocimiento de herramientas de investigación y desarrollo de una propuesta de iniciativa.',
    simple: 'Estás empezando: conoces pocas palabras y herramientas. Es el mejor punto para aprender.',
    advance: 'Completar los módulos básicos y entregar una idea de iniciativa estructurada.',
  },
  {
    id: 'intermedio', label: 'Intermedio',
    desc: 'Conocimiento y dominio competente de los conceptos necesarios, aún con necesidades observables para diseñar o implementar una iniciativa.',
    simple: 'Ya conoces los conceptos. Ahora aprendes a convertir tu idea en un plan.',
    advance: 'Contar con una iniciativa validada y un plan de acción bien estructurado.',
  },
  {
    id: 'avanzado', label: 'Avanzado',
    desc: 'Ya cuenta con una iniciativa en alguna fase de diseño o implementación y desea reforzarse o tiene necesidades más específicas.',
    simple: 'Ya tienes un proyecto en marcha y quieres hacerlo crecer.',
    advance: 'Proporcionar evidencia de incidencia o de adopción por un actor externo.',
  },
];

export const PROFILES = [
  {
    id: 'aprender', title: 'Quiero aprender lo básico', icon: 'sparkle',
    text: 'Para quien tiene entre 8 y 14 años o se acerca por primera vez a estos temas. Activa el modo sencillo.',
    route: ['nosotros', 'iniciativas', 'diagnostico', 'calendario'], simple: true,
  },
  {
    id: 'estudiante', title: 'Soy estudiante universitario', icon: 'book',
    text: 'Conoce los programas, descubre tu nivel e inscríbete.',
    route: ['programas', 'diagnostico', 'calendario', 'participa'], simple: false,
  },
  {
    id: 'aliado', title: 'Soy docente, familia o aliado', icon: 'handshake',
    text: 'Entiende quiénes somos, cómo medimos resultados y cómo colaborar.',
    route: ['nosotros', 'indicadores', 'testimonios', 'participa'], simple: false,
  },
];

export const ABOUT = {
  acronym: [
    { letter: 'C', word: 'Capacitación' },
    { letter: 'E', word: 'e' },
    { letter: 'I', word: 'Incidencia' },
    { letter: 'B', word: 'Bienestar' },
    { letter: 'A', word: 'Ambiental' },
  ],
  mision: {
    title: 'Misión',
    text: 'Experimentar, desarrollar y fortalecer capacidades de incidencia en temas de sostenibilidad y cambio climático en estudiantes mediante procesos de formación, colaboración y creación de iniciativas orientadas a la transformación sostenible de sus territorios.',
    simple: 'Enseñamos a jóvenes a entender el cambio climático y a proponer ideas reales para cuidar el lugar donde viven.',
  },
  vision: {
    title: 'Visión', status: 'meta',
    text: 'Convertirse en el laboratorio de referencia para la formación de jóvenes universitarios que diseñan, prueban y escalan soluciones de política pública climática con impacto real en México.',
    simple: 'Soñamos con ser el mejor lugar de México para que jóvenes universitarios creen reglas y proyectos que protejan el clima.',
  },
  objetivo: {
    title: 'Objetivo del programa',
    text: 'Fortalecer las capacidades de incidencia, articulación y liderazgo de la comunidad estudiantil para que participen de manera estratégica y efectiva en la gobernanza climática, desde espacios internacionales hasta contextos locales y universitarios.',
    simple: 'Que las y los estudiantes sepan participar y liderar en las decisiones sobre el clima: desde reuniones mundiales hasta su escuela y su ciudad.',
  },
  team: null, // [{ name, role, photo, photoCredit }] — pendiente de publicar
};

export const COMPONENTS = [
  {
    id: 'internacionales', icon: 'globe', title: 'Capacitaciones para eventos internacionales',
    text: 'Cursos especializados para estudiantes que asisten a eventos internacionales.',
    simple: 'Preparamos a estudiantes que viajan a reuniones mundiales sobre el clima.',
  },
  {
    id: 'semanatec', icon: 'leaf', title: 'Semanas Tec',
    text: 'Socialización de formas de incidencia en cambio climático y políticas públicas.',
    simple: 'Una semana en la que equipos de estudiantes inventan soluciones para problemas reales del clima.',
    link: null, // enlace oficial de la Semana Tec (pendiente)
  },
  {
    id: 'anual', icon: 'bulb', title: 'Programa Anual',
    text: 'Diseño e implementación de políticas públicas con enfoque en sostenibilidad.',
    simple: 'Durante un año acompañamos a jóvenes para que su idea se convierta en un proyecto real.',
  },
];

export const PROGRAMS = {
  internacionales: {
    title: 'Capacitaciones para eventos internacionales',
    publico: 'Actores estudiantiles universitarios que asistan a eventos internacionales dentro de la Convención Marco de las Naciones Unidas sobre el Cambio Climático (CMNUCC), con asistencia o participación confirmada al evento en cuestión.',
    publicoSimple: 'Estudiantes que ya tienen lugar confirmado para ir a una reunión de la ONU sobre el clima.',
    sb64: {
      status: 'done',
      title: 'Capacitaciones hacia SB64',
      text: 'Se capacitó a la segunda generación de estudiantes de Global Leaders for the Future (GLF) para su participación en el Subsidiary Body 64 (SB64) en Bonn, Alemania. El objetivo fue dar herramientas para desarrollar y fortalecer tres habilidades.',
    },
    skills: [
      {
        id: 'comunicacion', title: 'Comunicación estratégica',
        question: '¿Puede el estudiante estructurar un mensaje con objetivo claro?',
        excellent: 'Anticipa objeciones, adapta el tono en tiempo real y logra resonancia en la audiencia.',
        evidence: 'Mensaje memorable: usa narrativa con propósito y la audiencia recuerda el punto central.',
        simple: 'Explicar tu idea para que otras personas la entiendan y la recuerden.',
      },
      {
        id: 'cmnucc', title: 'Conocimiento técnico de la CMNUCC',
        question: '¿Sostiene conversaciones técnicas de la CMNUCC en inglés?',
        excellent: 'Reformula el texto con naturalidad, hace preguntas críticas sobre el contenido y añade contexto propio.',
        evidence: 'Demuestra comprensión profunda y puede debatir el contenido en inglés.',
        simple: 'Entender cómo funcionan las reuniones de la ONU sobre el clima y poder hablar de ello en inglés.',
      },
      {
        id: 'escucha', title: 'Escucha activa e inteligencia cultural',
        question: '¿Reconoce perspectivas distintas a la suya en una discusión?',
        excellent: 'Identifica tensiones entre perspectivas, valida las que difieren de la propia y construye sobre ellas.',
        evidence: 'Logra una síntesis que integra al menos dos posiciones opuestas.',
        simple: 'Escuchar con atención a quien piensa distinto y encontrar puntos en común.',
      },
    ],
    rubric: [
      { n: 1, label: 'Inicial' },
      { n: 2, label: 'En desarrollo' },
      { n: 3, label: 'Competente' },
      { n: 4, label: 'Destacado' },
    ],
    measurement: 'Las competencias se evalúan en cuatro niveles, con puntajes del 1 al 4, al inicio y al final de las capacitaciones mediante un formulario de diagnóstico y un formulario de cierre. Además, cada estudiante entrega un reporte final a GLF con un espacio dedicado a su experiencia y a su desenvolvimiento en el evento. Como el equipo no puede acompañarles presencialmente, ese reporte es la forma de valorar sus habilidades blandas.',
    sessions: [
      { n: 1, title: 'Marco de la CMNUCC, SB64 y COP 31', text: 'Brindar una comprensión general del marco de la CMNUCC dentro de la SB64 y la COP 31 (principales procesos y funcionamiento), para interpretar las discusiones, actores y decisiones del evento. Incluye una comprensión general de la estrategia de Ruta Azul, del Tec y de GLF.' },
      { n: 2, title: 'ONG y organizaciones observadoras', text: 'Visión general del papel de las ONG y asociaciones observadoras dentro del proceso de la CMNUCC: su participación, sus formas de intervención y su influencia en las discusiones y dinámicas del evento.' },
      { n: 3, title: 'Herramientas y plataformas', text: 'Familiarizarse con las herramientas y plataformas de la CMNUCC para consultar información y planificar la participación en el evento.' },
      { n: 4, title: 'Agenda personal con mentoría', text: 'Acompañar a cada participante en la elaboración y ajuste de su agenda personal para el evento, con un mentor de delegaciones previas.' },
    ],
  },

  semanatec: {
    title: 'Semana Tec: Emergencia Climática',
    publico: 'Estudiantes del Tec de Monterrey inscritos en la Semana Tec con Sentido Humano: Emergencia Climática, de todas las carreras y semestres, para asegurar la multidisciplinariedad.',
    publicoSimple: 'Estudiantes de cualquier carrera que eligen esta Semana Tec sobre el clima.',
    metodologia: 'El aula se divide en seis equipos con la mayor variedad de carreras posible. Cada equipo recibe un sector estratégico desde el cual hacer incidencia y, como reto, una situación problema real para dirigir su propuesta de manera específica.',
    metodologiaSimple: 'Se forman equipos con personas de distintas carreras. Cada equipo recibe un problema real y un «lugar» desde donde puede ayudar a resolverlo.',
    sectors: ['Sociedad civil', 'Política pública', 'Expresión artística', 'Investigación y divulgación académica', 'Proyectos ambientales desde el sector privado'],
    entrega: 'En la primera Semana Tec en la que participamos se pidieron dos evidencias: una de investigación y diagnóstico, y otra con la propuesta de iniciativa o solución. La evaluación se realizó con las presentaciones orales del último día.',
    result: { status: 'done', presented: 6, selected: 3, text: 'De las seis iniciativas presentadas, tres se seleccionaron para desarrollarse en el Programa Anual de CEIBA.' },
    mejora: {
      text: 'Detectamos que faltaba medir el impacto y los resultados de la Semana Tec. En las siguientes ediciones se medirá:',
      items: [
        { title: 'Sensibilización', how: 'Ubicación inicial vs. final' },
        { title: 'Interés', how: 'Encuesta inicial vs. final' },
        { title: 'Calidad', how: 'De las propuestas realizadas' },
      ],
    },
  },

  anual: {
    title: 'Programa Anual de Iniciativas Climáticas',
    publico: 'Actores estudiantiles universitarios interesados en política pública o activismo con enfoque en cambio climático o sostenibilidad.',
    publicoSimple: 'Estudiantes universitarios que quieren cambiar reglas o proyectos para cuidar el clima.',
    metodologia: 'Define la estructura, la duración y la forma de acompañamiento para que cada participante desarrolle su iniciativa y, al implementarla, pueda colaborar con el sector público o crecer dentro de él. El perfil de participantes se maneja en tres niveles.',
    periods: [
      { id: 'p1', title: 'Primer periodo', subtitle: 'Investigación y diseño de iniciativas', months: 'Agosto a diciembre' },
      { id: 'p2', title: 'Segundo periodo', subtitle: 'Implementación e impacto de iniciativas', months: 'Enero a julio' },
    ],
    accompaniment: [
      {
        id: 's1', title: 'Primer semestre: ideación y diseño',
        steps: ['Diagnóstico de entrada', 'Identificación del problema e idea de la iniciativa', 'Exploración del tipo de iniciativa desde el cual se abordará', 'Metodologías de diseño', 'Vinculación y presentación a aliados estratégicos para validación'],
      },
      {
        id: 's2', title: 'Segundo semestre: implementación y medidores de impacto',
        steps: ['Planeación e implementación', 'Diseño de indicadores y sistema de medición', 'Implementación y seguimiento', 'Vinculación con tomadores de decisiones', 'Cierre, documentación y proyección'],
      },
    ],
  },
};

export const INITIATIVES = [
  {
    id: 'publico', icon: 'building', title: 'Sector público',
    def: 'Proyectos estratégicos que buscan transformar espacios y dinámicas territoriales. Se enfocan en influir en la gestión gubernamental y optimizar normativas, programas operativos y regulaciones en organismos del gobierno.',
    simple: 'Ideas para mejorar las reglas y los programas del gobierno.',
    items: [
      { id: 'urbanas', title: 'Intervenciones urbanas / política pública', text: 'Proyectos que buscan transformar espacios y dinámicas territoriales mediante cambios en normativas, programas operativos o regulaciones gubernamentales.', textStatus: 'prop', example: 'Proponer al municipio una ruta ciclista segura cerca de una escuela.' },
      { id: 'civil', title: 'Sociedad civil', text: 'Proyectos estratégicos cuyo motor principal reside en la organización ciudadana o comunitaria, orientados a incidir de manera efectiva en la agenda pública y que demandan procesos de interlocución con actores gubernamentales para escalar su impacto social y ambiental.', example: 'Un colectivo vecinal que pide y cuida nuevas áreas verdes junto con su alcaldía.' },
      { id: 'academia', title: 'Academia', text: 'Proyectos estratégicos fundamentados en procesos de investigación o conocimiento académico, orientados a la formulación de recomendaciones de política pública, marcos normativos o programas operativos que cuenten con respaldo y validación institucional.', example: 'Un estudio sobre islas de calor que termina en recomendaciones para el ayuntamiento.' },
    ],
  },
  {
    id: 'privado', icon: 'briefcase', title: 'Sector privado',
    def: 'Iniciativas que buscan transformar prácticas, modelos de negocio o cadenas de valor en empresas, centradas en sostenibilidad y acción climática, y que generan cambio desde dentro o a través de su influencia en el mercado.',
    simple: 'Ideas para que las empresas contaminen menos y cuiden más el ambiente.',
    items: [
      { id: 'pymes', title: 'Pequeñas y medianas empresas (PyMEs)', text: 'Proyectos que apoyan a las PyMEs en la integración de prácticas de sostenibilidad, como eficiencia energética, reducción de la huella de carbono y economía circular, considerando sus capacidades institucionales y su contexto operativo.', example: 'Ayudar a una panadería de barrio a reducir su consumo de gas y electricidad.' },
      { id: 'grandes', title: 'Grandes empresas y corporaciones', text: 'Iniciativas que buscan transformar o incidir en las prácticas ambientales, sociales y de gobernanza de empresas de gran escala.', example: 'Proponer a una empresa que mida y publique su huella de carbono.' },
      { id: 'startups', title: 'Emprendimiento de impacto o startups sostenibles', text: 'Propuestas para crear una empresa nueva cuyo modelo de negocio tenga un propósito ambiental o climático desde el origen.', example: 'Crear una empresa que convierta residuos de cosecha en empaques.' },
    ],
  },
  {
    id: 'mixto', icon: 'handshake', title: 'Sector público-privado',
    def: 'Propuestas que articulan de manera deliberada a actores gubernamentales y empresariales para resolver una problemática de sostenibilidad o acción climática que ninguno podría abordar de forma aislada.',
    simple: 'Ideas en las que el gobierno y las empresas trabajan juntos porque solos no podrían.',
    items: [
      { id: 'infra', title: 'Infraestructura y servicios públicos sostenibles', text: 'El gobierno diseña o concesiona un proyecto físico (planta de energía renovable, sistema de transporte, tratamiento de agua) y el sector privado lo financia.', textStatus: 'prop', example: 'Una planta solar concesionada que abastece al alumbrado público.' },
      { id: 'verde', title: 'Financiamiento verde', text: 'Alianzas cuyo mecanismo central es financiero: el sector público o privado emite instrumentos de deuda etiquetados para proyectos sostenibles.', example: 'Bonos verdes que financian autobuses eléctricos.' },
      { id: 'cadenas', title: 'Cadenas de valor sostenibles', text: 'Alianzas en las que el vínculo público-privado opera a través de la cadena de suministro o del mercado: el gobierno crea incentivos o estándares y las empresas los adoptan.', example: 'Un distintivo oficial que motiva a restaurantes a comprar a productores locales sostenibles.' },
    ],
  },
];

export const INDICATORS = {
  objectives: [
    'Monitorear el avance operativo del programa en sus dos semestres.',
    'Evaluar el desarrollo de capacidades de los participantes en sostenibilidad, diseño de iniciativas e incidencia política.',
    'Documentar y evidenciar el impacto de las iniciativas implementadas.',
    'Proveer información oportuna para la toma de decisiones del equipo coordinador.',
    'Generar aprendizajes institucionales replicables para futuras ediciones del programa.',
  ],
  types: [
    { title: 'Indicadores de proceso', text: 'Miden si el programa se ejecuta conforme a lo planeado (cobertura, retención, entrega de productos).', question: '¿Estamos haciendo lo que planeamos?' },
    { title: 'Indicadores de resultado e impacto', text: 'Miden si el programa genera los cambios esperados en los participantes y el entorno.', question: '¿Está cambiando algo en la realidad que queríamos transformar?' },
  ],
  chain: [
    { id: 'insumos', title: 'Insumos', text: 'Jóvenes universitarios, mentoría, metodologías y redes institucionales.' },
    { id: 'actividades', title: 'Actividades', text: 'Diagnóstico, formación, diseño de iniciativas, implementación y vinculación.' },
    { id: 'productos', title: 'Productos', text: 'Iniciativas estructuradas y documentadas; redes activadas.' },
    { id: 'resultados', title: 'Resultados', text: 'Capacidades fortalecidas, iniciativas implementadas e incidencia política.' },
    { id: 'impacto', title: 'Impacto', text: 'Políticas públicas o prácticas transformadas con liderazgo juvenil.' },
  ],
  // Fórmulas y umbrales = PROPUESTA editable (no están en el documento fuente).
  process: {
    s1: [
      { id: 'reclutamiento', title: 'Tasa de reclutamiento', num: 'Participantes inscritos', den: 'Meta de inscripción' },
      { id: 'diagnosticos', title: 'Diagnósticos de entrada aplicados', num: 'Diagnósticos aplicados', den: 'Participantes inscritos' },
      { id: 'asistencia', title: 'Asistencia promedio a sesiones informativas', num: 'Asistencias registradas', den: 'Participantes × sesiones realizadas' },
      { id: 'diseno', title: 'Iniciativas con diseño metodológico completo', num: 'Iniciativas con diseño completo', den: 'Iniciativas registradas' },
      { id: 'sector', title: 'Iniciativas con tipo de sector definido', num: 'Iniciativas con sector definido', den: 'Iniciativas registradas' },
      { id: 'retencion', title: 'Retención semestral', num: 'Participantes activos al cierre', den: 'Participantes al inicio' },
    ],
    s2: [
      { id: 'avance', title: 'Estudiantes que avanzan al segundo semestre', num: 'Participantes que inician S2', den: 'Participantes que cierran S1' },
      { id: 'planes', title: 'Planes de acción elaborados', num: 'Planes de acción entregados', den: 'Iniciativas activas' },
      { id: 'documentadas', title: 'Iniciativas documentadas', num: 'Iniciativas con documentación completa', den: 'Iniciativas activas' },
      { id: 'actividades', title: 'Actividades de implementación ejecutadas', num: 'Actividades ejecutadas', den: 'Actividades planeadas' },
      { id: 'vinculacion', title: 'Vinculación con tomadores de decisión', num: 'Iniciativas con al menos una reunión con tomador de decisión', den: 'Iniciativas activas' },
    ],
  },
  thresholds: { good: 80, warn: 60 },
  results: [
    { id: 'capacidades', title: 'Desarrollo de capacidades', items: ['Incremento en dominio de conceptos de sostenibilidad', 'Porcentaje de participantes que suben de nivel', 'Percepción de capacidades para incidir en política'] },
    { id: 'calidad', title: 'Calidad de las iniciativas', items: ['Porcentaje de iniciativas con teoría del cambio elaborada', 'Porcentaje de iniciativas con indicadores propios definidos', 'Distribución por tipo de iniciativa', 'Tasa de iniciativas con plan de implementación ejecutado'] },
    { id: 'incidencia', title: 'Incidencia e impacto externo', items: ['Tasa de iniciativas adoptadas por un actor institucional', 'Número de tomadores de decisión alcanzados', 'Iniciativas escaladas o en continuidad post-programa', 'Número de incidencias en política pública documentadas'] },
  ],
  instruments: ['Portafolio de iniciativa', 'Bitácora de seguimiento', 'Lista de asistencia', 'Encuesta de satisfacción y aprendizaje', 'Actas y evidencias de vinculación', 'Evaluación de impacto (post-programa)'],
};

// Calendario anual completo (ciclo agosto → julio). m = mes (1-12).
export const CALENDAR = {
  months: [
    { m: 8, name: 'Agosto', period: 'p1', events: [] },
    { m: 9, name: 'Septiembre', period: 'p1', events: [{ label: 'Semana Tec', cat: 'semanatec' }] },
    { m: 10, name: 'Octubre', period: 'p1', events: [{ label: 'Capacitación COP', cat: 'internacionales' }] },
    { m: 11, name: 'Noviembre', period: 'p1', events: [{ label: 'COP', cat: 'internacionales' }, { label: 'Semana Tec', cat: 'semanatec' }] },
    { m: 12, name: 'Diciembre', period: 'p1', events: [] },
    { m: 1, name: 'Enero', period: 'p2', events: [] },
    { m: 2, name: 'Febrero', period: 'p2', events: [] },
    { m: 3, name: 'Marzo', period: 'p2', events: [{ label: 'Semana Tec', cat: 'semanatec' }] },
    { m: 4, name: 'Abril', period: 'p2', events: [] },
    { m: 5, name: 'Mayo', period: 'p2', events: [{ label: 'Capacitación SB (Bonn)', cat: 'internacionales' }, { label: 'Semana Tec', cat: 'semanatec' }] },
    { m: 6, name: 'Junio', period: 'p2', events: [{ label: 'SB en Bonn', cat: 'internacionales' }] },
    { m: 7, name: 'Julio', period: 'p2', events: [] },
  ],
};

export const GLOSSARY = {
  cmnucc: { term: 'CMNUCC', def: 'Convención Marco de las Naciones Unidas sobre el Cambio Climático: el tratado internacional en el que los países negocian cómo enfrentar el cambio climático. En inglés, UNFCCC.', simple: 'La gran reunión de países de la ONU para ponerse de acuerdo sobre el clima.' },
  cop: { term: 'COP', def: 'Conferencia de las Partes: la reunión anual de máxima decisión de la CMNUCC. La COP 31 corresponde a 2026.', simple: 'La reunión más grande del año sobre el clima.' },
  sb: { term: 'SB (Órganos Subsidiarios)', def: 'Sesiones técnicas de la CMNUCC que preparan las decisiones de la COP. Se celebran habitualmente a mitad de año en Bonn, Alemania. SB64 es la sesión número 64.', simple: 'Reuniones de preparación antes de la COP.' },
  incidencia: { term: 'Incidencia', def: 'Acciones organizadas para influir en decisiones públicas o institucionales: leyes, programas, presupuestos o prácticas.', simple: 'Convencer con argumentos a quienes toman decisiones.' },
  politica: { term: 'Política pública', def: 'Decisiones y acciones del gobierno para atender un problema público, como una ley, un programa o un reglamento.', simple: 'Las reglas y programas que hace el gobierno para resolver problemas.' },
  sostenibilidad: { term: 'Sostenibilidad', def: 'Satisfacer las necesidades del presente sin comprometer la capacidad de las generaciones futuras para satisfacer las suyas.', simple: 'Usar lo que necesitamos hoy sin dejar sin nada a quienes vienen después.' },
  gobernanza: { term: 'Gobernanza climática', def: 'La forma en que gobiernos, empresas, sociedad civil y academia toman y coordinan decisiones sobre el clima.', simple: 'Cómo se organizan todos para decidir sobre el clima.' },
  glf: { term: 'GLF', def: 'Global Leaders for the Future: programa con el que CEIBA capacitó a estudiantes rumbo a la SB64.', simple: 'Un grupo de estudiantes líderes que viajan a reuniones internacionales.' },
  ong: { term: 'ONG', def: 'Organización No Gubernamental. En la CMNUCC, las organizaciones observadoras pueden asistir, dar seguimiento y hacer aportaciones a las negociaciones.', simple: 'Grupos de personas que no son gobierno y trabajan por una causa.' },
  teoria: { term: 'Teoría del cambio', def: 'Explicación paso a paso de cómo las actividades de una iniciativa producen los resultados y el impacto que se buscan.', simple: 'El mapa que explica cómo tu idea va a lograr el cambio.' },
  pymes: { term: 'PyMEs', def: 'Pequeñas y medianas empresas.', simple: 'Negocios pequeños y medianos, como una tienda o un taller.' },
};

// Testimonios: SOLO se publican si `verified: true`, con consentimiento y fuente.
// Estructura: { name, role, cohort, quote, verified: true, consentDate: 'AAAA-MM-DD', source: 'Encuesta de cierre 2026' }
export const TESTIMONIALS = [];
