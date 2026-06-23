import type { Routine, Exercise, ExerciseCategory, MuscleGroup } from '../types';

function id(n: number): string {
  return `sample_${n}`;
}

/** Maps a muscle group to a sensible default exercise category */
function categoryFromMuscle(mg?: MuscleGroup): ExerciseCategory {
  if (mg === 'mobility') return 'mobility';
  if (mg === 'core') return 'core';
  return 'strength';
}

function normalize(name: string): string {
  return name.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, ' ').trim();
}

/**
 * Builds the initial data set: a global exercise library derived from the
 * sample routines, plus the routines themselves linked to that library via
 * exerciseId. Used to seed localStorage on first run.
 */
export function buildSampleData(): { routines: Routine[]; exercises: Exercise[] } {
  const exerciseMap = new Map<string, Exercise>();
  const now = new Date().toISOString();
  let counter = 0;

  // Deep-clone routines so we can attach exerciseId without mutating the source
  const routines: Routine[] = sampleRoutines.map(r => ({
    ...r,
    exercises: r.exercises.map(ex => {
      const key = normalize(ex.name);
      let lib = exerciseMap.get(key);
      if (!lib) {
        lib = {
          id: `sample_ex_${counter++}`,
          name: ex.name,
          nameLower: key,
          muscleGroup: ex.muscleGroup,
          videoUrl: ex.videoUrl,
          technicalNotes: ex.notes,
          category: categoryFromMuscle(ex.muscleGroup),
          createdAt: now,
        };
        exerciseMap.set(key, lib);
      }
      return { ...ex, exerciseId: lib.id };
    }),
  }));

  return { routines, exercises: Array.from(exerciseMap.values()) };
}

