import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  maxWidth?: string;
}

export function Modal({ open, onClose, title, children, maxWidth = 'max-w-lg' }: ModalProps) {
  // Close on Escape key
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  // Prevent scroll when modal is open
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-ink-950/60 backdrop-blur-[3px] animate-fade-in"
        onClick={onClose}
      />
      {/* Panel — hoja inferior en móvil, tarjeta centrada en desktop. */}
      <div
        className={`relative w-full ${maxWidth} animate-sheet-up bg-surface border border-hairline
                    rounded-t-sheet sm:rounded-hero shadow-float max-h-[92vh] overflow-y-auto`}
      >
        {/* Asa de arrastre: señal de "hoja" en móvil. */}
        <div className="sm:hidden sticky top-0 z-10 flex justify-center pt-3 pb-1 bg-surface">
          <span className="h-1 w-9 rounded-full bg-hairline-strong" aria-hidden="true" />
        </div>

        {title && (
          <div className="flex items-center justify-between gap-4 px-5 pb-4 pt-3 sm:pt-5 border-b border-hairline">
            <h2 className="text-title text-content">{title}</h2>
            <button
              onClick={onClose}
              className="shrink-0 p-2 -mr-1 rounded-full text-content-subtle hover:text-content hover:bg-surface-2 transition-colors"
              aria-label="Cerrar"
            >
              <X size={18} />
            </button>
          </div>
        )}
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}
