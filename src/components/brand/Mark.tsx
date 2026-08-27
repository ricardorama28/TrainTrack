interface MarkProps {
  /** Lado en píxeles. */
  size?: number;
  className?: string;
}

/**
 * Marca gráfica de alfallo: tres unidades completas y una que no cierra — el
 * punto donde la repetición no sale.
 *
 * Reglas del signo: el hueco es siempre la última unidad, a la derecha, nunca
 * centrado y nunca dos. La orientación es horizontal; nada ascendente, que era
 * justamente el logo genérico que se reemplaza.
 *
 * Dos dibujos, no un SVG escalado. Por debajo de `OUTLINE_MIN_SIZE` la unidad
 * abierta se dibuja como relleno atenuado en vez de contorno: a 28px la barra
 * mide unos 2.8px, así que cualquier trazo legible la rellena entera y las
 * cuatro unidades quedan idénticas. El relleno atenuado conserva lo que el
 * signo tiene que decir — tres iguales y una distinta — sin depender de un
 * filete que a ese tamaño no existe. Es el mismo criterio que separa
 * `icon.svg` de la variante de 32px en los assets.
 *
 * Tinta única vía `currentColor`: el contraste que sostiene el concepto es
 * lleno contra vacío, no color contra color. Eso deja que la cabecera lo pinte
 * en neutro y que el lima quede para el presupuesto de color de la pantalla.
 * Las versiones a color viven en `public/`, donde el ícono es la marca y no un
 * elemento más de la interfaz.
 */

/** Tamaño a partir del cual el contorno se lee. Por debajo se empasta. */
const OUTLINE_MIN_SIZE = 40;

/** Grosor del contorno en unidades del viewBox (32), heredado de `icon.svg`. */
const STROKE = 0.75;

const UNITS = [5, 11, 17];
const OPEN = { x: 23, y: 10.25, w: 4, h: 11.5, rx: 1.1 };

export function Mark({ size = 28, className = '' }: MarkProps) {
  const outlined = size >= OUTLINE_MIN_SIZE;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {UNITS.map(x => (
        <rect key={x} x={x} y={OPEN.y} width={OPEN.w} height={OPEN.h} rx={OPEN.rx} fill="currentColor" />
      ))}

      {outlined ? (
        <rect
          x={OPEN.x + STROKE / 2}
          y={OPEN.y + STROKE / 2}
          width={OPEN.w - STROKE}
          height={OPEN.h - STROKE}
          rx={OPEN.rx - STROKE / 2}
          fill="none"
          stroke="currentColor"
          strokeWidth={STROKE}
        />
      ) : (
        <rect
          x={OPEN.x}
          y={OPEN.y}
          width={OPEN.w}
          height={OPEN.h}
          rx={OPEN.rx}
          fill="currentColor"
          opacity="0.3"
        />
      )}
    </svg>
  );
}
