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
  movementPattern?: string;
  postureFocus?: boolean;
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
    secondaryMuscles: ['Isquiotibiales', 'Cuádriceps', 'Aductor mayor', 'Core'],
    equipment: ['Barra', 'Banco', 'Discos'],
    category: 'strength',
    muscleGroup: 'glutes',
    movementPattern: 'Extensión de cadera',
    simpleInstructions: [
      'Apoyá el borde inferior de las escápulas en el banco y la barra sobre el pliegue de la cadera (usá una colchoneta para amortiguar).',
      'Plantá los pies al ancho de cadera, ni muy cerca ni muy lejos: en la posición alta la tibia debe quedar vertical.',
      'Antes de subir, meté las costillas y hacé una leve retroversión pélvica (como “escondiendo la cola”).',
      'Empujá con los talones extendiendo la cadera hasta alinear tronco y muslos.',
      'Apretá los glúteos arriba 1 segundo sin arquear la lumbar.',
      'Bajá controlando hasta casi tocar el piso y encadená la siguiente repetición.',
    ],
    commonMistakes: [
      'Hiperextender la zona lumbar en lugar de extender la cadera (la pelvis bascula hacia adelante).',
      'Sacar las costillas hacia afuera (rib flare): indica que estás arqueando la espalda, no empujando con el glúteo.',
      'Subir con impulso o despegando los talones del piso.',
      'Pies demasiado adelante (carga isquios) o demasiado atrás (carga cuádriceps) en vez del glúteo.',
      'No llegar a la extensión completa de cadera arriba.',
      'Empujar con la punta del pie en lugar del talón.',
    ],
    safetyNotes: 'El rango es de cadera, no de lumbar: mantené el mentón metido, las costillas abajo y una leve retroversión pélvica para no hiperextender la espalda baja.',
    referenceUrl: 'https://www.youtube.com/watch?v=LM8XHLYJoYs',
    referenceType: 'youtube',
  },
  {
    name: 'Sentadilla goblet',
    aliases: ['goblet squat', 'sentadilla copa', 'sentadilla con mancuerna al pecho'],
    description: 'Sentadilla sosteniendo una mancuerna o pesa rusa contra el pecho.',
    purpose: 'Aprender el patrón de sentadilla y fortalecer piernas y core con carga frontal.',
    primaryMuscles: ['Cuádriceps', 'Glúteo mayor'],
    secondaryMuscles: ['Aductores', 'Isquiotibiales', 'Core', 'Espalda alta'],
    equipment: ['Mancuerna', 'Pesa rusa'],
    category: 'strength',
    muscleGroup: 'legs',
    movementPattern: 'Sentadilla',
    simpleInstructions: [
      'Sostené la pesa contra el pecho con ambas manos, codos hacia abajo.',
      'Pies al ancho de hombros, puntas levemente afuera.',
      'Inhalá y traccioná el abdomen antes de bajar.',
      'Bajá flexionando cadera y rodillas, pecho erguido y talones apoyados.',
      'Llegá al menos hasta que los muslos queden paralelos al piso, si la movilidad lo permite.',
      'Empujá con los talones para volver a subir sin redondear la espalda.',
    ],
    commonMistakes: [
      'Dejar caer el pecho hacia adelante.',
      'Que las rodillas colapsen hacia adentro (valgo).',
      'Levantar los talones del piso.',
      'Redondear la espalda baja en el fondo (“butt wink”).',
      'No bajar lo suficiente por falta de movilidad de tobillo o cadera.',
    ],
    safetyNotes: 'Bajá solo hasta donde puedas mantener la espalda neutra; si los talones se levantan, trabajá movilidad de tobillo o reducí la profundidad.',
    referenceUrl: 'https://www.youtube.com/watch?v=MeIiIdhvXT4',
    referenceType: 'youtube',
  },
  {
    name: 'Sentadilla con barra',
    aliases: ['back squat', 'sentadilla trasera', 'sentadilla'],
    description: 'Sentadilla con barra apoyada en la espalda alta.',
    purpose: 'Construir fuerza global de tren inferior.',
    primaryMuscles: ['Cuádriceps', 'Glúteo mayor'],
    secondaryMuscles: ['Isquiotibiales', 'Aductores', 'Erectores espinales', 'Core'],
    equipment: ['Barra', 'Rack', 'Discos'],
    category: 'strength',
    muscleGroup: 'legs',
    movementPattern: 'Sentadilla',
    simpleInstructions: [
      'Apoyá la barra sobre los trapecios (no sobre el cuello) y agarrala firme.',
      'Sacá la barra del rack y dá uno o dos pasos atrás; pies al ancho de hombros, puntas levemente afuera.',
      'Inhalá profundo y traccioná el core (bracing) antes de bajar.',
      'Bajá llevando la cadera atrás y abajo, rodillas en línea con las puntas de los pies.',
      'Llegá al menos a la paralela manteniendo la espalda neutra.',
      'Subí empujando el piso con todo el pie, manteniendo el pecho alto.',
    ],
    commonMistakes: [
      'Redondear la espalda baja en el fondo (“butt wink”).',
      'Que las rodillas colapsen hacia adentro al subir.',
      'Subir primero la cadera dejando el pecho atrás (se convierte en buenos días).',
      'Levantar los talones por falta de movilidad de tobillo.',
      'Perder el bracing y soltar el aire en el fondo.',
    ],
    safetyNotes: 'Usá siempre un rack con seguros a la altura del fondo. Mantené la columna neutra y el core firme durante todo el rango; si la técnica se rompe, bajá la carga.',
    referenceUrl: 'https://www.youtube.com/watch?v=ultWZbUMPL8',
    referenceType: 'youtube',
  },
  {
    name: 'Peso muerto rumano',
    aliases: ['rdl', 'romanian deadlift', 'peso muerto piernas rígidas'],
    description: 'Bisagra de cadera con rodillas semiflexionadas bajando la carga por delante de las piernas.',
    purpose: 'Fortalecer la cadena posterior: isquiotibiales y glúteos.',
    primaryMuscles: ['Isquiotibiales', 'Glúteo mayor'],
    secondaryMuscles: ['Erectores espinales', 'Dorsal ancho', 'Trapecio', 'Antebrazos (agarre)'],
    equipment: ['Barra', 'Mancuernas'],
    category: 'strength',
    muscleGroup: 'legs',
    movementPattern: 'Bisagra de cadera',
    simpleInstructions: [
      'Parate con la carga frente a los muslos, brazos extendidos y escápulas levemente retraídas.',
      'Iniciá el movimiento llevando la cadera hacia atrás (bisagra), no flexionando las rodillas: las rodillas quedan apenas desbloqueadas y fijas.',
      'Mantené la barra pegada al cuerpo, deslizándola por los muslos.',
      'Bajá hasta sentir un buen estiramiento en los isquiotibiales (cerca de media tibia), sin redondear la espalda.',
      'Volvé empujando la cadera hacia adelante y apretando los glúteos arriba.',
    ],
    commonMistakes: [
      'Redondear la espalda baja en lugar de mantenerla neutra.',
      'Convertirlo en sentadilla flexionando demasiado las rodillas.',
      'Que la barra se separe del cuerpo (la cadera no va lo suficientemente atrás).',
      'Bajar más de lo que permite la flexibilidad de los isquios (la espalda compensa redondeándose).',
      'Hiperextender la lumbar arriba en lugar de terminar con el glúteo.',
    ],
    safetyNotes: 'El movimiento es de cadera, no de lumbar: mantené la espalda neutra y la barra pegada. Si no llegás abajo sin redondear, acortá el rango.',
    referenceUrl: 'https://www.youtube.com/watch?v=jEy_czb3RKA',
    referenceType: 'youtube',
  },
  {
    name: 'Remo con barra',
    aliases: ['barbell row', 'remo pendlay', 'remo inclinado con barra'],
    description: 'Remo con el tronco inclinado traccionando la barra hacia el abdomen.',
    purpose: 'Desarrollar espalda media y dorsales.',
    primaryMuscles: ['Dorsal ancho', 'Trapecio medio', 'Romboides'],
    secondaryMuscles: ['Deltoides posterior', 'Bíceps', 'Erectores espinales', 'Core'],
    equipment: ['Barra', 'Discos'],
    category: 'strength',
    muscleGroup: 'back',
    movementPattern: 'Tracción horizontal',
    simpleInstructions: [
      'Inclinaste el tronco haciendo bisagra de cadera (~45° o más), espalda neutra y core firme.',
      'Tomá la barra al ancho de hombros, brazos extendidos.',
      'Iniciá el remo retrayendo las escápulas (juntándolas) antes de flexionar los codos.',
      'Traccioná la barra hacia el abdomen bajo/ombligo llevando los codos hacia atrás y cerca del cuerpo.',
      'Apretá la espalda un instante arriba y bajá controlando sin perder la postura.',
    ],
    commonMistakes: [
      'Usar impulso de la cadera/tronco para “tironear” la barra.',
      'Tirar con los bíceps en vez de iniciar con la espalda y las escápulas.',
      'Redondear la espalda baja al perder el bracing.',
      'Encoger los hombros hacia las orejas en lugar de retraer las escápulas.',
      'Llevar la barra demasiado alto (al pecho) abriendo mucho los codos.',
    ],
    safetyNotes: 'Mantené la columna neutra y el core firme durante todo el set; si la espalda se redondea, reducí la carga o aumentá la inclinación apoyando el pecho en un banco.',
    referenceUrl: 'https://www.youtube.com/watch?v=9efgcAjQe7E',
    referenceType: 'youtube',
  },
  {
    name: 'Remo TRX',
    aliases: ['trx row', 'remo invertido trx', 'remo en suspensión'],
    description: 'Remo corporal suspendido de un sistema TRX, traccionando el cuerpo hacia las manijas.',
    purpose: 'Fortalecer la espalda con peso corporal y progresión por ángulo.',
    primaryMuscles: ['Trapecio medio', 'Romboides', 'Dorsal ancho'],
    secondaryMuscles: ['Deltoides posterior', 'Bíceps', 'Core', 'Glúteos (estabilización)'],
    equipment: ['TRX'],
    category: 'strength',
    muscleGroup: 'back',
    movementPattern: 'Tracción horizontal',
    simpleInstructions: [
      'Tomá las manijas y caminá los pies hacia adelante para inclinar el cuerpo hacia atrás.',
      'Cuerpo recto de la cabeza a los talones, core y glúteos firmes, brazos extendidos.',
      'Retraé las escápulas e iniciá la tracción llevando el pecho hacia las manijas.',
      'Codos cerca del cuerpo, traccioná hasta que las manos lleguen a los costados del tronco.',
      'Bajá controlando hasta extender los brazos sin perder la línea del cuerpo.',
    ],
    commonMistakes: [
      'Dejar caer la cadera rompiendo la línea del cuerpo.',
      'No completar el rango de tracción (rango corto).',
      'Encoger los hombros hacia las orejas en vez de retraer las escápulas.',
      'Tirar solo con los brazos sin involucrar la espalda.',
    ],
    safetyNotes: 'Cuanto más horizontal el cuerpo, más difícil: ajustá el ángulo a tu nivel. Mantené glúteos y core activos para no arquear la zona lumbar.',
    referenceUrl: 'https://www.youtube.com/watch?v=KOaCM1HMwU0',
    referenceType: 'youtube',
  },
  {
    name: 'Dominadas asistidas',
    aliases: ['assisted pull up', 'dominada asistida', 'pull up asistido', 'dominadas con banda'],
    description: 'Dominada con asistencia de banda elástica o máquina para reducir el peso a vencer.',
    purpose: 'Progresar hacia la dominada estricta fortaleciendo dorsales y espalda.',
    primaryMuscles: ['Dorsal ancho'],
    secondaryMuscles: ['Trapecio inferior', 'Romboides', 'Bíceps', 'Core'],
    equipment: ['Barra de dominadas', 'Banda elástica'],
    category: 'strength',
    muscleGroup: 'back',
    movementPattern: 'Tracción vertical',
    simpleInstructions: [
      'Colocá una banda en la barra y apoyá rodilla o pie en ella para reducir el peso a vencer.',
      'Tomá la barra un poco más ancho que los hombros, palmas al frente.',
      'Empezá deprimiendo las escápulas (bajándolas) antes de flexionar los codos.',
      'Traccioná llevando el pecho hacia la barra, codos hacia abajo y atrás.',
      'Subí hasta que el mentón pase la barra y bajá controlando hasta extender los brazos.',
    ],
    commonMistakes: [
      'Usar impulso de piernas (kipping) sin control.',
      'No completar el rango: ni extender abajo ni llegar arriba.',
      'Encoger los hombros en lugar de iniciar bajando las escápulas.',
      'Tirar solo con los bíceps sin involucrar el dorsal.',
      'Usar una banda demasiado fuerte que hace casi todo el trabajo.',
    ],
    safetyNotes: 'Elegí una banda que te permita controlar la bajada y completar el rango; evitá soltarte de golpe desde arriba.',
    referenceUrl: 'https://www.youtube.com/watch?v=ZHnPq2dTUW4',
    referenceType: 'youtube',
  },
  {
    name: 'Flexiones declinadas',
    aliases: ['decline push up', 'flexión declinada', 'lagartijas declinadas', 'flexiones pies elevados'],
    description: 'Flexión de brazos con los pies elevados sobre un banco o cajón.',
    purpose: 'Enfatizar la porción superior del pecho y los hombros.',
    primaryMuscles: ['Pectoral superior (porción clavicular)'],
    secondaryMuscles: ['Deltoides anterior', 'Tríceps', 'Serrato anterior', 'Core'],
    equipment: ['Banco', 'Cajón'],
    category: 'strength',
    muscleGroup: 'chest',
    movementPattern: 'Empuje horizontal',
    simpleInstructions: [
      'Apoyá los pies en un banco y las manos en el piso, un poco más anchas que los hombros.',
      'Cuerpo recto de la cabeza a los talones, core y glúteos firmes.',
      'Mirada al piso para mantener el cuello neutro.',
      'Bajá el pecho flexionando los codos a ~45° respecto del tronco.',
      'Empujá el piso hasta extender los brazos sin dejar caer la cadera.',
    ],
    commonMistakes: [
      'Dejar caer la cadera o levantar los glúteos.',
      'Abrir los codos a 90° respecto del tronco (estrés en el hombro).',
      'No bajar lo suficiente (rango corto).',
      'Adelantar la cabeza en vez de mantener el cuello neutro.',
    ],
    safetyNotes: 'Cuanto más altos los pies, mayor la carga sobre los hombros: subí la altura de a poco. Mantené el cuerpo en línea para no cargar la lumbar.',
    referenceUrl: 'https://www.youtube.com/watch?v=SKPab2YC8BE',
    referenceType: 'youtube',
  },
  {
    name: 'Flexiones normales',
    aliases: ['push up', 'flexión de brazos', 'lagartijas', 'flexiones'],
    description: 'Flexión de brazos clásica con el cuerpo en línea recta.',
    purpose: 'Fortalecer pecho, hombros y tríceps con peso corporal.',
    primaryMuscles: ['Pectoral mayor'],
    secondaryMuscles: ['Deltoides anterior', 'Tríceps', 'Serrato anterior', 'Core'],
    category: 'strength',
    muscleGroup: 'chest',
    movementPattern: 'Empuje horizontal',
    simpleInstructions: [
      'Manos en el piso un poco más anchas que los hombros, dedos al frente.',
      'Cuerpo recto desde la cabeza a los talones, core y glúteos firmes.',
      'Mirada ligeramente al frente del piso para mantener el cuello neutro.',
      'Bajá el pecho flexionando los codos hacia atrás (~45° respecto del tronco).',
      'Bajá hasta que el pecho casi toque el piso.',
      'Empujá el piso hasta extender los brazos, separando bien las escápulas arriba (protracción).',
    ],
    commonMistakes: [
      'Dejar caer la cadera o levantar los glúteos.',
      'Abrir demasiado los codos en “T” (sobrecarga el hombro).',
      'Rango corto sin bajar el pecho.',
      'Adelantar la cabeza en lugar de mantener el cuello alineado.',
    ],
    safetyNotes: 'Si no podés mantener la línea del cuerpo, hacelas con las rodillas apoyadas o con las manos elevadas en un banco.',
    referenceUrl: 'https://www.youtube.com/watch?v=IODxDxX7oi4',
    referenceType: 'youtube',
  },
  {
    name: 'Flexiones diamante',
    aliases: ['diamond push up', 'flexión diamante', 'flexiones triángulo'],
    description: 'Flexión con las manos juntas formando un diamante bajo el pecho.',
    purpose: 'Enfatizar los tríceps además del pecho.',
    primaryMuscles: ['Tríceps'],
    secondaryMuscles: ['Pectoral mayor (porción interna)', 'Deltoides anterior', 'Core'],
    category: 'strength',
    muscleGroup: 'arms',
    movementPattern: 'Empuje horizontal',
    simpleInstructions: [
      'Juntá las manos bajo el pecho formando un triángulo con índices y pulgares.',
      'Cuerpo recto de la cabeza a los talones, core firme.',
      'Mantené el cuello neutro mirando al piso.',
      'Bajá el pecho hacia las manos con los codos pegados al cuerpo (no hacia afuera).',
      'Empujá hasta extender los brazos manteniendo la línea del cuerpo.',
    ],
    commonMistakes: [
      'Abrir los codos hacia afuera en vez de mantenerlos pegados.',
      'Dejar caer la cadera o levantar los glúteos.',
      'Rango incompleto sin bajar el pecho a las manos.',
      'Cargar excesivamente la muñeca por mala alineación.',
    ],
    safetyNotes: 'Si te molesta la muñeca, reducí el rango, girá levemente las manos o pasá a flexiones normales.',
    referenceUrl: 'https://www.youtube.com/watch?v=J0DnG1_S92I',
    referenceType: 'youtube',
  },
  {
    name: 'Press militar',
    aliases: ['overhead press', 'ohp', 'press de hombros', 'press hombro con barra'],
    description: 'Empuje vertical de la carga por encima de la cabeza desde los hombros.',
    purpose: 'Desarrollar fuerza y volumen de hombros.',
    primaryMuscles: ['Deltoides anterior', 'Deltoides lateral'],
    secondaryMuscles: ['Tríceps', 'Trapecio superior', 'Serrato anterior', 'Core'],
    equipment: ['Barra', 'Mancuernas'],
    category: 'strength',
    muscleGroup: 'shoulders',
    movementPattern: 'Empuje vertical',
    simpleInstructions: [
      'Tomá la barra al ancho de hombros, apoyada a la altura de las clavículas.',
      'Pies al ancho de cadera, core y glúteos firmes, costillas abajo (sin arquear la lumbar).',
      'Empujá la barra hacia arriba en línea recta, llevando la cabeza levemente atrás para dejarla pasar.',
      'Una vez que pasa la frente, volvé a meter la cabeza “debajo” de la barra.',
      'Bloqueá arriba con la barra sobre la cabeza y los hombros.',
      'Bajá controlando hasta las clavículas.',
    ],
    commonMistakes: [
      'Arquear la lumbar para ayudarse con el pecho.',
      'Empujar la barra hacia adelante en vez de en línea vertical.',
      'No bloquear arriba dejando la cabeza adelantada.',
      'Encoger los hombros sin estabilizar las escápulas.',
      'Usar impulso de piernas (eso sería push press, no press estricto).',
    ],
    safetyNotes: 'Mantené el core firme y las costillas abajo para proteger la zona lumbar; no arquees la espalda para mover más peso.',
    referenceUrl: 'https://www.youtube.com/watch?v=2yjwXTZQDDI',
    referenceType: 'youtube',
  },
  {
    name: 'Elevaciones laterales',
    aliases: ['lateral raise', 'vuelos laterales', 'elevaciones laterales con mancuernas'],
    description: 'Elevación de mancuernas hacia los lados hasta la altura de los hombros.',
    purpose: 'Aislar y desarrollar el deltoides lateral.',
    primaryMuscles: ['Deltoides lateral'],
    secondaryMuscles: ['Deltoides anterior', 'Trapecio (estabilización)', 'Supraespinoso'],
    equipment: ['Mancuernas'],
    category: 'strength',
    muscleGroup: 'shoulders',
    movementPattern: 'Aislamiento de hombro',
    simpleInstructions: [
      'De pie con una mancuerna en cada mano a los costados, leve inclinación del tronco al frente.',
      'Codos levemente flexionados y fijos durante todo el movimiento.',
      'Elevá los brazos hacia los lados liderando con los codos, no con las manos.',
      'Subí hasta la altura de los hombros (forma de “T”).',
      'Bajá controlando sin soltar la tensión ni dejar caer las mancuernas.',
    ],
    commonMistakes: [
      'Usar impulso del cuerpo (balanceo) para subir el peso.',
      'Encoger los hombros hacia las orejas (trapecio dominante).',
      'Subir por encima de la línea de los hombros.',
      'Liderar con las manos en vez de con los codos.',
      'Usar demasiado peso y perder el control.',
    ],
    safetyNotes: 'Es un movimiento de aislamiento: priorizá poco peso y buena técnica sobre la carga. Si sentís pinzamiento, no pases la altura del hombro.',
    referenceUrl: 'https://www.youtube.com/watch?v=3VcKaXpzqRo',
    referenceType: 'youtube',
  },
  {
    name: 'Bird dog',
    aliases: ['bird-dog', 'perro de muestra', 'cuadrupedia contralateral'],
    description: 'Desde cuadrupedia, extender brazo y pierna opuestos manteniendo el tronco perfectamente estable.',
    purpose: 'Trabajar la estabilidad anti-rotación del core y la coordinación contralateral, con la columna neutra.',
    primaryMuscles: ['Core (anti-rotación)', 'Erectores espinales'],
    secondaryMuscles: ['Glúteo mayor', 'Multífidos', 'Deltoides'],
    category: 'core',
    muscleGroup: 'core',
    movementPattern: 'Core anti-rotación',
    postureFocus: true,
    simpleInstructions: [
      'Apoyá manos bajo los hombros y rodillas bajo la cadera, columna neutra.',
      'Traccioná el abdomen y nivelá la espalda (imaginá un vaso de agua sobre la lumbar).',
      'Extendé un brazo al frente y la pierna opuesta atrás hasta alinearlos con el tronco.',
      'Mantené la cadera y los hombros nivelados, sin rotar ni inclinarte.',
      'Pausá 1-2 segundos arriba y volvé controlando.',
      'Alterná el lado manteniendo el control en cada repetición.',
    ],
    commonMistakes: [
      'Rotar o inclinar la cadera al extender la pierna.',
      'Arquear la zona lumbar al subir el brazo/pierna.',
      'Subir la pierna por encima de la línea de la cadera (hiperextensión).',
      'Mover demasiado rápido y perder la estabilidad.',
    ],
    safetyNotes: 'Mantené la columna neutra y la pelvis estable; el objetivo es el control, no la amplitud. Movimiento lento y sin compensar con la lumbar.',
    referenceUrl: 'https://www.youtube.com/watch?v=wiFNA3sqjCA',
    referenceType: 'youtube',
  },
  {
    name: 'Dead bug',
    aliases: ['dead-bug', 'bicho muerto', 'insecto muerto'],
    description: 'Boca arriba, bajar el brazo y la pierna opuestos manteniendo la zona lumbar pegada al piso.',
    purpose: 'Fortalecer el core en anti-extensión: resistir el arqueo de la lumbar mientras se mueven los miembros.',
    primaryMuscles: ['Recto abdominal', 'Transverso abdominal (core profundo)'],
    secondaryMuscles: ['Oblicuos', 'Flexores de cadera'],
    category: 'core',
    muscleGroup: 'core',
    movementPattern: 'Core anti-extensión',
    postureFocus: true,
    simpleInstructions: [
      'Boca arriba, brazos extendidos hacia el techo y caderas/rodillas a 90°.',
      'Pegá la zona lumbar al piso traccionando el abdomen (retroversión leve).',
      'Exhalá lentamente mientras bajás un brazo y la pierna opuesta.',
      'Llegá hasta donde puedas SIN que la lumbar se despegue del piso.',
      'Inhalá al volver a la posición inicial y alterná el lado.',
    ],
    commonMistakes: [
      'Despegar la lumbar del piso al bajar los miembros.',
      'Contener la respiración en vez de exhalar al extender.',
      'Mover los brazos/piernas demasiado rápido sin control.',
      'Bajar más allá del rango que el core puede estabilizar.',
    ],
    safetyNotes: 'La lumbar debe permanecer pegada al piso todo el tiempo; si se despega, acortá el rango. Coordiná la exhalación con el movimiento.',
    referenceUrl: 'https://www.youtube.com/watch?v=4XLEnwUr1d8',
    referenceType: 'youtube',
  },
  {
    name: 'Plancha',
    aliases: ['plank', 'plancha abdominal', 'plancha frontal'],
    description: 'Sostener el cuerpo recto apoyado en antebrazos y puntas de los pies, de forma isométrica.',
    purpose: 'Desarrollar la estabilidad isométrica del core en anti-extensión, resistiendo el arqueo de la lumbar.',
    primaryMuscles: ['Core (anti-extensión)', 'Recto abdominal', 'Transverso abdominal'],
    secondaryMuscles: ['Glúteos', 'Deltoides', 'Serrato anterior'],
    category: 'core',
    muscleGroup: 'core',
    movementPattern: 'Core anti-extensión',
    postureFocus: true,
    simpleInstructions: [
      'Apoyá los antebrazos bajo los hombros y las puntas de los pies.',
      'Llevá el cuerpo a una línea recta de la cabeza a los talones.',
      'Apretá glúteos y abdomen, metiendo las costillas y haciendo una leve retroversión pélvica.',
      'Mantené el cuello neutro, mirada al piso.',
      'Empujá levemente el piso con los antebrazos (protracción de escápulas).',
      'Sostené respirando de forma controlada, sin perder la tensión.',
    ],
    commonMistakes: [
      'Dejar caer la cadera (lumbar arqueada).',
      'Levantar los glúteos formando una “V”.',
      'Adelantar la cabeza o mirar al frente (cuello cargado).',
      'Contener la respiración.',
    ],
    safetyNotes: 'Mejor poco tiempo con buena forma que mucho con la cadera caída: si la lumbar se arquea, terminá la serie. Apretar glúteos protege la zona lumbar.',
    referenceUrl: 'https://www.youtube.com/watch?v=pSHjTRCQxIw',
    referenceType: 'youtube',
  },
  {
    name: 'Zancadas',
    aliases: ['lunge', 'lunges', 'estocadas', 'desplantes'],
    description: 'Paso al frente o atrás flexionando ambas rodillas hasta ~90°.',
    purpose: 'Fortalecer piernas y glúteos de forma unilateral, mejorando equilibrio.',
    primaryMuscles: ['Cuádriceps', 'Glúteo mayor'],
    secondaryMuscles: ['Isquiotibiales', 'Glúteo medio (estabilización)', 'Core'],
    equipment: ['Peso corporal', 'Mancuernas'],
    category: 'strength',
    muscleGroup: 'legs',
    movementPattern: 'Zancada unilateral',
    simpleInstructions: [
      'Dá un paso al frente manteniendo el tronco erguido y el core firme.',
      'Bajá vertical flexionando ambas rodillas hasta ~90°.',
      'La rodilla de atrás baja hacia el piso sin tocarlo.',
      'Mantené el peso repartido y la rodilla delantera alineada con el pie.',
      'Empujá con el talón delantero para volver a la posición inicial.',
      'Alterná las piernas o completá todas las reps de un lado según la variante.',
    ],
    commonMistakes: [
      'Que la rodilla delantera colapse hacia adentro (valgo).',
      'Inclinar demasiado el tronco hacia adelante.',
      'Paso demasiado corto (la rodilla se adelanta mucho del pie).',
      'Perder el equilibrio lateral por falta de control del glúteo medio.',
    ],
    safetyNotes: 'Mantené el torso erguido y el core firme para proteger rodillas y lumbar; si te cuesta el equilibrio, empezá sin peso o cerca de un apoyo.',
    referenceUrl: 'https://www.youtube.com/watch?v=QOVaHwm-Q6U',
    referenceType: 'youtube',
  },
  {
    name: 'Búlgaras',
    aliases: ['bulgarian split squat', 'sentadilla búlgara', 'split squat búlgaro', 'zancada búlgara'],
    description: 'Sentadilla a una pierna con el pie de atrás elevado sobre un banco.',
    purpose: 'Fuerza unilateral intensa de cuádriceps y glúteos.',
    primaryMuscles: ['Cuádriceps', 'Glúteo mayor'],
    secondaryMuscles: ['Isquiotibiales', 'Glúteo medio (estabilización)', 'Core'],
    equipment: ['Banco', 'Mancuernas'],
    category: 'strength',
    muscleGroup: 'legs',
    movementPattern: 'Sentadilla unilateral',
    simpleInstructions: [
      'Apoyá el empeine del pie trasero sobre un banco a la altura de la rodilla.',
      'Adelantá el pie delantero lo suficiente para que la tibia quede casi vertical en el fondo.',
      'Core firme y tronco levemente inclinado al frente.',
      'Bajá flexionando la rodilla delantera, llevando la cadera hacia abajo.',
      'Bajá hasta que el muslo delantero quede paralelo al piso.',
      'Empujá con el talón delantero para subir, sin rebotar abajo.',
    ],
    commonMistakes: [
      'Pie delantero demasiado cerca del banco (la rodilla se adelanta mucho).',
      'Que la rodilla delantera colapse hacia adentro.',
      'Inclinar el tronco en exceso o perder el equilibrio.',
      'Empujar con el pie trasero en vez de cargar la pierna delantera.',
    ],
    safetyNotes: 'Empezá sin peso para dominar el equilibrio y la posición del pie; añadí carga solo cuando controles el movimiento.',
    referenceUrl: 'https://www.youtube.com/watch?v=2C-uNgKwPLE',
    referenceType: 'youtube',
  },
  {
    name: 'Y-T-W',
    aliases: ['ytw', 'y t w', 'raises ytw', 'elevaciones ytw'],
    description: 'Serie de elevaciones de brazos, boca abajo o inclinado, dibujando las letras Y, T y W con foco en la espalda alta.',
    purpose: 'Activar y fortalecer los estabilizadores escapulares y la espalda alta para mejorar la postura y la salud del hombro.',
    primaryMuscles: ['Trapecio inferior', 'Trapecio medio', 'Romboides'],
    secondaryMuscles: ['Deltoides posterior', 'Manguito rotador', 'Serrato anterior'],
    equipment: ['Peso corporal', 'Mancuernas livianas'],
    category: 'posture',
    muscleGroup: 'back',
    movementPattern: 'Control escapular',
    postureFocus: true,
    simpleInstructions: [
      'Boca abajo en un banco o de pie inclinado desde la cadera, brazos colgando y cuello neutro.',
      'Activá primero las escápulas (bajándolas y juntándolas) antes de mover los brazos.',
      'Y: subí los brazos en diagonal sobre la cabeza, pulgares arriba.',
      'T: abrí los brazos a los lados formando una cruz.',
      'W: llevá los codos hacia abajo y atrás juntando las escápulas.',
      'Hacé cada letra de forma lenta y controlada, sin impulso.',
    ],
    commonMistakes: [
      'Encoger los hombros hacia las orejas (trapecio superior dominante).',
      'Usar impulso o balanceo en vez de control.',
      'Arquear la zona lumbar para subir los brazos.',
      'Usar demasiado peso y perder la calidad del movimiento.',
    ],
    safetyNotes: 'Usá poco o ningún peso; el foco es la activación y el control escapular, no la carga. Mantené el cuello neutro.',
    referenceUrl: ytSearch('Y T W raises ejercicio técnica espalda'),
    referenceType: 'web',
  },
  {
    name: 'Wall slides',
    aliases: ['wall slide', 'deslizamientos en pared', 'wall angels', 'ángeles en pared'],
    description: 'Deslizar los brazos por la pared manteniendo el contacto, para mejorar la movilidad y el control escapular.',
    purpose: 'Mejorar la movilidad escapular y la postura de hombros, entrenando el patrón de elevación sin compensar.',
    primaryMuscles: ['Trapecio inferior', 'Serrato anterior'],
    secondaryMuscles: ['Manguito rotador', 'Deltoides', 'Romboides'],
    category: 'mobility',
    muscleGroup: 'mobility',
    movementPattern: 'Movilidad escapular',
    postureFocus: true,
    simpleInstructions: [
      'De espaldas a la pared, con lumbar, espalda alta y cabeza en contacto.',
      'Apoyá los antebrazos y el dorso de las manos en la pared, codos a ~90° (posición de “W”).',
      'Traccioná el abdomen para no arquear la lumbar.',
      'Deslizá los brazos hacia arriba (hacia la “Y”) sin despegar manos ni antebrazos.',
      'Bajá controlando juntando las escápulas hacia abajo y atrás.',
    ],
    commonMistakes: [
      'Despegar la zona lumbar de la pared (compensar con el arqueo).',
      'Perder el contacto de manos o antebrazos al subir.',
      'Encoger los hombros hacia las orejas.',
      'Forzar el rango más allá de donde mantenés el contacto.',
    ],
    safetyNotes: 'Mové solo dentro del rango donde mantenés todo el contacto con la pared; es un ejercicio de control, sin carga.',
    referenceUrl: 'https://www.youtube.com/watch?v=d6V2Exzb324',
    referenceType: 'youtube',
  },
  {
    name: 'Retracción escapular',
    aliases: ['scapular retraction', 'retracción de escápulas', 'scapular pull up', 'retracciones escapulares'],
    description: 'Juntar y deprimir las escápulas de forma activa, con o sin barra, sin flexionar los codos.',
    purpose: 'Activar la espalda alta y mejorar el control escapular, base para dominadas y remos.',
    primaryMuscles: ['Romboides', 'Trapecio medio', 'Trapecio inferior'],
    secondaryMuscles: ['Dorsal ancho', 'Deltoides posterior', 'Serrato anterior'],
    equipment: ['Peso corporal', 'Barra', 'Banda'],
    category: 'posture',
    muscleGroup: 'back',
    movementPattern: 'Control escapular',
    postureFocus: true,
    simpleInstructions: [
      'Colgado de una barra (o sujetando una banda), brazos extendidos.',
      'Sin flexionar los codos, deprimí y juntá las escápulas hacia abajo y atrás.',
      'Sentí cómo el cuerpo se eleva un poco solo por el movimiento escapular.',
      'Sostené un instante la contracción.',
      'Soltá controlando hasta la posición inicial sin encoger los hombros.',
    ],
    commonMistakes: [
      'Flexionar los codos (convertirlo en un remo o dominada).',
      'Encoger los hombros hacia las orejas en lugar de deprimir las escápulas.',
      'Hacerlo con impulso o rebote.',
      'Usar un rango excesivo: el recorrido es corto.',
    ],
    safetyNotes: 'Movimiento corto y controlado; el rango es pequeño y el foco es la calidad de la contracción, no la carga.',
    referenceUrl: ytSearch('retracción escapular ejercicio técnica'),
    referenceType: 'web',
  },
  {
    name: 'Estiramiento de pectoral en puerta',
    aliases: ['doorway pec stretch', 'estiramiento pectoral puerta', 'estiramiento de pecho en marco'],
    description: 'Estiramiento del pectoral apoyando el antebrazo en el marco de una puerta y rotando el tronco.',
    purpose: 'Mejorar la movilidad del pecho y contrarrestar la postura de hombros adelantados.',
    primaryMuscles: ['Pectoral mayor'],
    secondaryMuscles: ['Pectoral menor', 'Deltoides anterior'],
    category: 'mobility',
    muscleGroup: 'mobility',
    movementPattern: 'Movilidad torácica',
    postureFocus: true,
    simpleInstructions: [
      'Apoyá el antebrazo en el marco con el codo a la altura del hombro (posición de “L”).',
      'Dá un paso adelante con el pie del mismo lado.',
      'Mantené el tronco erguido y las costillas abajo (sin arquear la lumbar).',
      'Rotá suavemente el tronco hacia el lado contrario hasta sentir el estiramiento en el pecho.',
      'Sostené 20-30 segundos respirando, y cambiá de lado.',
    ],
    commonMistakes: [
      'Forzar hasta el dolor.',
      'Encoger el hombro hacia la oreja.',
      'Arquear la lumbar al rotar.',
      'Contener la respiración.',
    ],
    safetyNotes: 'Estiramiento suave y mantenido; debe sentirse tensión, nunca dolor. Probá distintas alturas del codo para enfocar distintas fibras del pectoral.',
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
