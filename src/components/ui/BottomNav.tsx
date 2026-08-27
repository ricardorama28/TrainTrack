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

/**
 * Dock flotante en vez de barra pegada al borde: separa la navegación del
 * contenido, deja respirar el canvas y mantiene la base grafito de la marca en
 * ambos temas. El estado activo es una píldora sobre grafito, no un color de
 * texto suelto.
 */
export function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 pointer-events-none safe-area-bottom">
      <div className="max-w-lg mx-auto px-4 pb-3">
        <div className="pointer-events-auto flex items-stretch gap-0.5 rounded-[1.5rem] border border-white/[0.07] bg-ink-900/85 p-1.5 shadow-dock backdrop-blur-xl">
          {NAV_ITEMS.map(({ to, Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `group relative flex-1 flex flex-col items-center justify-center gap-1 rounded-[1.1rem] py-2
                 text-[9.5px] font-semibold tracking-tight transition-colors duration-200 ${
                   isActive ? 'text-primary-300' : 'text-gray-400 hover:text-gray-200'
                 }`
              }
            >
              {({ isActive }) => (
                <>
                  {/* Píldora activa: superficie + punto de marca. */}
                  <span
                    className={`absolute inset-0 rounded-[1.1rem] bg-primary-500/[0.14] ring-1 ring-inset ring-primary-400/25 transition-all duration-300 ease-out-expo ${
                      isActive ? 'opacity-100 scale-100' : 'opacity-0 scale-90'
                    }`}
                    aria-hidden="true"
                  />
                  <Icon
                    size={19}
                    strokeWidth={isActive ? 2.2 : 1.6}
                    className="relative transition-transform duration-300 ease-out-expo group-active:scale-90"
                  />
                  <span className="relative">{label}</span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </div>
    </nav>
  );
}
