import { NavLink } from 'react-router-dom';
import { Home, Calendar, ClipboardList, Dumbbell, TrendingUp, Settings2 } from 'lucide-react';

const NAV_ITEMS = [
  { to: '/',          Icon: Home,          label: 'Inicio'     },
  { to: '/calendar',  Icon: Calendar,      label: 'Calendario' },
  { to: '/routines',  Icon: ClipboardList, label: 'Rutinas'    },
  { to: '/exercises', Icon: Dumbbell,      label: 'Ejercicios' },
  { to: '/progreso',  Icon: TrendingUp,    label: 'Progreso'   },
  { to: '/settings',  Icon: Settings2,     label: 'Ajustes'    },
];

export function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-ink-900/95 backdrop-blur-md border-t border-ink-800 safe-area-bottom">
      <div className="max-w-lg mx-auto flex px-1 py-1">
        {NAV_ITEMS.map(({ to, Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center justify-center py-2 gap-0.5 text-[10px] font-semibold rounded-xl transition-all ${
                isActive
                  ? 'text-primary-400 bg-primary-500/10'
                  : 'text-gray-500 hover:text-gray-300'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={20} strokeWidth={isActive ? 2 : 1.5} />
                <span>{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
