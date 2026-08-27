import React from 'react';

type CardTone = 'default' | 'hero' | 'inset' | 'bare';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  padding?: boolean;
  /**
   * `default` — superficie con filete, sin sombra (el peso lo da el contenido).
   * `hero`    — la tarjeta protagonista de la pantalla: más radio, filete de
   *             marca y una elevación mínima.
   * `inset`   — bloque hundido dentro de otra tarjeta (sin filete propio).
   * `bare`    — solo la caja, para componer superficies a medida.
   */
  tone?: CardTone;
}

const TONES: Record<CardTone, string> = {
  default: 'bg-surface border border-hairline rounded-card',
  hero:    'relative bg-surface border border-hairline rounded-hero shadow-lift brand-rule overflow-hidden',
  inset:   'bg-surface-2 rounded-card',
  bare:    'rounded-card',
};

export function Card({
  children,
  className = '',
  onClick,
  padding = true,
  tone = 'default',
}: CardProps) {
  const p = padding ? (tone === 'hero' ? 'p-5' : 'p-4') : '';
  const interactive = onClick
    ? 'cursor-pointer transition-[transform,border-color,box-shadow] duration-200 ease-out-expo hover:border-hairline-strong hover:shadow-lift active:scale-[0.985]'
    : '';

  return (
    <div className={`${TONES[tone]} ${p} ${interactive} ${className}`} onClick={onClick}>
      {children}
    </div>
  );
}

interface SectionLabelProps {
  children: React.ReactNode;
  /** Acción secundaria alineada a la derecha (p. ej. un enlace "Ver más"). */
  action?: React.ReactNode;
  className?: string;
}

/**
 * Encabezado de sección del sistema. Sustituye al patrón
 * `text-[11px] uppercase tracking-wider text-primary-500` que se repetía en
 * cada bloque: aquí el color de marca no se gasta en etiquetas, se reserva
 * para datos y acciones.
 */
export function SectionLabel({ children, action, className = '' }: SectionLabelProps) {
  return (
    <div className={`flex items-baseline justify-between gap-3 ${className}`}>
      <h3 className="section-label">{children}</h3>
      {action}
    </div>
  );
}
