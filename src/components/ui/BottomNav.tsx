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
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-gray-900/95 backdrop-blur-md border-t border-gray-800 safe-area-bottom">
      <div className="max-w-lg mx-auto flex px-1 py-1">
        {NAV_ITEMS.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center justify-center py-2 gap-0.5 text-[10px] font-semibold rounded-xl transition-all ${
                isActive
                  ? 'text-primary-400 bg-primary-500/10'
                  : 'text-gray-500 hover:text-gray-300'
              }`
            }
          >
            <span className="text-lg leading-none">{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
