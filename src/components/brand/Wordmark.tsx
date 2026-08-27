interface WordmarkProps {
  className?: string;
}

/**
 * Marca denominativa: **alfallo**, siempre en minúscula y siempre una palabra.
 *
 * Es texto vivo, no un SVG: hereda la fuente y el color del tema, escala con el
 * tipo y se puede seleccionar. El quiebre de peso es lo que hace legible el
 * término — `al` liviano y atenuado, `fallo` medium y a color de texto pleno —
 * así que sin ese contraste la palabra se lee como una sola masa.
 *
 * Tamaños de uso: `text-xl` en la cabecera del Dashboard (con el ícono a 28px),
 * `text-4xl` en login y splash (ahí va sola: dos elementos de marca juntos
 * compiten).
 */
export function Wordmark({ className = '' }: WordmarkProps) {
  return (
    <span className={`inline-flex items-baseline tracking-tight leading-none ${className}`}>
      <span className="font-normal text-content-muted">al</span>
      <span className="font-medium text-content">fallo</span>
    </span>
  );
}
