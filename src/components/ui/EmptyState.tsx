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
    <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
      <div className="mb-3 text-gray-300 dark:text-gray-600 [&>svg]:w-10 [&>svg]:h-10" aria-hidden="true">
        {icon ?? <Inbox size={40} strokeWidth={1.5} />}
      </div>
      <h3 className="text-base font-semibold text-gray-700 dark:text-gray-200 mb-1">{title}</h3>
      {description && <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{description}</p>}
      {action}
    </div>
  );
}
