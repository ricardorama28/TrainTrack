import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  padding?: boolean;
}

export function Card({ children, className = '', onClick, padding = true }: CardProps) {
  const base = 'bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700';
  const p = padding ? 'p-4' : '';
  const interactive = onClick ? 'cursor-pointer hover:shadow-md transition-shadow active:scale-[0.98]' : '';

  return (
    <div className={`${base} ${p} ${interactive} ${className}`} onClick={onClick}>
      {children}
    </div>
  );
}
