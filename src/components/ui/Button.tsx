import React from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'accent';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  children: React.ReactNode;
}

const VARIANTS: Record<ButtonVariant, string> = {
  // El lima es la acción. Una sola sombra de color, sin degradado.
  primary:   'bg-primary-500 hover:bg-primary-400 active:bg-primary-600 text-ink-950 shadow-[0_1px_2px_rgb(14_20_17/0.10),0_8px_20px_-10px_rgb(132_215_23/0.65)]',
  accent:    'bg-accent-500 hover:bg-accent-400 active:bg-accent-600 text-white shadow-[0_1px_2px_rgb(14_20_17/0.10),0_8px_20px_-10px_rgb(248_95_38/0.55)]',
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
