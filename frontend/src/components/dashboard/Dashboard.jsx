import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { itemService, healthService, userService } from '../../services/services';
import { useModal } from '../../contexts/ModalContext';
import StatCard from '../ui/StatCard';
import RecentItems from '../dashboard/RecentItems';
import LoadingScreen from '../ui/LoadingScreen';

export default function Dashboard() {
  const { user, isAdmin, isFuncionario, isCliente } = useAuth();
  const { toast } = useModal();
  const [stats, setStats] = useState({ totalItens: 0, meusItens: 0, totalUsuarios: 0 });
  const [loading, setLoading] = useState(true);

  const loadDashboardData = useCallback(async () => {
    try {
      const promises = [
        itemService.getAll({ limit: 100 }),
        healthService.check()
      ];

      if (isAdmin) {
        promises.push(userService.getAll({ limit: 100 }));
      }

      const results = await Promise.all(promises);
      const itemsRes = results[0];
      const healthRes = results[1];
      const usersRes = isAdmin ? results[2] : null;

      const allItems = Array.isArray(itemsRes?.data?.items)
        ? itemsRes.data.items
        : Array.isArray(itemsRes?.data)
        ? itemsRes.data
        : Array.isArray(itemsRes?.items)
        ? itemsRes.items
        : [];

      const meusItens = allItems.filter(item => item.criado_por === user?.id).length;

      const totalUsuarios = isAdmin
        ? (Array.isArray(usersRes?.users)
            ? usersRes.users.length
            : Array.isArray(usersRes)
            ? usersRes.length
            : usersRes?.total || healthRes?.data?.users || 0)
        : 0;

      setStats({
        totalItens: allItems.length,
        meusItens,
        totalUsuarios
      });
    } catch (error) {
      console.error('Erro ao carregar dashboard:', error);
      toast({ message: 'Erro ao carregar dados do dashboard', variant: 'danger' });
    } finally {
      setLoading(false);
    }
  }, [user, isAdmin, toast]);

  useEffect(() => {
    if (user) loadDashboardData();
  }, [user, loadDashboardData]);

  if (loading) return <LoadingScreen />;

  const getWelcomeMessage = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bom dia';
    if (hour < 18) return 'Boa tarde';
    return 'Boa noite';
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <p
            className="text-xs font-semibold tracking-widest uppercase mb-2"
            style={{ color: 'var(--accent-gold)', letterSpacing: '0.12em' }}
          >
            {getWelcomeMessage()}
          </p>
          <h1
            className="text-3xl font-bold leading-tight"
            style={{
              color: 'var(--text-primary)',
              fontFamily: 'var(--font-display)',
              letterSpacing: '-0.02em',
            }}
          >
            {user?.nome}
          </h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
            Acompanhe suas atividades e gerencie seus itens
          </p>
        </div>
        {isCliente && (
          <Link to="/itens" className="btn-primary">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Novo Item
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          title="Total de Itens"
          value={stats.totalItens}
          icon={<BoxIcon className="w-6 h-6" />}
          color="nexus"
          trend={isAdmin ? '+12%' : null}
        />
        <StatCard
          title="Meus Itens"
          value={stats.meusItens}
          icon={<UserIcon className="w-6 h-6" />}
          color="green"
          trend="+5%"
        />
        {isAdmin && (
          <StatCard
            title="Total de Usuários"
            value={stats.totalUsuarios}
            icon={<UsersIcon className="w-6 h-6" />}
            color="purple"
            trend="+3%"
          />
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RecentItems />
        </div>
        
        <div className="space-y-4">
          <div className="card p-6">
            <h2
              className="text-sm font-semibold mb-4 flex items-center gap-2"
              style={{
                color: 'var(--text-primary)',
                fontFamily: 'var(--font-display)',
                letterSpacing: '-0.01em',
              }}
            >
              <ZapIcon className="w-4 h-4" style={{ color: 'var(--accent-gold)' }} />
              Ações Rápidas
            </h2>
            <div className="space-y-2">
              {isCliente && (
                <Link
                  to="/itens"
                  className="block p-3.5 rounded-xl border transition-all group"
                  style={{ background: 'var(--bg-tertiary)', borderColor: 'var(--border-color)' }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(212,175,55,0.3)'; e.currentTarget.style.background = 'var(--bg-hover)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.background = 'var(--bg-tertiary)'; }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(212,175,55,0.1)', color: 'var(--accent-gold)' }}>
                      <PlusIcon className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Solicitar novo item</p>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Crie uma nova requisição</p>
                    </div>
                  </div>
                </Link>
              )}
              {isFuncionario && (
                <Link
                  to="/itens"
                  className="block p-3.5 rounded-xl border transition-all group"
                  style={{ background: 'var(--bg-tertiary)', borderColor: 'var(--border-color)' }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(16,185,129,0.3)'; e.currentTarget.style.background = 'var(--bg-hover)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.background = 'var(--bg-tertiary)'; }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981' }}>
                      <EditIcon className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Gerenciar itens</p>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Visualize e atualize itens</p>
                    </div>
                  </div>
                </Link>
              )}
              {isAdmin && (
                <>
                  <Link
                    to="/usuarios"
                    className="block p-3.5 rounded-xl border transition-all group"
                    style={{ background: 'var(--bg-tertiary)', borderColor: 'var(--border-color)' }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(139,92,246,0.3)'; e.currentTarget.style.background = 'var(--bg-hover)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.background = 'var(--bg-tertiary)'; }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(139,92,246,0.1)', color: '#8b5cf6' }}>
                        <UsersIcon className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Gerenciar usuários</p>
                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Adicione, edite ou remova usuários</p>
                      </div>
                    </div>
                  </Link>
                  <Link
                    to="/itens"
                    className="block p-3.5 rounded-xl border transition-all group"
                    style={{ background: 'var(--bg-tertiary)', borderColor: 'var(--border-color)' }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(212,175,55,0.3)'; e.currentTarget.style.background = 'var(--bg-hover)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.background = 'var(--bg-tertiary)'; }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(212,175,55,0.08)', color: 'var(--accent-gold)' }}>
                        <BoxIcon className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Gerenciar todos os itens</p>
                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Controle total do inventário</p>
                      </div>
                    </div>
                  </Link>
                </>
              )}
              <Link
                to="/perfil"
                className="block p-3.5 rounded-xl border transition-all group"
                style={{ background: 'var(--bg-tertiary)', borderColor: 'var(--border-color)' }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--border-color-strong)'; e.currentTarget.style.background = 'var(--bg-hover)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.background = 'var(--bg-tertiary)'; }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'var(--bg-elevated-2)', color: 'var(--text-secondary)' }}>
                    <UserCircleIcon className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Meu perfil</p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Atualize suas informações</p>
                  </div>
                </div>
              </Link>
            </div>
          </div>

          <div className="card p-6">
            <h2
              className="text-sm font-semibold mb-4 flex items-center gap-2"
              style={{
                color: 'var(--text-primary)',
                fontFamily: 'var(--font-display)',
                letterSpacing: '-0.01em',
              }}
            >
              <InfoIcon className="w-4 h-4" style={{ color: 'var(--accent-gold)' }} />
              Nível de Acesso
            </h2>
            <div
              className="flex items-center gap-3 p-3.5 rounded-xl"
              style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)' }}
            >
              <div
                className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${getRoleColor(user?.nivel_acesso)}`}
              >
                <RoleIcon role={user?.nivel_acesso} className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-semibold capitalize" style={{ color: 'var(--text-primary)' }}>
                  {getRoleLabel(user?.nivel_acesso)}
                </p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  {getRoleDescription(user?.nivel_acesso)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function getRoleColor(role) {
  switch (role) {
    case 'admin': return 'bg-red-600/20';
    case 'funcionario': return 'bg-green-600/20';
    default: return 'bg-nexus-600/20';
  }
}

function getRoleLabel(role) {
  switch (role) {
    case 'admin': return 'Administrador';
    case 'funcionario': return 'Funcionário';
    default: return 'Cliente';
  }
}

function getRoleDescription(role) {
  switch (role) {
    case 'admin': return 'Acesso total ao sistema';
    case 'funcionario': return 'Gerencia itens do sistema';
    default: return 'Pode solicitar itens';
  }
}

function BoxIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
    </svg>
  );
}

function UserIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
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

function ZapIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  );
}

function PlusIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
  );
}

function EditIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  );
}

function UserCircleIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  );
}

function InfoIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function RoleIcon({ role, className }) {
  if (role === 'admin') {
    return (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    );
  }
  if (role === 'funcionario') {
    return (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    );
  }
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  );
}