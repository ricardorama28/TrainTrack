import { NavLink } from 'react-router-dom';

const NAV_ITEMS = [
  { to: '/',          icon: '🏠', label: 'Inicio'     },
  { to: '/calendar',  icon: '📅', label: 'Calendario' },
  { to: '/routines',  icon: '📋', label: 'Rutinas'    },
  { to: '/exercises', icon: '💪', label: 'Ejercicios' },
  { to: '/settings',  icon: '⚙️', label: 'Ajustes'   },
];

export function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 safe-area-bottom">
      <div className="max-w-lg mx-auto flex">
        {NAV_ITEMS.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center justify-center py-2.5 gap-0.5 text-[10px] font-medium transition-colors ${
                isActive
                  ? 'text-primary-600 dark:text-primary-400'
                  : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
              }`
            }
          >
            <span className="text-xl leading-none">{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
