import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useModal } from '../../contexts/ModalContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useCart } from '../../contexts/CartContext';

export default function Layout() {
  const { user, logout, isAdmin, canAccess } = useAuth();
  const { confirm } = useModal();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { totalItems } = useCart();

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
      <header className="glass border-b border-dark-border sticky top-0 z-[1000]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16">
          <div className="flex items-center justify-between h-16 lg:h-20">
            <div className="flex items-center gap-4 lg:gap-8">
              <NavLink to="/dashboard" className="flex items-center gap-2">
                <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-xl bg-gradient-to-br from-nexus-500 to-nexus-700 flex items-center justify-center">
                  <NexusLogo className="w-6 h-6 lg:w-7 lg:h-7 text-white" />
                </div>
                <span className="font-bold text-xl lg:text-2xl text-white hidden sm:block">Nexus Control</span>
              </NavLink>
              
              <nav className="hidden md:flex items-center gap-1 lg:gap-2">
                {navItems.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={({ isActive }) =>
                      `relative flex items-center gap-2 px-3 lg:px-4 py-2 rounded-xl text-sm lg:text-base font-medium transition-all duration-200 ${
                        isActive
                          ? 'bg-nexus-600/30 text-white'
                          : 'text-nexus-300 hover:text-white hover:bg-dark-hover'
                      }`
                    }
                  >
                    <item.icon className="w-5 h-5 lg:w-6 lg:h-6" />
                    <span className="hidden lg:inline">{item.label}</span>
                    {item.path === '/carrinho' && totalItems > 0 && (
                      <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-nexus-500 text-[10px] font-bold text-white shadow-lg">
                        {totalItems > 99 ? '99+' : totalItems}
                      </span>
                    )}
                  </NavLink>
                ))}
              </nav>
            </div>

            <div className="flex items-center gap-2 lg:gap-4">
              <button onClick={toggleTheme} className="btn-ghost p-2 sm:px-4 lg:px-6 lg:py-3" aria-label={theme === 'dark' ? 'Ativar tema claro' : 'Ativar tema escuro'} title={theme === 'dark' ? 'Tema claro' : 'Tema escuro'}>
                <span aria-hidden="true" className="text-lg lg:text-xl">{theme === 'dark' ? '☼' : '☾'}</span>
                <span className="hidden sm:inline lg:text-base">{theme === 'dark' ? 'Claro' : 'Escuro'}</span>
              </button>
              <div className="hidden sm:block relative">
                <button
                  className="flex items-center gap-2 px-3 py-2 lg:px-4 lg:py-3 rounded-xl bg-dark-hover hover:bg-dark-border transition-colors"
                  onClick={() => navigate('/perfil')}
                >
                  <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-full bg-gradient-to-br from-nexus-500 to-nexus-700 flex items-center justify-center">
                    <span className="text-sm lg:text-base font-medium text-white">
                      {user?.nome?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <span className="text-sm lg:text-base font-medium text-white hidden lg:inline">{user?.nome}</span>
                  <svg className="w-4 h-4 lg:w-5 lg:h-5 text-nexus-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>

              <button
                onClick={handleLogout}
                className="btn-ghost p-2 sm:px-4 lg:px-6 lg:py-3"
                aria-label="Sair do sistema"
              >
                <svg className="w-5 h-5 lg:w-6 lg:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span className="hidden sm:inline lg:text-base">Sair</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="main-content">
        <Outlet />
      </main>

      <footer className="glass border-t border-dark-border mt-auto sticky bottom-0 z-[1000]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16 py-6 lg:py-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
            <div className="flex items-center gap-2 text-nexus-400 text-sm lg:text-base">
              <NexusLogo className="w-5 h-5 lg:w-6 lg:h-6" />
              <span className="font-medium text-white text-base lg:text-lg">Nexus Control</span>
            </div>
            <div className="flex items-center gap-4 text-sm lg:text-base text-nexus-400">
              <span>Desenvolvido por <strong className="text-white">Clayton Marcelo</strong></span>
              <a
                href="https://github.com/claytonmarcelo"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 hover:text-nexus-400 transition-colors"
                aria-label="GitHub do desenvolvedor"
              >
                <svg className="w-5 h-5 lg:w-6 lg:h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.305-.536-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
                </svg>
              </a>
              <a
                href="https://www.linkedin.com/in/clayton-marcelo-dev/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 hover:text-nexus-400 transition-colors"
                aria-label="LinkedIn do desenvolvedor"
              >
                <svg className="w-5 h-5 lg:w-6 lg:h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
              </a>
            </div>
            <p className="text-nexus-500 text-sm lg:text-base">
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