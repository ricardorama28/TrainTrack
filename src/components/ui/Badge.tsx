import React from 'react';

type BadgeVariant = 'green' | 'blue' | 'teal' | 'red' | 'orange' | 'gray' | 'yellow' | 'purple';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

/**
 * Cuatro familias, no ocho hues: marca (lima) · cálido (ámbar) · frío (sea) ·
 * neutro, más el rojo reservado para el fallo real. Los nombres de variante se
 * conservan para no tocar las llamadas, pero varios convergen a la misma
 * familia a propósito — la restricción cromática es el cambio.
 */
const VARIANTS: Record<BadgeVariant, string> = {
  // Marca — hecho / logrado
  green:  'bg-primary-500/12 text-primary-700 dark:text-primary-300 ring-1 ring-inset ring-primary-500/20',
  // Frío — descanso / registro pasivo
  blue:   'bg-sea-500/12 text-sea-700 dark:text-sea-300 ring-1 ring-inset ring-sea-500/20',
  teal:   'bg-sea-500/8 text-sea-600 dark:text-sea-300/90 ring-1 ring-inset ring-sea-500/15',
  // Cálido — esfuerzo / PR / atención
  orange: 'bg-accent-500/12 text-accent-700 dark:text-accent-300 ring-1 ring-inset ring-accent-500/20',
  yellow: 'bg-accent-500/8 text-accent-700 dark:text-accent-300/90 ring-1 ring-inset ring-accent-500/15',
  // Fallo
  red:    'bg-red-500/12 text-red-700 dark:text-red-300 ring-1 ring-inset ring-red-500/20',
  // Neutro — estado por defecto / metadatos
  gray:   'bg-surface-3 text-content-muted ring-1 ring-inset ring-hairline',
  // Taxonomía (grupos musculares): neutro con filete, no un color más.
  purple: 'bg-transparent text-content-muted ring-1 ring-inset ring-hairline-strong',
};

export function Badge({ children, variant = 'gray', className = '' }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold tracking-tight ${VARIANTS[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
