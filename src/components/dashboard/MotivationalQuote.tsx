const QUOTES = [
  'El progreso, no la perfección.',
  'Un día a la vez, un rep a la vez.',
  'Tu único competidor eres vos de ayer.',
  'Cada entrenamiento cuenta, incluso el que no querías hacer.',
  'No entrenas para ser perfecta. Entrenas para ser más fuerte.',
  'Los resultados llegan cuando la constancia supera a la motivación.',
  'El cuerpo logra lo que la mente cree.',
  'No te rindas. Los comienzos siempre son los más difíciles.',
  'Fuerza no es lo que podés hacer. Es superar lo que pensabas que no podías.',
  'Cada sesión es un depósito en tu banco de salud.',
  'Moverse es cuidarse.',
  'La racha más importante es la que empieza hoy.',
];

export function MotivationalQuote() {
  // Pick a quote based on the day of the year so it changes daily
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000
  );
  const quote = QUOTES[dayOfYear % QUOTES.length];

  return (
    <div className="px-4 py-3 bg-primary-50 dark:bg-primary-900/20 rounded-2xl border border-primary-100 dark:border-primary-800">
      <p className="text-sm text-primary-700 dark:text-primary-300 font-medium text-center italic">
        "{quote}"
      </p>
    </div>
  );
}
