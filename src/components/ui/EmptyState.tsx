import { Inbox } from 'lucide-react';

interface EmptyStateProps {
  /** A lucide icon element (e.g. `<Dumbbell />`); sized/colored by this component. */
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-14 px-6 text-center">
      {/* El icono va dentro de un disco de superficie: deja de flotar suelto. */}
      <div
        className="mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-surface-2 ring-1 ring-inset ring-hairline
                   text-content-subtle [&>svg]:w-7 [&>svg]:h-7"
        aria-hidden="true"
      >
        {icon ?? <Inbox strokeWidth={1.5} />}
      </div>
      <h3 className="mb-1 text-title text-content">{title}</h3>
      {description && (
        <p className="text-sm leading-relaxed text-content-muted max-w-[34ch] mb-5">{description}</p>
      )}
      {action}
    </div>
  );
}
