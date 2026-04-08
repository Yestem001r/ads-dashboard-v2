import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Settings, Link2, BarChart2,
  LogOut, Zap, ChevronLeft, Users
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Sidebar = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { signOut } = useAuth();

  const menuItems = [
    { icon: <LayoutDashboard size={16} />, label: 'Dashboard',   path: '/dashboard', end: true },
    { icon: <BarChart2 size={16} />,       label: 'Analytics',   path: '/dashboard/analytics' },
    { icon: <Link2 size={16} />,           label: 'Connections', path: '/dashboard/connections' },
    { icon: <Users size={16} />,           label: 'CRM',         path: '/dashboard/crm' },
    { icon: <Settings size={16} />,        label: 'Settings',    path: '/dashboard/settings' },
  ];

  return (
    <aside
      className={`h-screen flex flex-col sticky top-0 z-40 transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] shrink-0 ${isExpanded ? 'w-52' : 'w-14'}`}
      style={{ backgroundColor: 'var(--bg-surface)', borderRight: '1px solid var(--border-strong)' }}
    >
      {/* Logo */}
      <div className={`flex items-center h-12 ${isExpanded ? 'px-4' : 'justify-center'}`}>
        <div
          className="min-w-7 h-7 rounded-md flex items-center justify-center shrink-0"
          style={{ backgroundColor: 'var(--accent-color)' }}
        >
          <Zap size={14} className="text-white fill-current" />
        </div>
        <span
          className={`ml-3 font-bold text-xs tracking-widest uppercase transition-all duration-300 ${isExpanded ? 'opacity-100' : 'opacity-0 absolute pointer-events-none'}`}
          style={{ color: 'var(--text-main)' }}
        >
          ADCORE
        </span>
      </div>

      {/* Divider */}
      <div style={{ height: '1px', backgroundColor: 'var(--border-strong)' }} />

      {/* Nav */}
      <nav className="flex-1 p-2 space-y-0.5 mt-1">
        {menuItems.map((item, idx) => (
          <NavLink
            key={idx}
            to={item.path}
            end={item.end}
            className={({ isActive }) =>
              `group relative flex items-center h-8 rounded-md transition-colors duration-150 ${isActive ? '' : 'hover:bg-(--bg-surface-active)'}`
            }
            style={({ isActive }) => ({
              color: isActive ? 'var(--accent-color)' : 'var(--text-muted)',
              backgroundColor: isActive ? 'color-mix(in srgb, var(--accent-color) 10%, transparent)' : undefined,
            })}
          >
            <>
              <div className="min-w-10 flex justify-center items-center shrink-0">
                {item.icon}
              </div>
              <span className={`text-xs font-medium whitespace-nowrap transition-all duration-300 ${isExpanded ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2 absolute'}`}>
                {item.label}
              </span>
              {!isExpanded && (
                <div
                  className="absolute left-11 px-2.5 py-1 text-xs font-semibold rounded-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 pointer-events-none z-50 whitespace-nowrap"
                  style={{ backgroundColor: 'var(--bg-surface-active)', color: 'var(--text-main)', border: '1px solid var(--border-strong)', transform: 'translateX(4px)' }}
                >
                  {item.label}
                </div>
              )}
            </>
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-2 space-y-0.5 pb-3">
        <button
          onClick={signOut}
          className="w-full flex items-center h-8 rounded-md transition-colors duration-150 group relative"
          style={{ color: 'var(--text-muted)' }}
          onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'color-mix(in srgb, var(--color-error) 10%, transparent)'; e.currentTarget.style.color = 'var(--color-error)'; }}
          onMouseLeave={e => { e.currentTarget.style.backgroundColor = ''; e.currentTarget.style.color = 'var(--text-muted)'; }}
        >
          <div className="min-w-10 flex justify-center">
            <LogOut size={15} />
          </div>
          <span className={`text-xs font-medium transition-all duration-300 ${isExpanded ? 'opacity-100' : 'opacity-0 absolute'}`}>
            Logout
          </span>
          {!isExpanded && (
            <div
              className="absolute left-11 px-2.5 py-1 text-xs font-semibold rounded-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 pointer-events-none z-50 whitespace-nowrap"
              style={{ backgroundColor: 'color-mix(in srgb, var(--color-error) 12%, var(--bg-surface-active))', color: 'var(--color-error)', border: '1px solid color-mix(in srgb, var(--color-error) 20%, transparent)', transform: 'translateX(4px)' }}
            >
              Logout
            </div>
          )}
        </button>

        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center h-8 rounded-md transition-colors duration-150"
          style={{ color: 'var(--text-muted)' }}
          onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--bg-surface-active)'; e.currentTarget.style.color = 'var(--text-main)'; }}
          onMouseLeave={e => { e.currentTarget.style.backgroundColor = ''; e.currentTarget.style.color = 'var(--text-muted)'; }}
        >
          <div className="min-w-10 flex justify-center">
            <div className={`transition-transform duration-500 ${!isExpanded && 'rotate-180'}`}>
              <ChevronLeft size={15} />
            </div>
          </div>
          <span className={`text-[10px] font-bold uppercase tracking-widest transition-all duration-300 ${isExpanded ? 'opacity-40' : 'opacity-0 absolute'}`}>
            Collapse
          </span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
