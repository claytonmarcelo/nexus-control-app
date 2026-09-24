import { useState, useEffect } from 'react';
import { Outlet, NavLink, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useModal } from '../../contexts/ModalContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useCart } from '../../contexts/CartContext';

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
      navigate('/login');
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
      <header className="glass border-b border-border sticky top-0 z-[1000]">
        <div className="max-w-7xl 3xl:max-w-[96rem] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4 sm:gap-8">
              {/* Botão Hambúrguer para Mobile e Tablet (< 768px) */}
              <button
                type="button"
                onClick={() => setMobileMenuOpen((prev) => !prev)}
                className="md:hidden p-2 rounded-xl text-nexus-400 hover:text-primary hover:bg-hover transition-colors focus-visible:ring-2 focus-visible:ring-nexus-500"
                aria-label={mobileMenuOpen ? 'Fechar menu de navegação' : 'Abrir menu de navegação'}
                aria-expanded={mobileMenuOpen}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {mobileMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>

              <NavLink to="/dashboard" className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-nexus-500 to-nexus-700 flex items-center justify-center">
                  <NexusLogo className="w-6 h-6 text-white" />
                </div>
                <span className="font-bold text-xl text-primary hidden sm:block">Nexus Control</span>
              </NavLink>
              
              {/* Navegação Desktop e Tablet Horizontal (>= 768px) */}
              <nav className="hidden md:flex items-center gap-1">
                {navItems.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={({ isActive }) =>
                      `relative flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                        isActive
                          ? 'bg-nexus-600/20 text-nexus-400 font-semibold'
                          : 'text-nexus-400 hover:text-primary hover:bg-hover'
                      }`
                    }
                  >
                    <item.icon className="w-5 h-5" />
                    {item.label}
                    {item.path === '/carrinho' && totalItems > 0 && (
                      <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-nexus-500 text-[10px] font-bold text-white shadow-lg">
                        {totalItems > 99 ? '99+' : totalItems}
                      </span>
                    )}
                  </NavLink>
                ))}
              </nav>
            </div>

            <div className="flex items-center gap-2 sm:gap-4">
              <button onClick={toggleTheme} className="btn-ghost p-2 sm:px-4" aria-label={theme === 'dark' ? 'Ativar tema claro' : 'Ativar tema escuro'} title={theme === 'dark' ? 'Tema claro' : 'Tema escuro'}>
                <span aria-hidden="true" className="text-lg">{theme === 'dark' ? '☼' : '☾'}</span>
                <span className="hidden sm:inline">{theme === 'dark' ? 'Claro' : 'Escuro'}</span>
              </button>
              
              <div className="hidden sm:block relative">
                <button
                  className="flex items-center gap-2 px-3 py-2 rounded-xl bg-hover hover:border-border transition-colors"
                  onClick={() => navigate('/perfil')}
                  aria-label="Meu perfil"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-nexus-500 to-nexus-700 flex items-center justify-center">
                    <span className="text-sm font-medium text-white">
                      {user?.nome?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <span className="text-sm font-medium text-primary">{user?.nome}</span>
                  <svg className="w-4 h-4 text-nexus-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>

              <button
                onClick={handleLogout}
                className="btn-ghost p-2 sm:px-4"
                aria-label="Sair do sistema"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span className="hidden sm:inline">Sair</span>
              </button>
            </div>
          </div>
        </div>

        {/* Drawer Retrátil para Tablet Retrato e Mobile (< 768px) */}
        {mobileMenuOpen && (
          <div
            className="fixed inset-0 top-16 z-[999] bg-black/60 backdrop-blur-md md:hidden animate-fade-in"
            onClick={() => setMobileMenuOpen(false)}
          >
            <div
              className="glass border-b border-border p-5 space-y-4 shadow-2xl animate-slide-down"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 pb-3 border-b border-border">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-nexus-500 to-nexus-700 flex items-center justify-center text-white font-semibold flex-shrink-0">
                  {user?.nome?.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-primary truncate">{user?.nome}</p>
                  <p className="text-xs text-nexus-400 truncate">{user?.email}</p>
                </div>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    navigate('/perfil');
                  }}
                  className="text-xs px-3 py-1.5 rounded-lg border border-border text-nexus-400 hover:text-primary hover:bg-hover transition-colors"
                >
                  Perfil
                </button>
              </div>

              <nav className="flex flex-col gap-1.5">
                {navItems.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                        isActive
                          ? 'bg-nexus-600/20 text-nexus-300 font-semibold border border-nexus-500/30'
                          : 'text-nexus-400 hover:text-primary hover:bg-hover'
                      }`
                    }
                  >
                    <div className="flex items-center gap-3">
                      <item.icon className="w-5 h-5" />
                      <span>{item.label}</span>
                    </div>
                    {item.path === '/carrinho' && totalItems > 0 && (
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-nexus-500 text-[10px] font-bold text-white shadow-lg">
                        {totalItems > 99 ? '99+' : totalItems}
                      </span>
                    )}
                  </NavLink>
                ))}
              </nav>

              <div className="pt-2 border-t border-border flex items-center justify-between">
                <button
                  onClick={toggleTheme}
                  className="btn-ghost flex items-center gap-2 text-sm py-2 px-3"
                >
                  <span>{theme === 'dark' ? '☼' : '☾'}</span>
                  <span>{theme === 'dark' ? 'Tema Claro' : 'Tema Escuro'}</span>
                </button>

                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleLogout();
                  }}
                  className="btn-ghost flex items-center gap-2 text-sm text-red-400 hover:text-red-300 py-2 px-3"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  <span>Sair</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </header>

      <main className="main-content pb-16">
        <Outlet />
      </main>

      <footer className="glass border-t border-border mt-auto">
        <div className="max-w-7xl 3xl:max-w-[96rem] mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
            <div className="flex items-center gap-2 text-nexus-400 text-sm">
              <NexusLogo className="w-5 h-5" />
              <span className="font-medium text-primary">Nexus Control</span>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-nexus-400">
              <a href="/sobre" className="hover:text-nexus-300 transition-colors">Quem Somos</a>
              <Link to="/curriculo" className="hover:text-nexus-300 text-nexus-300 font-semibold transition-colors flex items-center gap-1">
                <span>📄</span>
                <span>Currículo</span>
              </Link>
              <span>Desenvolvido por <strong className="text-primary">Clayton Marcelo</strong></span>
              <a
                href="https://github.com/claytonmarcelo"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 hover:text-nexus-400 transition-colors"
                aria-label="GitHub do desenvolvedor"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.305-.536-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
                </svg>
              </a>
            </div>
            <p className="text-nexus-500 text-sm">
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
    <svg className={className} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="16" cy="16" r="14" stroke="currentColor" strokeWidth="2"/>
      <path d="M16 8V24M8 16H24" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <circle cx="16" cy="16" r="6" stroke="currentColor" strokeWidth="1.5" opacity="0.5"/>
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