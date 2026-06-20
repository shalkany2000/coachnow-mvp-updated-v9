import { ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import { cn } from '../../utils/cn';

interface SidebarItem {
  label: string;
  path: string;
  icon: ReactNode;
}

interface SidebarProps {
  items: SidebarItem[];
  title?: string;
}

export function Sidebar({ items, title }: SidebarProps) {
  return (
    <>
      {/* Mobile/tablet: the vertical sidebar below is hidden under the lg
          breakpoint, so without this strip there is no way to navigate
          between dashboard sections on a phone. */}
      <nav
        aria-label={title}
        className="lg:hidden flex gap-2 overflow-x-auto bg-white border-b border-gray-100 px-3 py-2.5"
      >
        {items.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              cn(
                'flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors',
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-50 text-gray-600 border border-gray-200'
              )
            }
          >
            <span className="w-3.5 h-3.5 flex-shrink-0">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>

      <aside className="hidden lg:flex flex-col w-64 min-h-screen bg-gray-50 border-r border-gray-200 pt-6 pb-8 px-4 gap-1">
        {title && (
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 mb-3">{title}</p>
        )}
        {items.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150',
                isActive
                  ? 'bg-blue-50 text-blue-700 shadow-sm'
                  : 'text-gray-600 hover:bg-white hover:text-gray-900 hover:shadow-sm'
              )
            }
          >
            <span className="w-5 h-5 flex-shrink-0">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </aside>
    </>
  );
}