export const sampleRoutines: Routine[] = [
  {
    id: id(1),
    name: 'Día A – Full Body',
    description: 'Entrenamiento completo enfocado en tren inferior y core.',
    type: 'workout',
    suggestedDays: [1, 3], // Lun, Mié
    createdAt: new Date().toISOString(),
    exercises: [
      {
        id: id(11),
        name: 'Hip Thrust',
        sets: 4,
        reps: '10',
        weight: 25,
        restSeconds: 90,
        muscleGroup: 'glutes',
        notes: 'Apoyar escápulas en banco. Apretar glúteos al subir.',
      },
      {
        id: id(12),
        name: 'Peso Muerto Rumano',
        sets: 3,
        reps: '12',
        weight: 25,
        restSeconds: 90,
        muscleGroup: 'legs',
        notes: 'Mantener espalda recta. Bajar hasta sentir tensión en isquios.',
      },
      {
        id: id(13),
        name: 'Sentadilla Goblet',
        sets: 3,
        reps: '12',
        weight: 12,
        restSeconds: 75,
        muscleGroup: 'legs',
        notes: 'Sostener mancuerna al pecho. Rodillas en línea con los pies.',
      },
      {
        id: id(14),
        name: 'Plancha',
        sets: 3,
        reps: '30 segundos',
        restSeconds: 60,
        muscleGroup: 'core',
        notes: 'Cuerpo recto. No dejar caer la cadera.',
      },
    ],
  },
  {
    id: id(2),
    name: 'Día B – Full Body',
    description: 'Entrenamiento completo enfocado en tren superior.',
    type: 'workout',
    suggestedDays: [2, 4], // Mar, Jue
    createdAt: new Date().toISOString(),
    exercises: [
      {
        id: id(21),
        name: 'Press Militar',
        sets: 3,
        reps: '10',
        weight: 7.5,
        restSeconds: 90,
        muscleGroup: 'shoulders',
        notes: 'No bloquear codos arriba. Core activo.',
      },
      {
        id: id(22),
        name: 'Curl de Bíceps',
        sets: 3,
        reps: '12',
        weight: 7.5,
        restSeconds: 60,
        muscleGroup: 'arms',
        notes: 'Codos fijos. Subir y bajar de forma controlada.',
      },
      {
        id: id(23),
        name: 'Jalón al Pecho en Máquina',
        sets: 3,
        reps: '12',
        restSeconds: 90,
        muscleGroup: 'back',
        notes: 'Tirar hacia el pecho. Omóplatos juntos al bajar.',
      },
      {
        id: id(24),
        name: 'Face Pulls',
        sets: 3,
        reps: '15',
        restSeconds: 60,
        muscleGroup: 'shoulders',
        notes: 'Ideal con polea o banda. Codos a la altura de los hombros.',
      },
      {
        id: id(25),
        name: 'Extensión de Tríceps',
        sets: 3,
        reps: '12',
        weight: 5,
        restSeconds: 60,
        muscleGroup: 'arms',
      },
    ],
  },
  {
    id: id(3),
    name: 'Glúteos',
    description: 'Sesión enfocada en desarrollo y activación de glúteos.',
    type: 'workout',
    suggestedDays: [5], // Viernes
    createdAt: new Date().toISOString(),
    exercises: [
      {
        id: id(31),
        name: 'Hip Thrust con Barra',
        sets: 4,
        reps: '12',
        weight: 30,
        restSeconds: 90,
        muscleGroup: 'glutes',
        notes: 'Progresión principal. Aumentar peso cada semana si es posible.',
      },
      {
        id: id(32),
        name: 'Sentadilla Búlgara',
        sets: 3,
        reps: '10',
        weight: 10,
        restSeconds: 90,
        muscleGroup: 'legs',
        notes: '10 repeticiones por pierna. Pie trasero elevado en banco.',
      },
      {
        id: id(33),
        name: 'Patada de Glúteo en Máquina',
        sets: 3,
        reps: '15',
        restSeconds: 60,
        muscleGroup: 'glutes',
        notes: '15 rep por pierna. Extensión completa.',
      },
      {
        id: id(34),
        name: 'Sentadilla Sumo',
        sets: 3,
        reps: '12',
        weight: 20,
        restSeconds: 75,
        muscleGroup: 'glutes',
        notes: 'Pies bien abiertos, puntas hacia afuera.',
      },
      {
        id: id(35),
        name: 'Abducción de Cadera en Máquina',
        sets: 3,
        reps: '15',
        restSeconds: 60,
        muscleGroup: 'glutes',
        isOptional: true,
      },
    ],
  },
  {
    id: id(4),
    name: 'Movilidad y Correctivos',
    description: 'Sesión suave de movilidad, postura y activación. Ideal como descanso activo.',
    type: 'active-rest',
    suggestedDays: [0, 6], // Dom, Sáb
    createdAt: new Date().toISOString(),
    exercises: [
      {
        id: id(41),
        name: 'Movilidad de Cadera (90/90)',
        sets: 3,
        reps: '10',
        restSeconds: 30,
        muscleGroup: 'mobility',
        notes: 'Posición 90/90 en el suelo. Rotar cadera despacio.',
      },
      {
        id: id(42),
        name: 'Cat-Cow (Gato-Vaca)',
        sets: 3,
        reps: '10',
        restSeconds: 30,
        muscleGroup: 'mobility',
        notes: 'Respiración coordinada: exhalar al arquear, inhalar al extender.',
      },
      {
        id: id(43),
        name: 'Estiramiento de Pecho en Marco de Puerta',
        sets: 2,
        reps: '30 segundos',
        restSeconds: 30,
        muscleGroup: 'chest',
        notes: 'Mantener postura erguida. Sentir apertura en pectoral.',
      },
      {
        id: id(44),
        name: 'Rotación de Hombros con Banda',
        sets: 2,
        reps: '15',
        restSeconds: 30,
        muscleGroup: 'shoulders',
        notes: 'Movimiento lento y controlado.',
      },
      {
        id: id(45),
        name: 'Puente de Glúteo Activación',
        sets: 2,
        reps: '15',
        restSeconds: 30,
        muscleGroup: 'glutes',
        notes: 'Sin peso. Énfasis en la contracción.',
      },
      {
        id: id(46),
        name: 'Estiramiento de Cuádriceps de Pie',
        sets: 2,
        reps: '30 segundos',
        restSeconds: 30,
        muscleGroup: 'legs',
        isOptional: true,
      },
    ],
  },
];
