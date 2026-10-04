import { useTheme } from '../../contexts/ThemeContext';

export default function ThemeToggle({ variant = 'pill', className = '', id }) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  if (variant === 'auth') {
    return (
      <button
        id={id || 'auth-theme-toggle'}
        type="button"
        onClick={toggleTheme}
        className={`auth-theme-toggle ${className}`}
        aria-label={isDark ? 'Ativar tema claro' : 'Ativar tema escuro'}
        title={isDark ? 'Mudar para tema claro' : 'Mudar para tema escuro'}
      >
        <span className="auth-theme-icon-wrap" aria-hidden="true">
          {isDark ? <SunIcon className="w-4 h-4 text-nexus-gold" /> : <MoonIcon className="w-4 h-4 text-nexus-gold" />}
        </span>
        <span className="auth-theme-text">{isDark ? 'Claro' : 'Escuro'}</span>
      </button>
    );
  }

  if (variant === 'icon') {
    return (
      <button
        id={id}
        type="button"
        onClick={toggleTheme}
        className={`relative inline-flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-nexus-500 group ${className}`}
        style={{
          background: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.04)',
          border: '1px solid var(--border-color)',
          color: 'var(--accent-gold)',
        }}
        aria-label={isDark ? 'Ativar tema claro' : 'Ativar tema escuro'}
        title={isDark ? 'Tema claro' : 'Tema escuro'}
      >
        <span className="transition-transform duration-300 group-hover:rotate-12 group-hover:scale-110">
          {isDark ? <SunIcon className="w-4 h-4" /> : <MoonIcon className="w-4 h-4" />}
        </span>
      </button>
    );
  }

  if (variant === 'mobile') {
    return (
      <div className={`flex items-center justify-between w-full py-2 px-1 ${className}`}>
        <div className="flex items-center gap-2.5">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{
              background: 'var(--accent-gold-faint)',
              color: 'var(--accent-gold)',
              border: '1px solid var(--accent-gold-border)',
            }}
          >
            {isDark ? <MoonIcon className="w-3.5 h-3.5" /> : <SunIcon className="w-3.5 h-3.5" />}
          </div>
          <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
            Modo {isDark ? 'Escuro' : 'Claro'}
          </span>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={isDark}
          onClick={toggleTheme}
          className="relative inline-flex items-center h-6 w-11 rounded-full p-0.5 cursor-pointer transition-colors duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-nexus-500"
          style={{
            backgroundColor: isDark ? 'rgba(212, 175, 55, 0.18)' : 'rgba(0, 0, 0, 0.1)',
            border: '1px solid var(--border-color)',
          }}
          aria-label={isDark ? 'Ativar tema claro' : 'Ativar tema escuro'}
        >
          <span
            className={`inline-block w-4 h-4 rounded-full transition-transform duration-300 ease-out shadow-sm flex items-center justify-center ${
              isDark ? 'translate-x-5' : 'translate-x-0.5'
            }`}
            style={{
              background: 'linear-gradient(135deg, var(--accent-gold-light), var(--accent-gold-dark))',
              color: '#0d0d0d',
            }}
          >
            {isDark ? <MoonIcon className="w-2.5 h-2.5" /> : <SunIcon className="w-2.5 h-2.5" />}
          </span>
        </button>
      </div>
    );
  }

  // Default: 'pill' switch for Desktop Header
  return (
    <button
      id={id || 'global-theme-toggle'}
      type="button"
      role="switch"
      aria-checked={isDark}
      onClick={toggleTheme}
      className={`relative inline-flex items-center h-7 w-[52px] rounded-full p-0.5 cursor-pointer select-none transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-nexus-500 group ${className}`}
      style={{
        backgroundColor: isDark ? 'rgba(18, 18, 18, 0.85)' : 'rgba(235, 233, 227, 0.9)',
        border: '1px solid var(--border-color)',
        boxShadow: isDark
          ? 'inset 0 1px 3px rgba(0,0,0,0.5), 0 1px 2px rgba(212,175,55,0.08)'
          : 'inset 0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(212,175,55,0.15)',
      }}
      aria-label={isDark ? 'Ativar tema claro' : 'Ativar tema escuro'}
      title={isDark ? 'Mudar para tema claro' : 'Mudar para tema escuro'}
    >
      {/* Background track icons */}
      <div className="absolute inset-0 flex items-center justify-between px-1.5 pointer-events-none text-nexus-gold">
        <SunIcon
          className={`w-3 h-3 transition-opacity duration-200 ${
            isDark ? 'opacity-35' : 'opacity-0'
          }`}
        />
        <MoonIcon
          className={`w-3 h-3 transition-opacity duration-200 ${
            isDark ? 'opacity-0' : 'opacity-40'
          }`}
        />
      </div>

      {/* Sliding thumb knob */}
      <span
        className={`relative z-10 inline-flex items-center justify-center w-[22px] h-[22px] rounded-full transition-transform duration-300 ease-out shadow-sm group-hover:scale-105 ${
          isDark ? 'translate-x-[24px]' : 'translate-x-0'
        }`}
        style={{
          background: 'linear-gradient(135deg, var(--accent-gold-light), var(--accent-gold-dark))',
          boxShadow: isDark
            ? '0 0 8px rgba(212, 175, 55, 0.45), 0 1px 3px rgba(0,0,0,0.4)'
            : '0 2px 6px rgba(212, 175, 55, 0.35), 0 1px 2px rgba(0,0,0,0.2)',
          color: '#0d0d0d',
        }}
      >
        {isDark ? (
          <MoonIcon className="w-3 h-3 fill-current" />
        ) : (
          <SunIcon className="w-3 h-3 fill-current" />
        )}
      </span>
    </button>
  );
}

function SunIcon({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="4" strokeWidth="2" fill="currentColor" fillOpacity="0.25" />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32l1.41 1.41M2 12h2m16 0h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"
      />
    </svg>
  );
}

function MoonIcon({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
        fill="currentColor"
        fillOpacity="0.25"
      />
    </svg>
  );
}
