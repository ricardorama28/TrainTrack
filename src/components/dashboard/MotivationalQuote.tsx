// Messages indexed by [dayOfWeek 0-6][timeSlot 0=mañana, 1=tarde, 2=noche]
const MESSAGES: string[][] = [
  // Domingo (0)
  [
    'Domingo de mañana: el mejor momento para un entrenamiento sin apuro.',
    'Domingo de tarde — un movimiento liviano recarga la semana que viene.',
    'Domingo a la noche: cerrá la semana con calma. Mañana arranca de nuevo.',
  ],
  // Lunes (1)
  [
    '¡Arranca la semana! Lunes de mañana: el mejor momento para marcar el tono.',
    'La semana ya arrancó. Una sesión esta tarde y ya tenés momentum.',
    'Lunes a la noche. Si todavía no entrenaste, mañana es tuyo.',
  ],
  // Martes (2)
  [
    'Martes: ya superaste el lunes. Ahora a construir sobre eso.',
    'Mitad de semana laboral. Buen momento para sumar movimiento.',
    'Martes a la noche — cada sesión es un depósito en tu banco de salud.',
  ],
  // Miércoles (3)
  [
    '¡Con toda ese Miércoles! Ideal para cortar la semana con un buen entrenamiento.',
    'Ecuatorial de la semana. Lo que hagas hoy define cómo terminás.',
    'Miércoles a la noche: todavía hay tiempo para mover el cuerpo.',
  ],
  // Jueves (4)
  [
    'Jueves — ya casi llegás al finde. Un empuje más y lo tenés.',
    '¡Casi viernes! Dale que falta poco.',
    'Jueves a la noche: los que entrenan hoy llegan al finde tranquilos.',
  ],
  // Viernes (5)
  [
    '¡Viernes! Cerrá la semana de frente. Una sesión más y llegás al finde con todo dado.',
    'Viernes de tarde. ¿Dejaste algo en el tanque esta semana?',
    'Viernes a la noche: si entrenaste, a disfrutar. Si no, el finde es largo.',
  ],
  // Sábado (6)
  [
    'Sábado de mañana: sin reloj, sin prisa. El mejor entreno de la semana puede ser hoy.',
    'Sábado de tarde — todavía hay luz. Aprovechalo.',
    'Sábado a la noche: el descanso también es parte del proceso.',
  ],
];

function getTimeSlot(hour: number): number {
  if (hour < 13) return 0; // mañana
  if (hour < 20) return 1; // tarde
  return 2;                // noche
}

export function MotivationalQuote() {
  const now = new Date();
  const day = now.getDay();       // 0 (Dom) – 6 (Sáb)
  const slot = getTimeSlot(now.getHours());
  const message = MESSAGES[day][slot];

  // Antes: caja lima centrada, un bloque más compitiendo por atención.
  // Ahora: nota al pie, fuera de tarjeta. Está para quien la busca.
  return (
    <p className="border-l border-hairline-strong py-1 pl-4 text-caption text-content-subtle">
      {message}
    </p>
  );
}
