import { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useModal } from '../../contexts/ModalContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useCart } from '../../contexts/CartContext';
import ThemeToggle from '../ui/ThemeToggle';

const ROLE_META = {
  admin:      { label: 'Administrador', color: '#ef4444', bg: 'rgba(239,68,68,0.10)', border: 'rgba(239,68,68,0.25)' },
  funcionario:{ label: 'Funcionário',   color: '#10b981', bg: 'rgba(16,185,129,0.10)', border: 'rgba(16,185,129,0.25)' },
  cliente:    { label: 'Cliente',       color: '#d4af37', bg: 'rgba(212,175,55,0.10)', border: 'rgba(212,175,55,0.25)' },
};

export default function Layout() {
  const { user, logout, isAdmin, canAccess } = useAuth();
  const { confirm } = useModal();
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const { totalItems } = useCart();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Fecha menu mobile em troca de rota
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // Fecha menu mobile com tecla ESC
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setMobileMenuOpen(false);
    };
    if (mobileMenuOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [mobileMenuOpen]);

  // Trava scroll do body quando menu mobile está aberto
  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileMenuOpen]);

  const handleLogout = async () => {
    const confirmed = await confirm({
      title: 'Sair do sistema',
      message: 'Tem certeza que deseja sair?',
      confirmText: 'Sim, sair',
      cancelText: 'Cancelar',
      variant: 'warning',
    });
    
    if (confirmed) {
      logout();
    }
  };

  const navItems = [
    ...(canAccess('dashboard') ? [{ path: '/dashboard', label: 'Dashboard', icon: DashboardIcon }] : []),
    ...(canAccess('itens') ? [{ path: '/itens', label: 'Catálogo', icon: BoxIcon }] : []),
    ...(canAccess('carrinho') ? [{ path: '/carrinho', label: 'Carrinho', icon: CartIcon }] : []),
  ];

  if (isAdmin && canAccess('usuarios')) {
    navItems.push({ path: '/usuarios', label: 'Usuários', icon: UsersIcon });
  }

  if (isAdmin && canAccess('admin')) {
    navItems.push({ path: '/admin', label: 'Admin', icon: ShieldIcon });
  }

  return (
    <div className="page-container">
      <header
        className="border-b sticky top-0 z-[1000] transition-all"
        style={{
          backgroundColor: 'var(--header-bg)',
          borderColor: 'var(--header-border)',
          backdropFilter: 'var(--header-blur)',
          WebkitBackdropFilter: 'var(--header-blur)',
          boxShadow: '0 1px 0 var(--divider), 0 4px 16px rgba(0,0,0,0.06)',
        }}
      >
        <div className="max-w-7xl 3xl:max-w-[96rem] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-3 sm:gap-6">
              {/* Botão Hambúrguer para Mobile e Tablet (< 768px) */}
              <button
                type="button"
                onClick={() => setMobileMenuOpen((prev) => !prev)}
                className="md:hidden p-1.5 rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-nexus-500"
                style={{ color: 'var(--text-secondary)' }}
                aria-label={mobileMenuOpen ? 'Fechar menu de navegação' : 'Abrir menu de navegação'}
                aria-expanded={mobileMenuOpen}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {mobileMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>

              <NavLink to="/dashboard" className="flex items-center gap-2.5 group">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-transform duration-200 group-hover:scale-105"
                  style={{
                    background: 'linear-gradient(135deg, rgba(212,175,55,0.18) 0%, rgba(13,13,13,0.75) 100%)',
                    border: '1px solid rgba(212,175,55,0.35)',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.08), 0 0 10px rgba(212,175,55,0.12)',
                  }}
                >
                  <NexusLogo className="w-5 h-5" />
                </div>
                <div className="hidden sm:flex items-center gap-2">
                  <span
                    className="font-bold text-[15px] tracking-tight block leading-none"
                    style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-display)', letterSpacing: '-0.01em' }}
                  >
                    Nexus Control
                  </span>
                  <span
                    className="text-[9px] font-bold tracking-widest uppercase px-1.5 py-0.5 rounded leading-none"
                    style={{
                      color: 'var(--accent-gold)',
                      backgroundColor: 'var(--accent-gold-faint)',
                      border: '1px solid var(--accent-gold-border)',
                    }}
                  >
                    Enterprise
                  </span>
                </div>
              </NavLink>
              
              {/* Divisor vertical */}
              <div className="hidden md:block w-px h-4 opacity-30" style={{ background: 'var(--border-color-strong)' }} />

              {/* Navegação Desktop e Tablet Horizontal (>= 768px) */}
              <nav className="hidden md:flex items-center gap-1">
                {navItems.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={({ isActive }) =>
                      `relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs sm:text-[13px] font-medium transition-all duration-200 ${
                        isActive
                          ? 'font-semibold'
                          : 'hover:bg-dark-hover'
                      }`
                    }
                    style={({ isActive }) => ({
                      color: isActive ? 'var(--accent-gold)' : 'var(--text-secondary)',
                      backgroundColor: isActive ? 'var(--nav-active-bg)' : undefined,
                    })}
                  >
                    {({ isActive }) => (
                      <>
                        <item.icon className="w-3.5 h-3.5 flex-shrink-0" />
                        {item.label}
                        {item.path === '/carrinho' && totalItems > 0 && (
                          <span
                            className="flex h-3.5 w-3.5 items-center justify-center rounded-full text-[8.5px] font-bold"
                            style={{ background: 'var(--accent-gold)', color: '#0d0d0d' }}
                          >
                            {totalItems > 99 ? '99+' : totalItems}
                          </span>
                        )}
                        {isActive && (
                          <span
                            className="absolute bottom-0 left-2 right-2 h-[2px] rounded-full"
                            style={{ background: 'linear-gradient(90deg, transparent, var(--accent-gold), transparent)' }}
                          />
                        )}
                      </>
                    )}
                  </NavLink>
                ))}
              </nav>
            </div>

            <div className="flex items-center gap-2 sm:gap-2.5">
              {/* Theme Toggle */}
              <ThemeToggle variant="pill" id="header-theme-toggle" />
              
              {/* User Avatar */}
              <div className="hidden sm:block relative">
                <button
                  className="flex items-center gap-2 px-2 py-1 rounded-lg transition-all"
                  style={{ color: 'var(--text-primary)' }}
                  onClick={() => navigate('/perfil')}
                  aria-label="Meu perfil"
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--bg-hover)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = ''; }}
                >
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-xs"
                    style={{
                      background: 'linear-gradient(135deg, var(--accent-gold-light), var(--accent-gold-dark))',
                      color: '#0d0d0d',
                      boxShadow: '0 0 0 1.5px var(--accent-gold-border)',
                    }}
                  >
                    {user?.nome?.charAt(0).toUpperCase()}
                  </div>
                  <div className="hidden sm:flex flex-col leading-none gap-0.5">
                    <span className="text-xs font-medium" style={{ color: 'var(--text-primary)', maxWidth: '110px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {user?.nome?.split(' ')[0]}
                    </span>
                    {(() => {
                      const rm = ROLE_META[user?.nivel_acesso] || ROLE_META.cliente;
                      return (
                        <span className="text-[9px] font-bold tracking-wide" style={{ color: rm.color }}>
                          {rm.label}
                        </span>
                      );
                    })()}
                  </div>
                  <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: 'var(--text-muted)' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>

              {/* Logout */}
              <button
                onClick={handleLogout}
                className="w-8 h-8 rounded-lg flex items-center justify-center transition-all"
                style={{ color: 'var(--text-tertiary)' }}
                aria-label="Sair do sistema"
                title="Sair"
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(239,68,68,0.08)'; e.currentTarget.style.color = '#ef4444'; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = ''; e.currentTarget.style.color = 'var(--text-tertiary)'; }}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          </div>
        </div>

      {/* Drawer Retrátil para Tablet Retrato e Mobile (< 768px) */}
        {mobileMenuOpen && (
          <div
            className="fixed inset-0 top-14 z-[999] md:hidden animate-fade-in"
            style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
            onClick={() => setMobileMenuOpen(false)}
          >
            <div
              className="border-b p-5 space-y-3 shadow-2xl animate-slide-down"
              style={{
                backgroundColor: 'var(--bg-secondary)',
                borderColor: 'var(--header-border)',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div
                className="flex items-center gap-3 pb-3 border-b"
                style={{ borderColor: 'var(--divider)' }}
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center font-bold flex-shrink-0"
                  style={{
                    background: 'linear-gradient(135deg, var(--accent-gold-light), var(--accent-gold-dark))',
                    color: '#0d0d0d',
                    boxShadow: '0 0 0 2px var(--accent-gold-border)',
                  }}
                >
                  {user?.nome?.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-sm truncate" style={{ color: 'var(--text-primary)' }}>{user?.nome}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    {(() => {
                      const rm = ROLE_META[user?.nivel_acesso] || ROLE_META.cliente;
                      return (
                        <span
                          className="text-[9px] font-bold px-1.5 py-0.5 rounded-full tracking-wider uppercase"
                          style={{ color: rm.color, backgroundColor: rm.bg, border: `1px solid ${rm.border}` }}
                        >
                          {rm.label}
                        </span>
                      );
                    })()}
                    <span className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{user?.email}</span>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    navigate('/perfil');
                  }}
                  className="text-xs px-3 py-1.5 rounded-lg border transition-colors flex-shrink-0"
                  style={{ borderColor: 'var(--border-color)', color: 'var(--accent-gold)', backgroundColor: 'var(--accent-gold-faint)' }}
                >
                  Perfil
                </button>
              </div>

              <nav className="flex flex-col gap-1">
                {navItems.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                        isActive ? 'font-semibold' : ''
                      }`
                    }
                    style={({ isActive }) => ({
                      color: isActive ? 'var(--accent-gold)' : 'var(--text-secondary)',
                      backgroundColor: isActive ? 'var(--nav-active-bg)' : 'transparent',
                      borderLeft: isActive ? '2px solid var(--accent-gold)' : '2px solid transparent',
                    })}
                  >
                    <div className="flex items-center gap-3">
                      <item.icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </div>
                    {item.path === '/carrinho' && totalItems > 0 && (
                      <span
                        className="flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold"
                        style={{ background: 'var(--accent-gold)', color: '#0d0d0d' }}
                      >
                        {totalItems > 99 ? '99+' : totalItems}
                      </span>
                    )}
                  </NavLink>
                ))}
              </nav>

              <div
                className="pt-2 border-t flex flex-col gap-2"
                style={{ borderColor: 'var(--divider)' }}
              >
                <ThemeToggle variant="mobile" />

                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleLogout();
                  }}
                  className="flex items-center gap-2 text-xs py-2 px-3 rounded-lg transition-all w-full justify-center font-medium"
                  style={{ color: '#ef4444', backgroundColor: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)' }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(239,68,68,0.12)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'rgba(239,68,68,0.06)'; }}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  <span>Sair do sistema</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </header>

      <main className="main-content pb-16">
        <Outlet />
      </main>

      <footer
        className="border-t mt-auto transition-colors"
        style={{
          backgroundColor: 'var(--header-bg)',
          borderColor: 'var(--header-border)',
          backdropFilter: 'var(--header-blur)',
          WebkitBackdropFilter: 'var(--header-blur)',
          boxShadow: '0 -1px 0 var(--divider), 0 -4px 16px rgba(0,0,0,0.04)',
        }}
      >
        <div className="max-w-7xl 3xl:max-w-[96rem] mx-auto px-4 sm:px-6 lg:px-8 py-2.5 sm:py-3">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 sm:gap-4 text-center sm:text-left">
            <div className="flex items-center gap-2 justify-center sm:justify-start">
              <div
                className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0"
                style={{
                  background: 'linear-gradient(135deg, rgba(212,175,55,0.18) 0%, rgba(13,13,13,0.7) 100%)',
                  border: '1px solid rgba(212,175,55,0.3)',
                }}
              >
                <NexusLogo className="w-3.5 h-3.5" />
              </div>
              <span className="text-xs font-semibold tracking-tight" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>
                Nexus Control
              </span>
              <span className="text-[10px] hidden md:inline-block px-1.5 py-0.2 rounded" style={{ color: 'var(--text-tertiary)', borderLeft: '1px solid var(--border-color)', paddingLeft: '8px' }}>
                Enterprise Suite
              </span>
            </div>

            <div className="flex items-center justify-center gap-1.5 text-xs" style={{ color: 'var(--text-secondary)' }}>
              <span>Desenvolvido por</span>
              <a
                href="https://github.com/claytonmarcelo"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 font-medium px-2 py-0.5 rounded-md transition-all group"
                style={{
                  color: 'var(--text-primary)',
                  backgroundColor: 'var(--bg-hover)',
                  border: '1px solid var(--border-color)',
                }}
                aria-label="GitHub de Clayton Marcelo"
              >
                <span className="group-hover:text-nexus-gold transition-colors font-semibold">Clayton Marcelo</span>
                <svg className="w-3.5 h-3.5 text-nexus-gold opacity-80 group-hover:opacity-100 transition-opacity" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.305-.536-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
                </svg>
              </a>
            </div>

            <p className="text-[11px] sm:text-xs" style={{ color: 'var(--text-tertiary)' }}>
              © {new Date().getFullYear()} Todos os direitos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function DashboardIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
    </svg>
  );
}

function BoxIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
    </svg>
  );
}

function UsersIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  );
}

function NexusLogo({ className }) {
  return (
    <svg className={className} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Nexus Control">
      <defs>
        <linearGradient id="nexusGradL" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#F5D77F" />
          <stop offset="50%" stopColor="#D4AF37" />
          <stop offset="100%" stopColor="#997517" />
        </linearGradient>
        <filter id="nexusGlowL" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="1" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>
      {/* Outer ring */}
      <circle cx="24" cy="24" r="21" stroke="url(#nexusGradL)" strokeWidth="1.75" strokeOpacity="0.5" fill="none" />
      {/* Central hub */}
      <circle cx="24" cy="24" r="4.5" fill="url(#nexusGradL)" filter="url(#nexusGlowL)" />
      {/* Top */}
      <line x1="24" y1="19.5" x2="24" y2="8" stroke="url(#nexusGradL)" strokeWidth="1.75" strokeLinecap="round" />
      <circle cx="24" cy="7" r="2.5" fill="url(#nexusGradL)" />
      {/* Bottom */}
      <line x1="24" y1="28.5" x2="24" y2="40" stroke="url(#nexusGradL)" strokeWidth="1.75" strokeLinecap="round" />
      <circle cx="24" cy="41" r="2.5" fill="url(#nexusGradL)" />
      {/* Top-Right */}
      <line x1="27.9" y1="21.75" x2="36.5" y2="16.8" stroke="url(#nexusGradL)" strokeWidth="1.75" strokeLinecap="round" />
      <circle cx="37.9" cy="16" r="2.5" fill="url(#nexusGradL)" />
      {/* Bottom-Left */}
      <line x1="20.1" y1="26.25" x2="11.5" y2="31.2" stroke="url(#nexusGradL)" strokeWidth="1.75" strokeLinecap="round" />
      <circle cx="10.1" cy="32" r="2.5" fill="url(#nexusGradL)" />
      {/* Top-Left */}
      <line x1="20.1" y1="21.75" x2="11.5" y2="16.8" stroke="url(#nexusGradL)" strokeWidth="1.75" strokeLinecap="round" />
      <circle cx="10.1" cy="16" r="2.5" fill="url(#nexusGradL)" />
      {/* Bottom-Right */}
      <line x1="27.9" y1="26.25" x2="36.5" y2="31.2" stroke="url(#nexusGradL)" strokeWidth="1.75" strokeLinecap="round" />
      <circle cx="37.9" cy="32" r="2.5" fill="url(#nexusGradL)" />
    </svg>
  );
}

function CartIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-1.2 2.4A1 1 0 0 0 6.7 17H17m0 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4Zm-10 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4Z" />
    </svg>
  );
}

function ShieldIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3 5 6v5c0 4.55 2.9 8.68 7 10 4.1-1.32 7-5.45 7-10V6l-7-3Z" />
    </svg>
  );
}