import React from 'react';

type ButtonVariant = 'primary' | 'ink' | 'secondary' | 'ghost' | 'danger' | 'accent';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  children: React.ReactNode;
}

const VARIANTS: Record<ButtonVariant, string> = {
  // El lima es la acción. Plano: el halo de color lo hacía leerse como un
  // botón brillante de plantilla, no como la única acción de la pantalla.
  primary:   'bg-primary-500 hover:bg-primary-400 active:bg-primary-600 text-ink-950',
  /* Acción fuerte que se repite en una lista. Tiene el mismo peso que
     `primary` pero no gasta lima: en una pantalla con N tarjetas, N botones de
     marca no señalan nada — solo gritan. El lima queda para la única acción
     que sí es única en la pantalla. */
  ink:       'bg-content text-canvas hover:opacity-90 active:opacity-80',
  accent:    'bg-accent-500 hover:bg-accent-400 active:bg-accent-600 text-white',
  secondary: 'bg-surface-2 hover:bg-surface-3 text-content border border-hairline hover:border-hairline-strong',
  ghost:     'bg-transparent hover:bg-surface-2 text-content-muted hover:text-content',
  danger:    'bg-red-500/10 hover:bg-red-500 text-red-600 hover:text-white border border-red-500/25 hover:border-red-500 dark:text-red-400 dark:hover:text-white',
};

const SIZES: Record<ButtonSize, string> = {
  sm: 'px-3.5 py-2 text-[13px] rounded-xl',
  md: 'px-4 py-2.5 text-sm rounded-xl',
  lg: 'px-6 py-3.5 text-base rounded-2xl',
};

export function Button({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className = '',
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`
        inline-flex items-center justify-center gap-2 font-semibold tracking-tight
        transition-all duration-200 ease-out-expo active:scale-[0.97]
        disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100
        ${VARIANTS[variant]} ${SIZES[size]}
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
      {...props}
    >
      {children}
    </button>
  );
}
