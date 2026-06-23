import type {
  MuscleGroup,
  ExerciseCategory,
  ReferenceType,
} from '../types';

// Local diacritics-insensitive normaliser (kept independent of useExercises to
// avoid a circular import; behaviour must match normalizeName there).
const COMBINING_MARKS = /[̀-ͯ]/g;

function normalize(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(COMBINING_MARKS, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * A curated, editable knowledge entry for a common exercise.
 *
 * `referenceUrl` is a best-effort curated link: specific YouTube videos where
 * confident, YouTube search deep-links otherwise (these never go stale). Every
 * link is editable by the user and can be replaced from the UI at any time.
 */
export interface ExerciseKnowledgeEntry {
  name: string;
  aliases?: string[];
  description: string;
  purpose: string;
  primaryMuscles: string[];
  secondaryMuscles?: string[];
  equipment?: string[];
  category: ExerciseCategory;
  muscleGroup: MuscleGroup;
  simpleInstructions: string[];
  commonMistakes: string[];
  safetyNotes?: string;
  referenceUrl: string;
  referenceType: ReferenceType;
}

/** Build a YouTube search deep-link (always resolves, never dead). */
function ytSearch(query: string): string {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
}

// ─── Knowledge base ────────────────────────────────────────────────────────────
// Extend this array to teach the app new exercises. Order is irrelevant; lookup
// is by normalised name and aliases.

export const EXERCISE_KNOWLEDGE_BASE: ExerciseKnowledgeEntry[] = [
  {
    name: 'Hip thrust',
    aliases: ['empuje de cadera', 'puente de glúteo con barra', 'hip thrust con barra'],
    description: 'Empuje de cadera con la espalda apoyada en un banco, levantando una carga apoyada sobre la pelvis.',
    purpose: 'Desarrollar fuerza e hipertrofia de glúteos con foco en la extensión de cadera.',
    primaryMuscles: ['Glúteo mayor'],
    secondaryMuscles: ['Isquiotibiales', 'Cuádriceps', 'Core'],
    equipment: ['Barra', 'Banco', 'Discos'],
    category: 'strength',
    muscleGroup: 'glutes',
    simpleInstructions: [
      'Apoyá la parte alta de la espalda en un banco y la barra sobre la cadera.',
      'Plantá los pies al ancho de cadera, talones firmes.',
      'Empujá con los talones extendiendo la cadera hasta alinear tronco y muslos.',
      'Apretá glúteos arriba 1 segundo y bajá controlando.',
    ],
    commonMistakes: [
      'Hiperextender la zona lumbar en vez de extender la cadera.',
      'Subir la cadera con impulso o despegando los talones.',
      'No llegar a la extensión completa de cadera.',
    ],
    safetyNotes: 'Mantené el mentón metido y las costillas abajo; evitá arquear la lumbar.',
    referenceUrl: 'https://www.youtube.com/watch?v=LM8XHLYJoYs',
    referenceType: 'youtube',
  },
  {
    name: 'Sentadilla goblet',
    aliases: ['goblet squat', 'sentadilla copa', 'sentadilla con mancuerna al pecho'],
    description: 'Sentadilla sosteniendo una mancuerna o pesa rusa contra el pecho.',
    purpose: 'Aprender el patrón de sentadilla y fortalecer piernas y core con carga frontal.',
    primaryMuscles: ['Cuádriceps', 'Glúteos'],
    secondaryMuscles: ['Aductores', 'Core', 'Espalda alta'],
    equipment: ['Mancuerna', 'Pesa rusa'],
    category: 'strength',
    muscleGroup: 'legs',
    simpleInstructions: [
      'Sostené la pesa contra el pecho con ambas manos.',
      'Pies al ancho de hombros, puntas levemente afuera.',
      'Bajá flexionando cadera y rodillas, pecho erguido.',
      'Empujá con los talones para volver a subir.',
    ],
    commonMistakes: [
      'Dejar caer el pecho hacia adelante.',
      'Que las rodillas colapsen hacia adentro.',
      'Levantar los talones del piso.',
    ],
    safetyNotes: 'Bajá solo hasta donde puedas mantener la espalda neutra.',
    referenceUrl: 'https://www.youtube.com/watch?v=MeIiIdhvXT4',
    referenceType: 'youtube',
  },
  {
    name: 'Sentadilla con barra',
    aliases: ['back squat', 'sentadilla trasera', 'sentadilla'],
    description: 'Sentadilla con barra apoyada en la espalda alta.',
    purpose: 'Construir fuerza global de tren inferior.',
    primaryMuscles: ['Cuádriceps', 'Glúteos'],
    secondaryMuscles: ['Isquiotibiales', 'Core', 'Erectores espinales'],
    equipment: ['Barra', 'Rack', 'Discos'],
    category: 'strength',
    muscleGroup: 'legs',
    simpleInstructions: [
      'Apoyá la barra sobre los trapecios, no sobre el cuello.',
      'Pies al ancho de hombros, puntas levemente afuera.',
      'Inhalá, traccioná el core y bajá la cadera atrás y abajo.',
      'Subí empujando el piso, manteniendo el pecho alto.',
    ],
    commonMistakes: [
      'Redondear la espalda baja en el fondo.',
      'Adelantar excesivamente las rodillas levantando los talones.',
      'Subir primero la cadera dejando el pecho atrás.',
    ],
    safetyNotes: 'Usá rack con seguros. Mantené columna neutra durante todo el rango.',
    referenceUrl: 'https://www.youtube.com/watch?v=ultWZbUMPL8',
    referenceType: 'youtube',
  },
  {
    name: 'Peso muerto rumano',
    aliases: ['rdl', 'romanian deadlift', 'peso muerto piernas rígidas'],
    description: 'Bisagra de cadera con rodillas semiflexionadas bajando la carga por delante de las piernas.',
    purpose: 'Fortalecer la cadena posterior: isquiotibiales y glúteos.',
    primaryMuscles: ['Isquiotibiales', 'Glúteo mayor'],
    secondaryMuscles: ['Erectores espinales', 'Espalda alta'],
    equipment: ['Barra', 'Mancuernas'],
    category: 'strength',
    muscleGroup: 'legs',
    simpleInstructions: [
      'Sostené la carga con brazos extendidos frente a los muslos.',
      'Llevá la cadera atrás manteniendo las rodillas semiflexionadas.',
      'Bajá la carga pegada a las piernas hasta sentir tensión en isquios.',
      'Volvé empujando la cadera hacia adelante.',
    ],
    commonMistakes: [
      'Redondear la espalda baja.',
      'Convertirlo en sentadilla flexionando demasiado las rodillas.',
      'Separar la barra del cuerpo.',
    ],
    safetyNotes: 'Mantené la espalda neutra; el movimiento es de cadera, no de lumbar.',
    referenceUrl: 'https://www.youtube.com/watch?v=jEy_czb3RKA',
    referenceType: 'youtube',
  },
  {
    name: 'Remo con barra',
    aliases: ['barbell row', 'remo pendlay', 'remo inclinado con barra'],
    description: 'Remo con el tronco inclinado traccionando la barra hacia el abdomen.',
    purpose: 'Desarrollar espalda media y dorsales.',
    primaryMuscles: ['Dorsal ancho', 'Espalda media'],
    secondaryMuscles: ['Bíceps', 'Trapecio', 'Erectores espinales'],
    equipment: ['Barra', 'Discos'],
    category: 'strength',
    muscleGroup: 'back',
    simpleInstructions: [
      'Inclinaste el tronco con la cadera hacia atrás y espalda neutra.',
      'Tomá la barra al ancho de hombros.',
      'Traccioná llevando los codos hacia atrás, juntando escápulas.',
      'Bajá controlando sin redondear la espalda.',
    ],
    commonMistakes: [
      'Usar impulso de la cadera para subir la barra.',
      'Redondear la espalda baja.',
      'Encoger los hombros en vez de remar con la espalda.',
    ],
    safetyNotes: 'Mantené la columna neutra; si no podés, reducí la carga.',
    referenceUrl: 'https://www.youtube.com/watch?v=9efgcAjQe7E',
    referenceType: 'youtube',
  },
  {
    name: 'Remo TRX',
    aliases: ['trx row', 'remo invertido trx', 'remo en suspensión'],
    description: 'Remo corporal suspendido de un sistema TRX, traccionando el cuerpo hacia las manijas.',
    purpose: 'Fortalecer la espalda con peso corporal y progresión por ángulo.',
    primaryMuscles: ['Espalda media', 'Dorsal ancho'],
    secondaryMuscles: ['Bíceps', 'Core'],
    equipment: ['TRX'],
    category: 'strength',
    muscleGroup: 'back',
    simpleInstructions: [
      'Tomá las manijas y caminá los pies hacia adelante para inclinarte.',
      'Cuerpo recto, core firme, brazos extendidos.',
      'Traccioná llevando el pecho hacia las manijas, codos pegados.',
      'Bajá controlando hasta extender los brazos.',
    ],
    commonMistakes: [
      'Dejar caer la cadera rompiendo la línea del cuerpo.',
      'No completar el rango de tracción.',
      'Encoger los hombros hacia las orejas.',
    ],
    safetyNotes: 'Cuanto más horizontal el cuerpo, más difícil; ajustá el ángulo a tu nivel.',
    referenceUrl: 'https://www.youtube.com/watch?v=KOaCM1HMwU0',
    referenceType: 'youtube',
  },
  {
    name: 'Dominadas asistidas',
    aliases: ['assisted pull up', 'dominada asistida', 'pull up asistido', 'dominadas con banda'],
    description: 'Dominada con asistencia de banda elástica o máquina para reducir el peso a vencer.',
    purpose: 'Progresar hacia la dominada estricta fortaleciendo dorsales y espalda.',
    primaryMuscles: ['Dorsal ancho'],
    secondaryMuscles: ['Bíceps', 'Espalda media', 'Core'],
    equipment: ['Barra de dominadas', 'Banda elástica'],
    category: 'strength',
    muscleGroup: 'back',
    simpleInstructions: [
      'Colocá una banda en la barra y apoyá rodilla o pie en ella.',
      'Tomá la barra un poco más ancho que los hombros.',
      'Traccioná llevando el pecho hacia la barra, codos hacia abajo.',
      'Bajá controlando hasta extender los brazos.',
    ],
    commonMistakes: [
      'Usar impulso de piernas (kipping) sin control.',
      'No completar el rango arriba o abajo.',
      'Encoger los hombros en lugar de iniciar con la espalda.',
    ],
    safetyNotes: 'Elegí una banda que te permita controlar la bajada.',
    referenceUrl: 'https://www.youtube.com/watch?v=ZHnPq2dTUW4',
    referenceType: 'youtube',
  },
  {
    name: 'Flexiones declinadas',
    aliases: ['decline push up', 'flexión declinada', 'lagartijas declinadas', 'flexiones pies elevados'],
    description: 'Flexión de brazos con los pies elevados sobre un banco o cajón.',
    purpose: 'Enfatizar la porción superior del pecho y los hombros.',
    primaryMuscles: ['Pectoral superior'],
    secondaryMuscles: ['Hombros', 'Tríceps', 'Core'],
    equipment: ['Banco', 'Cajón'],
    category: 'strength',
    muscleGroup: 'chest',
    simpleInstructions: [
      'Apoyá los pies en un banco y las manos en el piso al ancho de hombros.',
      'Cuerpo recto, core firme.',
      'Bajá el pecho flexionando los codos hacia atrás.',
      'Empujá hasta extender los brazos.',
    ],
    commonMistakes: [
      'Dejar caer la cadera.',
      'Abrir los codos a 90° respecto del tronco.',
      'No bajar lo suficiente.',
    ],
    safetyNotes: 'Cuanto más altos los pies, mayor la carga sobre los hombros.',
    referenceUrl: 'https://www.youtube.com/watch?v=SKPab2YC8BE',
    referenceType: 'youtube',
  },
  {
    name: 'Flexiones normales',
    aliases: ['push up', 'flexión de brazos', 'lagartijas', 'flexiones'],
    description: 'Flexión de brazos clásica con el cuerpo en línea recta.',
    purpose: 'Fortalecer pecho, hombros y tríceps con peso corporal.',
    primaryMuscles: ['Pectoral mayor'],
    secondaryMuscles: ['Tríceps', 'Hombros', 'Core'],
    category: 'strength',
    muscleGroup: 'chest',
    simpleInstructions: [
      'Manos en el piso un poco más anchas que los hombros.',
      'Cuerpo recto desde la cabeza a los talones, core firme.',
      'Bajá el pecho flexionando los codos hacia atrás (~45°).',
      'Empujá el piso hasta extender los brazos.',
    ],
    commonMistakes: [
      'Dejar caer la cadera o levantar los glúteos.',
      'Abrir demasiado los codos.',
      'Rango corto sin bajar el pecho.',
    ],
    safetyNotes: 'Si no podés mantener la línea, hacelas con rodillas apoyadas.',
    referenceUrl: 'https://www.youtube.com/watch?v=IODxDxX7oi4',
    referenceType: 'youtube',
  },
  {
    name: 'Flexiones diamante',
    aliases: ['diamond push up', 'flexión diamante', 'flexiones triángulo'],
    description: 'Flexión con las manos juntas formando un diamante bajo el pecho.',
    purpose: 'Enfatizar los tríceps además del pecho.',
    primaryMuscles: ['Tríceps'],
    secondaryMuscles: ['Pectoral mayor', 'Hombros', 'Core'],
    category: 'strength',
    muscleGroup: 'arms',
    simpleInstructions: [
      'Juntá las manos bajo el pecho formando un triángulo con índices y pulgares.',
      'Cuerpo recto, core firme.',
      'Bajá el pecho hacia las manos con codos pegados al cuerpo.',
      'Empujá hasta extender los brazos.',
    ],
    commonMistakes: [
      'Abrir los codos hacia afuera.',
      'Dejar caer la cadera.',
      'Rango incompleto.',
    ],
    safetyNotes: 'Si te molesta la muñeca, reducí el rango o usá flexiones normales.',
    referenceUrl: 'https://www.youtube.com/watch?v=J0DnG1_S92I',
    referenceType: 'youtube',
  },
  {
    name: 'Press militar',
    aliases: ['overhead press', 'ohp', 'press de hombros', 'press hombro con barra'],
    description: 'Empuje vertical de la carga por encima de la cabeza desde los hombros.',
    purpose: 'Desarrollar fuerza y volumen de hombros.',
    primaryMuscles: ['Deltoides'],
    secondaryMuscles: ['Tríceps', 'Trapecio', 'Core'],
    equipment: ['Barra', 'Mancuernas'],
    category: 'strength',
    muscleGroup: 'shoulders',
    simpleInstructions: [
      'Tomá la barra al ancho de hombros, a la altura de las clavículas.',
      'Core y glúteos firmes, costillas abajo.',
      'Empujá la barra hacia arriba pasando la cara.',
      'Bloqueá arriba con la barra sobre la cabeza y bajá controlando.',
    ],
    commonMistakes: [
      'Arquear la lumbar para empujar.',
      'Empujar la barra hacia adelante en vez de arriba.',
      'No bloquear arriba con la cabeza atravesando.',
    ],
    safetyNotes: 'Mantené el core firme para proteger la zona lumbar.',
    referenceUrl: 'https://www.youtube.com/watch?v=2yjwXTZQDDI',
    referenceType: 'youtube',
  },
  {
    name: 'Elevaciones laterales',
    aliases: ['lateral raise', 'vuelos laterales', 'elevaciones laterales con mancuernas'],
    description: 'Elevación de mancuernas hacia los lados hasta la altura de los hombros.',
    purpose: 'Aislar y desarrollar el deltoides lateral.',
    primaryMuscles: ['Deltoides lateral'],
    secondaryMuscles: ['Trapecio'],
    equipment: ['Mancuernas'],
    category: 'strength',
    muscleGroup: 'shoulders',
    simpleInstructions: [
      'De pie con una mancuerna en cada mano a los costados.',
      'Codos levemente flexionados.',
      'Elevá los brazos hacia los lados hasta la altura de los hombros.',
      'Bajá controlando sin soltar la tensión.',
    ],
    commonMistakes: [
      'Usar impulso del cuerpo.',
      'Encoger los hombros hacia las orejas.',
      'Subir por encima de la línea de los hombros.',
    ],
    safetyNotes: 'Usá poco peso; es un movimiento de aislamiento.',
    referenceUrl: 'https://www.youtube.com/watch?v=3VcKaXpzqRo',
    referenceType: 'youtube',
  },
  {
    name: 'Bird dog',
    aliases: ['bird-dog', 'perro de muestra', 'cuadrupedia contralateral'],
    description: 'Desde cuadrupedia, extender brazo y pierna opuestos manteniendo el tronco estable.',
    purpose: 'Mejorar la estabilidad del core y la coordinación contralateral.',
    primaryMuscles: ['Core', 'Erectores espinales'],
    secondaryMuscles: ['Glúteos', 'Hombros'],
    category: 'core',
    muscleGroup: 'core',
    simpleInstructions: [
      'Apoyá manos bajo los hombros y rodillas bajo la cadera.',
      'Extendé un brazo al frente y la pierna opuesta atrás.',
      'Mantené la cadera y los hombros nivelados, sin rotar.',
      'Volvé y alterná el lado.',
    ],
    commonMistakes: [
      'Rotar la cadera al extender la pierna.',
      'Arquear la zona lumbar.',
      'Mover demasiado rápido sin control.',
    ],
    safetyNotes: 'Mantené la columna neutra; el movimiento es lento y controlado.',
    referenceUrl: 'https://www.youtube.com/watch?v=wiFNA3sqjCA',
    referenceType: 'youtube',
  },
  {
    name: 'Dead bug',
    aliases: ['dead-bug', 'bicho muerto', 'insecto muerto'],
    description: 'Boca arriba, bajar brazo y pierna opuestos manteniendo la lumbar pegada al piso.',
    purpose: 'Fortalecer el core con la columna estable (anti-extensión).',
    primaryMuscles: ['Recto abdominal', 'Core profundo'],
    secondaryMuscles: ['Flexores de cadera'],
    category: 'core',
    muscleGroup: 'core',
    simpleInstructions: [
      'Boca arriba, brazos hacia el techo y caderas/rodillas a 90°.',
      'Pegá la zona lumbar al piso.',
      'Bajá un brazo y la pierna opuesta sin despegar la lumbar.',
      'Volvé y alterná.',
    ],
    commonMistakes: [
      'Despegar la lumbar del piso.',
      'Contener la respiración.',
      'Mover los miembros demasiado rápido.',
    ],
    safetyNotes: 'Si la lumbar se despega, reducí el rango.',
    referenceUrl: 'https://www.youtube.com/watch?v=4XLEnwUr1d8',
    referenceType: 'youtube',
  },
  {
    name: 'Plancha',
    aliases: ['plank', 'plancha abdominal', 'plancha frontal'],
    description: 'Sostener el cuerpo recto apoyado en antebrazos y puntas de los pies.',
    purpose: 'Desarrollar la estabilidad isométrica del core.',
    primaryMuscles: ['Core', 'Recto abdominal'],
    secondaryMuscles: ['Hombros', 'Glúteos'],
    category: 'core',
    muscleGroup: 'core',
    simpleInstructions: [
      'Apoyá antebrazos bajo los hombros y puntas de los pies.',
      'Cuerpo en línea recta de la cabeza a los talones.',
      'Apretá glúteos y abdomen, costillas abajo.',
      'Sostené respirando de forma controlada.',
    ],
    commonMistakes: [
      'Dejar caer la cadera.',
      'Levantar los glúteos.',
      'Contener la respiración.',
    ],
    safetyNotes: 'Mejor poco tiempo con buena forma que mucho con la cadera caída.',
    referenceUrl: 'https://www.youtube.com/watch?v=pSHjTRCQxIw',
    referenceType: 'youtube',
  },
  {
    name: 'Zancadas',
    aliases: ['lunge', 'lunges', 'estocadas', 'desplantes'],
    description: 'Paso al frente o atrás flexionando ambas rodillas hasta ~90°.',
    purpose: 'Fortalecer piernas y glúteos de forma unilateral, mejorando equilibrio.',
    primaryMuscles: ['Cuádriceps', 'Glúteos'],
    secondaryMuscles: ['Isquiotibiales', 'Core'],
    equipment: ['Peso corporal', 'Mancuernas'],
    category: 'strength',
    muscleGroup: 'legs',
    simpleInstructions: [
      'Dá un paso al frente manteniendo el tronco erguido.',
      'Bajá flexionando ambas rodillas hasta ~90°.',
      'La rodilla de atrás baja hacia el piso sin tocarlo.',
      'Empujá con el talón delantero para volver.',
    ],
    commonMistakes: [
      'Que la rodilla delantera colapse hacia adentro.',
      'Inclinar el tronco hacia adelante.',
      'Paso demasiado corto.',
    ],
    safetyNotes: 'Mantené el torso erguido y el core firme para proteger las rodillas.',
    referenceUrl: 'https://www.youtube.com/watch?v=QOVaHwm-Q6U',
    referenceType: 'youtube',
  },
  {
    name: 'Búlgaras',
    aliases: ['bulgarian split squat', 'sentadilla búlgara', 'split squat búlgaro', 'zancada búlgara'],
    description: 'Sentadilla a una pierna con el pie de atrás elevado sobre un banco.',
    purpose: 'Fuerza unilateral intensa de cuádriceps y glúteos.',
    primaryMuscles: ['Cuádriceps', 'Glúteo mayor'],
    secondaryMuscles: ['Isquiotibiales', 'Core'],
    equipment: ['Banco', 'Mancuernas'],
    category: 'strength',
    muscleGroup: 'legs',
    simpleInstructions: [
      'Apoyá el empeine del pie trasero sobre un banco.',
      'El pie delantero adelantado lo suficiente.',
      'Bajá flexionando la rodilla delantera, tronco levemente inclinado.',
      'Empujá con el talón delantero para subir.',
    ],
    commonMistakes: [
      'Pie delantero demasiado cerca del banco.',
      'Que la rodilla delantera colapse hacia adentro.',
      'Perder el equilibrio por falta de control.',
    ],
    safetyNotes: 'Empezá sin peso para dominar el equilibrio.',
    referenceUrl: 'https://www.youtube.com/watch?v=2C-uNgKwPLE',
    referenceType: 'youtube',
  },
  {
    name: 'Y-T-W',
    aliases: ['ytw', 'y t w', 'raises ytw', 'elevaciones ytw'],
    description: 'Serie de elevaciones de brazos boca abajo formando las letras Y, T y W.',
    purpose: 'Activar y fortalecer la espalda alta y los estabilizadores escapulares.',
    primaryMuscles: ['Trapecio inferior', 'Romboides'],
    secondaryMuscles: ['Deltoides posterior', 'Manguito rotador'],
    equipment: ['Peso corporal', 'Mancuernas livianas'],
    category: 'posture',
    muscleGroup: 'back',
    simpleInstructions: [
      'Boca abajo o inclinado, brazos colgando.',
      'Y: subí los brazos en diagonal sobre la cabeza.',
      'T: abrí los brazos a los lados.',
      'W: llevá los codos hacia abajo juntando escápulas.',
    ],
    commonMistakes: [
      'Encoger los hombros hacia las orejas.',
      'Usar impulso en vez de control.',
      'Arquear la lumbar.',
    ],
    safetyNotes: 'Usá poco o ningún peso; el foco es la activación, no la carga.',
    referenceUrl: ytSearch('Y T W raises ejercicio técnica espalda'),
    referenceType: 'web',
  },
  {
    name: 'Wall slides',
    aliases: ['wall slide', 'deslizamientos en pared', 'wall angels', 'ángeles en pared'],
    description: 'Deslizar los brazos por la pared manteniendo contacto, mejorando la movilidad de hombros.',
    purpose: 'Mejorar la movilidad escapular y la postura de hombros.',
    primaryMuscles: ['Trapecio inferior', 'Manguito rotador'],
    secondaryMuscles: ['Deltoides', 'Romboides'],
    category: 'mobility',
    muscleGroup: 'mobility',
    simpleInstructions: [
      'De espaldas a la pared, lumbar y cabeza en contacto.',
      'Apoyá antebrazos y dorso de las manos en la pared.',
      'Deslizá los brazos hacia arriba sin despegarlos.',
      'Bajá controlando juntando las escápulas.',
    ],
    commonMistakes: [
      'Despegar la zona lumbar de la pared.',
      'Perder el contacto de las manos.',
      'Encoger los hombros.',
    ],
    safetyNotes: 'Mové solo dentro del rango donde mantenés el contacto con la pared.',
    referenceUrl: 'https://www.youtube.com/watch?v=d6V2Exzb324',
    referenceType: 'youtube',
  },
  {
    name: 'Retracción escapular',
    aliases: ['scapular retraction', 'retracción de escápulas', 'scapular pull up', 'retracciones escapulares'],
    description: 'Juntar las escápulas activamente, con o sin barra, sin flexionar los codos.',
    purpose: 'Activar la espalda alta y mejorar el control escapular previo a tracciones.',
    primaryMuscles: ['Romboides', 'Trapecio medio'],
    secondaryMuscles: ['Dorsal ancho', 'Deltoides posterior'],
    equipment: ['Peso corporal', 'Barra', 'Banda'],
    category: 'posture',
    muscleGroup: 'back',
    simpleInstructions: [
      'Colgado de una barra o con banda, brazos extendidos.',
      'Sin flexionar los codos, juntá las escápulas hacia abajo y atrás.',
      'Sostené un instante la contracción.',
      'Soltá controlando.',
    ],
    commonMistakes: [
      'Flexionar los codos (convertirlo en remo).',
      'Encoger los hombros hacia las orejas.',
      'Hacerlo con impulso.',
    ],
    safetyNotes: 'Movimiento corto y controlado; el rango es pequeño.',
    referenceUrl: ytSearch('retracción escapular ejercicio técnica'),
    referenceType: 'web',
  },
  {
    name: 'Estiramiento de pectoral en puerta',
    aliases: ['doorway pec stretch', 'estiramiento pectoral puerta', 'estiramiento de pecho en marco'],
    description: 'Estiramiento del pectoral apoyando el antebrazo en el marco de una puerta y rotando el tronco.',
    purpose: 'Mejorar la movilidad del pecho y la postura de hombros adelantados.',
    primaryMuscles: ['Pectoral mayor'],
    secondaryMuscles: ['Deltoides anterior'],
    category: 'mobility',
    muscleGroup: 'mobility',
    simpleInstructions: [
      'Apoyá el antebrazo en el marco con el codo a la altura del hombro.',
      'Dá un paso adelante con el pie del mismo lado.',
      'Rotá suavemente el tronco hacia el lado contrario.',
      'Sostené el estiramiento sin dolor y cambiá de lado.',
    ],
    commonMistakes: [
      'Forzar hasta el dolor.',
      'Encoger el hombro.',
      'Contener la respiración.',
    ],
    safetyNotes: 'Estiramiento suave y mantenido; nunca debe doler.',
    referenceUrl: ytSearch('estiramiento de pectoral en puerta técnica'),
    referenceType: 'web',
  },
];

// ─── Lookup ────────────────────────────────────────────────────────────────────

/** Pre-built index: every normalised name + alias → entry. */
const INDEX: Map<string, ExerciseKnowledgeEntry> = (() => {
  const map = new Map<string, ExerciseKnowledgeEntry>();
  for (const entry of EXERCISE_KNOWLEDGE_BASE) {
    map.set(normalize(entry.name), entry);
    for (const alias of entry.aliases ?? []) {
      const key = normalize(alias);
      if (!map.has(key)) map.set(key, entry);
    }
  }
  return map;
})();

/** Find a knowledge entry by exercise name or alias (diacritics-insensitive). */
export function findKnowledgeEntry(name: string): ExerciseKnowledgeEntry | undefined {
  return INDEX.get(normalize(name));
}
