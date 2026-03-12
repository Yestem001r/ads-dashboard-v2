import React, { useEffect } from 'react';
import Sidebar from './Sidebar';

const Layout = ({ children }) => {
  useEffect(() => {
    const checkTheme = () => {
      const saved = localStorage.getItem('adcore_settings');
      if (saved) {
        const { theme } = JSON.parse(saved);
        if (theme === 'light') {
          document.body.classList.add('light-theme');
        } else {
          document.body.classList.remove('light-theme');
        }
      }
    };

    checkTheme();
    window.addEventListener('storage', checkTheme);
    return () => window.removeEventListener('storage', checkTheme);
  }, []);

  return (
    <div className="flex min-h-screen transition-colors duration-300" style={{ backgroundColor: 'var(--bg-base)' }}>
      <Sidebar />
      <main className="flex-1 h-screen overflow-y-auto custom-scrollbar relative">
        {/* Subtle grid background — matches Login page aesthetic */}
        <div
          className="pointer-events-none fixed inset-0 z-0"
          style={{
            backgroundImage: 'linear-gradient(var(--text-main) 1px, transparent 1px), linear-gradient(90deg, var(--text-main) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
            opacity: 0.018,
          }}
        />
        {/* Top border line */}
        <div className="sticky top-0 z-20" style={{ height: '1px', backgroundColor: 'var(--border-strong)' }} />
        <div className="relative z-10">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;