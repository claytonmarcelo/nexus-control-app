import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import { itemService, userService, alertService } from '../../services/services';
import { checkoutService } from '../../services/services';
import { useModal } from '../../contexts/ModalContext';
import StatCard from '../ui/StatCard';
import RecentItems from '../dashboard/RecentItems';
import OrdersSummaryWidget from '../dashboard/OrdersSummaryWidget';
import LoadingScreen from '../ui/LoadingScreen';

/* ─────────────────────────────── HELPERS ──────────────────────────────── */
function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Bom dia';
  if (h < 18) return 'Boa tarde';
  return 'Boa noite';
}

const ROLE_META = {
  admin: {
    label: 'Administrador',
    tagColor: '#ef4444',
    tagBg: 'rgba(239,68,68,0.1)',
    tagBorder: 'rgba(239,68,68,0.25)',
    subtitle: 'Centro de controle do Nexus — visão global do sistema.',
  },
  funcionario: {
    label: 'Funcionário',
    tagColor: '#10b981',
    tagBg: 'rgba(16,185,129,0.1)',
    tagBorder: 'rgba(16,185,129,0.25)',
    subtitle: 'Ambiente operacional — acompanhe o catálogo e as operações.',
  },
  cliente: {
    label: 'Cliente',
    tagColor: '#d4af37',
    tagBg: 'rgba(212,175,55,0.1)',
    tagBorder: 'rgba(212,175,55,0.25)',
    subtitle: 'Seu portal pessoal — explore, adquira e acompanhe seus pedidos.',
  },
};

const formatCurrency = (v) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(v) || 0);

/* ─────────────────────────────── QUICK ACTION LINK ────────────────────── */
function QuickActionLink({ to, icon, label, description, accentColor, accentBg, accentBorder }) {
  const borderDefault = 'var(--border-color)';
  return (
    <Link
      to={to}
      className="block p-3.5 rounded-xl border transition-all duration-200 group"
      style={{ background: 'var(--bg-tertiary)', borderColor: borderDefault }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = accentBorder || borderDefault;
        e.currentTarget.style.background = 'var(--bg-hover)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = borderDefault;
        e.currentTarget.style.background = 'var(--bg-tertiary)';
      }}
    >
      <div className="flex items-center gap-3">
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: accentBg, color: accentColor, border: `1px solid ${accentBorder}` }}
        >
          {icon}
        </div>
        <div>
          <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{label}</p>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{description}</p>
        </div>
      </div>
    </Link>
  );
}

/* ─────────────────────────────── ROLE BADGE ───────────────────────────── */
function RoleBadge({ role }) {
  const meta = ROLE_META[role] || ROLE_META.cliente;
  return (
    <span
      className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full tracking-wider uppercase"
      style={{ color: meta.tagColor, backgroundColor: meta.tagBg, border: `1px solid ${meta.tagBorder}` }}
    >
      <RoleIcon role={role} className="w-3 h-3" />
      {meta.label}
    </span>
  );
}

/* ─────────────────────────────── CART MINI WIDGET ─────────────────────── */
function CartMiniWidget() {
  const { totalItems, subtotal, items } = useCart();

  if (totalItems === 0) {
    return (
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-3">
          <CartIcon className="w-4 h-4" style={{ color: 'var(--accent-gold)' }} />
          <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>
            Meu Carrinho
          </h2>
        </div>
        <div className="flex flex-col items-center py-4 gap-2 text-center">
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Carrinho vazio</p>
          <Link
            to="/itens"
            className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-all"
            style={{ color: 'var(--accent-gold)', backgroundColor: 'var(--accent-gold-faint)', border: '1px solid var(--accent-gold-border)' }}
          >
            Explorar catálogo
          </Link>
        </div>
      </div>
    );
  }

  const compras = items.filter((i) => i.tipo !== 'aluguel').length;
  const alugueis = items.filter((i) => i.tipo === 'aluguel').length;

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <CartIcon className="w-4 h-4" style={{ color: 'var(--accent-gold)' }} />
          <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>
            Meu Carrinho
          </h2>
        </div>
        <Link to="/carrinho" className="text-xs font-semibold hover:underline" style={{ color: 'var(--accent-gold)' }}>
          Ver →
        </Link>
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
            {totalItems} {totalItems === 1 ? 'item' : 'itens'}
            {compras > 0 && alugueis > 0 && ` · ${compras} compra${compras > 1 ? 's' : ''} · ${alugueis} aluguel`}
          </span>
        </div>
        <div className="flex items-center justify-between border-t pt-2" style={{ borderColor: 'var(--divider)' }}>
          <span className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>Subtotal</span>
          <span className="text-sm font-bold" style={{ color: 'var(--accent-gold)' }}>{formatCurrency(subtotal)}</span>
        </div>
        <Link
          to="/carrinho"
          className="block w-full text-center text-xs font-bold py-2 rounded-lg transition-all mt-1"
          style={{ backgroundColor: 'var(--accent-gold)', color: '#0d0d0d' }}
          onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.9'; }}
          onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
        >
          Finalizar compra
        </Link>
      </div>
    </div>
  );
}

/* ─────────────────────────────── PERMISSIONS PANEL (Funcionário) ──────── */
function PermissionsPanel({ permissions }) {
  if (!permissions || typeof permissions !== 'object') return null;
  const allowed = Object.entries(permissions)
    .filter(([, v]) => v !== false)
    .map(([k]) => k);
  if (allowed.length === 0) return null;

  const LABELS = {
    dashboard: 'Dashboard',
    itens: 'Catálogo',
    carrinho: 'Carrinho',
    checkout: 'Checkout',
    perfil: 'Perfil',
    usuarios: 'Usuários',
    admin: 'Administração',
    pedidos: 'Pedidos',
  };

  return (
    <div className="card p-5">
      <div className="flex items-center gap-2 mb-3">
        <KeyIcon className="w-4 h-4" style={{ color: 'var(--accent-gold)' }} />
        <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>
          Funções Disponíveis
        </h2>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {allowed.map((key) => (
          <span
            key={key}
            className="text-[10px] font-semibold px-2 py-1 rounded-lg"
            style={{
              backgroundColor: 'var(--bg-tertiary)',
              color: 'var(--text-secondary)',
              border: '1px solid var(--border-color)',
            }}
          >
            {LABELS[key] || key}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────────── MAIN DASHBOARD ───────────────────────── */
export default function Dashboard() {
  const { user, isAdmin, isFuncionario, isCliente } = useAuth();
  const { totalItems: cartCount } = useCart();
  const { toast } = useModal();

  const [stats, setStats] = useState({
    totalItens: 0,
    meusItens: 0,
    totalUsuarios: 0,
    totalPedidos: 0,
    pedidosPendentes: 0,
    pedidosConcluidos: 0,
    valorTotalPedidos: 0,
  });
  const [loading, setLoading] = useState(true);
  const [alertsData, setAlertsData] = useState(null);

  const role = user?.nivel_acesso || 'cliente';
  const roleMeta = ROLE_META[role] || ROLE_META.cliente;

  useEffect(() => {
    if (!user || !(isCliente || isFuncionario)) return;
    let cancelled = false;
    alertService.getMyAlerts()
      .then((data) => { if (!cancelled) setAlertsData(data || null); })
      .catch(() => { /* silencioso: o banner simplesmente não aparece */ });
    return () => { cancelled = true; };
  }, [user, isCliente, isFuncionario]);

  const loadData = useCallback(async () => {
    if (!user) return;
    try {
      const promises = [itemService.getAll({ limit: 200 })];

      if (isAdmin) {
        promises.push(userService.getAll({ limit: 200 }));
        promises.push(checkoutService.getAllOrders({ limit: 100 }));
      }

      if (isCliente || isFuncionario) {
        promises.push(checkoutService.getMyOrders({ limit: 50 }));
      }

      const results = await Promise.allSettled(promises);

      const itemsRes = results[0].status === 'fulfilled' ? results[0].value : null;
      const allItems = Array.isArray(itemsRes?.data?.items)
        ? itemsRes.data.items
        : Array.isArray(itemsRes?.data)
        ? itemsRes.data
        : Array.isArray(itemsRes?.items)
        ? itemsRes.items
        : [];

      const meusItens = allItems.filter((item) => item.criado_por === user?.id).length;

      let totalUsuarios = 0;
      let totalPedidos = 0;
      let pedidosPendentes = 0;
      let pedidosConcluidos = 0;
      let valorTotalPedidos = 0;

      if (isAdmin) {
        const usersRes = results[1]?.status === 'fulfilled' ? results[1].value : null;
        totalUsuarios = Array.isArray(usersRes?.users)
          ? usersRes.users.length
          : Array.isArray(usersRes)
          ? usersRes.length
          : usersRes?.total || 0;

        const ordersRes = results[2]?.status === 'fulfilled' ? results[2].value : null;
        const ordersList = Array.isArray(ordersRes?.orders)
          ? ordersRes.orders
          : Array.isArray(ordersRes)
          ? ordersRes
          : [];

        totalPedidos = ordersList.length;
        pedidosPendentes = ordersList.filter(
          (o) => ['pendente', 'processando'].includes((o.status_pagamento || '').toLowerCase())
        ).length;
        pedidosConcluidos = ordersList.filter(
          (o) => ['pago', 'aprovado', 'concluido'].includes((o.status_pagamento || '').toLowerCase())
        ).length;
        valorTotalPedidos = ordersList.reduce((s, o) => s + (Number(o.total || o.valor_total) || 0), 0);
      }

      if (isCliente || isFuncionario) {
        const myOrdersIdx = isAdmin ? 3 : 1;
        const myOrdersRes = results[myOrdersIdx]?.status === 'fulfilled' ? results[myOrdersIdx].value : null;
        const myOrders = Array.isArray(myOrdersRes?.orders)
          ? myOrdersRes.orders
          : Array.isArray(myOrdersRes)
          ? myOrdersRes
          : [];

        totalPedidos = myOrders.length;
        pedidosPendentes = myOrders.filter(
          (o) => ['pendente', 'processando'].includes((o.status_pagamento || '').toLowerCase())
        ).length;
        pedidosConcluidos = myOrders.filter(
          (o) => ['pago', 'aprovado', 'concluido'].includes((o.status_pagamento || '').toLowerCase())
        ).length;
        valorTotalPedidos = myOrders.reduce((s, o) => s + (Number(o.total || o.valor_total) || 0), 0);
      }

      setStats({ totalItens: allItems.length, meusItens, totalUsuarios, totalPedidos, pedidosPendentes, pedidosConcluidos, valorTotalPedidos });
    } catch (error) {
      console.error('[Dashboard] Erro ao carregar dados:', error);
      toast({ message: 'Erro ao carregar dados do dashboard', variant: 'danger' });
    } finally {
      setLoading(false);
    }
  }, [user, isAdmin, isCliente, isFuncionario, toast]);

  useEffect(() => {
    if (user) loadData();
  }, [user, loadData]);

  if (loading) return <LoadingScreen />;

  /* ── CLIENTE ── */
  if (isCliente) {
    return (
      <div className="space-y-6 animate-fade-in">
        {/* Cabeçalho contextual */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <p className="text-xs font-semibold tracking-widest uppercase" style={{ color: 'var(--accent-gold)', letterSpacing: '0.12em' }}>
                {getGreeting()}
              </p>
              <RoleBadge role={role} />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold leading-tight"
              style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-display)', letterSpacing: '-0.02em' }}>
              {user?.nome}
            </h1>
            <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
              {roleMeta.subtitle}
            </p>
          </div>
          <Link to="/itens" className="btn-primary self-start sm:self-auto flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            Explorar Catálogo
          </Link>
        </div>

        <AlertsBanner data={alertsData} onDismiss={() => setAlertsData(null)} />

        {/* Métricas reais do cliente */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Itens no Catálogo"
            value={stats.totalItens}
            icon={<BoxIcon className="w-5 h-5" />}
            color="nexus"
          />
          <StatCard
            title="Meus Pedidos"
            value={stats.totalPedidos}
            icon={<ShoppingBagIcon className="w-5 h-5" />}
            color="green"
          />
          <StatCard
            title="Pendentes"
            value={stats.pedidosPendentes}
            icon={<ClockIcon className="w-5 h-5" />}
            color="yellow"
          />
          <StatCard
            title="No Carrinho"
            value={cartCount}
            icon={<CartIcon className="w-5 h-5" />}
            color="purple"
          />
        </div>

        {/* Conteúdo principal */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Coluna principal: pedidos + catálogo recente */}
          <div className="lg:col-span-2 space-y-6">
            <OrdersSummaryWidget maxItems={4} />
            <RecentItems />
          </div>

          {/* Sidebar: carrinho + ações rápidas */}
          <div className="space-y-4">
            <CartMiniWidget />

            <div className="card p-5">
              <div className="flex items-center gap-2 mb-3">
                <ZapIcon className="w-4 h-4" style={{ color: 'var(--accent-gold)' }} />
                <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>
                  Ações Rápidas
                </h2>
              </div>
              <div className="space-y-2">
                <QuickActionLink
                  to="/itens"
                  icon={<BoxIcon className="w-4 h-4" />}
                  label="Explorar catálogo"
                  description="Produtos e serviços disponíveis"
                  accentColor="var(--accent-gold)"
                  accentBg="rgba(212,175,55,0.1)"
                  accentBorder="rgba(212,175,55,0.3)"
                />
                <QuickActionLink
                  to="/carrinho"
                  icon={<CartIcon className="w-4 h-4" />}
                  label="Ver carrinho"
                  description={cartCount > 0 ? `${cartCount} ${cartCount === 1 ? 'item' : 'itens'} adicionado${cartCount > 1 ? 's' : ''}` : 'Carrinho vazio'}
                  accentColor="#8b5cf6"
                  accentBg="rgba(139,92,246,0.1)"
                  accentBorder="rgba(139,92,246,0.3)"
                />
                <QuickActionLink
                  to="/perfil"
                  icon={<UserCircleIcon className="w-4 h-4" />}
                  label="Meu perfil"
                  description="Dados pessoais e segurança"
                  accentColor="var(--text-secondary)"
                  accentBg="var(--bg-elevated-2)"
                  accentBorder="var(--border-color)"
                />
              </div>
            </div>

            {/* Nível de acesso */}
            <AccessLevelCard role={role} />
          </div>
        </div>
      </div>
    );
  }

  /* ── FUNCIONÁRIO ── */
  if (isFuncionario) {
    return (
      <div className="space-y-6 animate-fade-in">
        {/* Cabeçalho operacional */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <p className="text-xs font-semibold tracking-widest uppercase" style={{ color: '#10b981', letterSpacing: '0.12em' }}>
                {getGreeting()}
              </p>
              <RoleBadge role={role} />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold leading-tight"
              style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-display)', letterSpacing: '-0.02em' }}>
              {user?.nome}
            </h1>
            <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
              {roleMeta.subtitle}
            </p>
          </div>
          <Link to="/itens" className="btn-primary self-start sm:self-auto flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            Acessar Catálogo
          </Link>
        </div>

        <AlertsBanner data={alertsData} onDismiss={() => setAlertsData(null)} />

        {/* Métricas operacionais */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total no Catálogo"
            value={stats.totalItens}
            icon={<BoxIcon className="w-5 h-5" />}
            color="nexus"
          />
          <StatCard
            title="Meus Itens"
            value={stats.meusItens}
            icon={<UserIcon className="w-5 h-5" />}
            color="green"
          />
          <StatCard
            title="Meus Pedidos"
            value={stats.totalPedidos}
            icon={<ShoppingBagIcon className="w-5 h-5" />}
            color="purple"
          />
          <StatCard
            title="Em Andamento"
            value={stats.pedidosPendentes}
            icon={<ClockIcon className="w-5 h-5" />}
            color="yellow"
          />
        </div>

        {/* Conteúdo */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <OrdersSummaryWidget maxItems={4} />
            <RecentItems />
          </div>

          <div className="space-y-4">
            <div className="card p-5">
              <div className="flex items-center gap-2 mb-3">
                <ZapIcon className="w-4 h-4" style={{ color: '#10b981' }} />
                <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>
                  Ações Rápidas
                </h2>
              </div>
              <div className="space-y-2">
                <QuickActionLink
                  to="/itens"
                  icon={<BoxIcon className="w-4 h-4" />}
                  label="Gerenciar itens"
                  description="Visualize e atualize o catálogo"
                  accentColor="#10b981"
                  accentBg="rgba(16,185,129,0.1)"
                  accentBorder="rgba(16,185,129,0.3)"
                />
                <QuickActionLink
                  to="/perfil"
                  icon={<UserCircleIcon className="w-4 h-4" />}
                  label="Meu perfil"
                  description="Dados e configurações pessoais"
                  accentColor="var(--text-secondary)"
                  accentBg="var(--bg-elevated-2)"
                  accentBorder="var(--border-color)"
                />
              </div>
            </div>

            <PermissionsPanel permissions={user?.permissions} />
            <AccessLevelCard role={role} />
          </div>
        </div>
      </div>
    );
  }

  /* ── ADMINISTRADOR ── */
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Cabeçalho administrativo */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <p className="text-xs font-semibold tracking-widest uppercase" style={{ color: 'var(--accent-gold)', letterSpacing: '0.12em' }}>
              {getGreeting()}
            </p>
            <RoleBadge role={role} />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold leading-tight"
            style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-display)', letterSpacing: '-0.02em' }}>
            {user?.nome}
          </h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
            {roleMeta.subtitle}
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          <Link to="/usuarios" className="btn-primary flex items-center gap-2">
            <UsersIcon className="w-4 h-4" />
            Usuários
          </Link>
          <Link
            to="/admin"
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border transition-all"
            style={{ borderColor: 'rgba(239,68,68,0.3)', color: '#ef4444', backgroundColor: 'rgba(239,68,68,0.08)' }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(239,68,68,0.15)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'rgba(239,68,68,0.08)'; }}
          >
            <ShieldIcon className="w-4 h-4" />
            Painel Admin
          </Link>
        </div>
      </div>

      {/* Métricas globais */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total de Itens"
          value={stats.totalItens}
          icon={<BoxIcon className="w-5 h-5" />}
          color="nexus"
        />
        <StatCard
          title="Usuários"
          value={stats.totalUsuarios}
          icon={<UsersIcon className="w-5 h-5" />}
          color="purple"
        />
        <StatCard
          title="Total de Pedidos"
          value={stats.totalPedidos}
          icon={<ShoppingBagIcon className="w-5 h-5" />}
          color="green"
        />
        <StatCard
          title="Pendentes"
          value={stats.pedidosPendentes}
          icon={<ClockIcon className="w-5 h-5" />}
          color="yellow"
        />
      </div>

      {/* Se houver receita total registrada, exibir */}
      {stats.valorTotalPedidos > 0 && (
        <div
          className="rounded-xl border p-4 flex items-center gap-4"
          style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'rgba(212,175,55,0.2)' }}
        >
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: 'rgba(212,175,55,0.1)', color: 'var(--accent-gold)', border: '1px solid rgba(212,175,55,0.25)' }}>
            <TrendingUpIcon className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-semibold tracking-widest uppercase" style={{ color: 'var(--text-muted)' }}>
              Volume Total de Pedidos
            </p>
            <p className="text-xl font-bold" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>
              {formatCurrency(stats.valorTotalPedidos)}
            </p>
          </div>
          <div className="ml-auto text-right hidden sm:block">
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              {stats.pedidosConcluidos} concluído{stats.pedidosConcluidos !== 1 ? 's' : ''}
            </p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              {stats.pedidosPendentes} pendente{stats.pedidosPendentes !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      )}

      {/* Conteúdo principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <OrdersSummaryWidget maxItems={5} />
          <RecentItems />
        </div>

        <div className="space-y-4">
          <div className="card p-5">
            <div className="flex items-center gap-2 mb-3">
              <ZapIcon className="w-4 h-4" style={{ color: '#ef4444' }} />
              <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>
                Controles Administrativos
              </h2>
            </div>
            <div className="space-y-2">
              <QuickActionLink
                to="/usuarios"
                icon={<UsersIcon className="w-4 h-4" />}
                label="Gerenciar usuários"
                description="Adicione, edite ou configure perfis"
                accentColor="#8b5cf6"
                accentBg="rgba(139,92,246,0.1)"
                accentBorder="rgba(139,92,246,0.3)"
              />
              <QuickActionLink
                to="/itens"
                icon={<BoxIcon className="w-4 h-4" />}
                label="Gerenciar itens"
                description="Controle total do catálogo"
                accentColor="var(--accent-gold)"
                accentBg="rgba(212,175,55,0.08)"
                accentBorder="rgba(212,175,55,0.3)"
              />
              <QuickActionLink
                to="/admin"
                icon={<ShieldIcon className="w-4 h-4" />}
                label="Painel de controle"
                description="Permissões, pedidos e configurações"
                accentColor="#ef4444"
                accentBg="rgba(239,68,68,0.08)"
                accentBorder="rgba(239,68,68,0.25)"
              />
              <QuickActionLink
                to="/perfil"
                icon={<UserCircleIcon className="w-4 h-4" />}
                label="Meu perfil"
                description="Dados e configurações da conta"
                accentColor="var(--text-secondary)"
                accentBg="var(--bg-elevated-2)"
                accentBorder="var(--border-color)"
              />
            </div>
          </div>

          <AccessLevelCard role={role} />
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────── ACCESS LEVEL CARD ────────────────────── */
function AccessLevelCard({ role }) {
  const DESCS = {
    admin: 'Acesso total ao sistema Nexus.',
    funcionario: 'Acesso operacional ao catálogo.',
    cliente: 'Acesso ao portal de compras e aluguéis.',
  };
  const meta = ROLE_META[role] || ROLE_META.cliente;
  return (
    <div className="card p-5">
      <div className="flex items-center gap-2 mb-3">
        <InfoIcon className="w-4 h-4" style={{ color: 'var(--accent-gold)' }} />
        <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>
          Nível de Acesso
        </h2>
      </div>
      <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)' }}>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: meta.tagBg, color: meta.tagColor, border: `1px solid ${meta.tagBorder}` }}>
          <RoleIcon role={role} className="w-5 h-5" />
        </div>
        <div>
          <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{meta.label}</p>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{DESCS[role] || ''}</p>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────── ICONS ────────────────────────────────── */
function BoxIcon({ className, style }) {
  return (
    <svg className={className} style={style} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
    </svg>
  );
}
function UserIcon({ className, style }) {
  return (
    <svg className={className} style={style} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  );
}
function UsersIcon({ className, style }) {
  return (
    <svg className={className} style={style} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  );
}
function ZapIcon({ className, style }) {
  return (
    <svg className={className} style={style} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  );
}
function UserCircleIcon({ className, style }) {
  return (
    <svg className={className} style={style} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  );
}
function InfoIcon({ className, style }) {
  return (
    <svg className={className} style={style} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}
function ShieldIcon({ className, style }) {
  return (
    <svg className={className} style={style} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3 5 6v5c0 4.55 2.9 8.68 7 10 4.1-1.32 7-5.45 7-10V6l-7-3Z" />
    </svg>
  );
}
function ShoppingBagIcon({ className, style }) {
  return (
    <svg className={className} style={style} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
    </svg>
  );
}
function CartIcon({ className, style }) {
  return (
    <svg className={className} style={style} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-1.2 2.4A1 1 0 0 0 6.7 17H17m0 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4Zm-10 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4Z" />
    </svg>
  );
}
function ClockIcon({ className, style }) {
  return (
    <svg className={className} style={style} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}
function TrendingUpIcon({ className, style }) {
  return (
    <svg className={className} style={style} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </svg>
  );
}
function KeyIcon({ className, style }) {
  return (
    <svg className={className} style={style} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
    </svg>
  );
}
function RoleIcon({ role, className, style }) {
  if (role === 'admin') {
    return (
      <svg className={className} style={style} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    );
  }
  if (role === 'funcionario') {
    return (
      <svg className={className} style={style} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    );
  }
  return (
    <svg className={className} style={style} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  );
}

function AlertsBanner({ data, onDismiss }) {
  const alerts = data?.alerts ?? [];
  const resumo = data?.resumo ?? {};
  if (alerts.length === 0) return null;

  const urgente = alerts.find((a) => a.severidade === 'urgente');
  const atencao = alerts.find((a) => a.severidade === 'atencao');
  const principal = urgente || atencao || alerts[0];

  const accentColor = urgente ? '#ef4444' : atencao ? '#f59e0b' : '#d4af37';
  const accentBg = urgente ? 'rgba(239,68,68,0.08)' : atencao ? 'rgba(245,158,11,0.08)' : 'rgba(212,175,55,0.08)';
  const accentBorder = urgente ? 'rgba(239,68,68,0.35)' : atencao ? 'rgba(245,158,11,0.35)' : 'rgba(212,175,55,0.35)';

  return (
    <div
      className="relative flex flex-col gap-3 rounded-2xl border p-4 sm:flex-row sm:items-center sm:justify-between"
      style={{ borderColor: accentBorder, backgroundColor: accentBg }}
      role="region"
      aria-label="Alertas recentes da sua conta"
    >
      <div className="flex items-start gap-3 min-w-0">
        <span
          className="mt-1 h-2 w-2 shrink-0 rounded-full"
          style={{ backgroundColor: accentColor, boxShadow: `0 0 12px ${accentColor}` }}
          aria-hidden="true"
        />
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: accentColor }}>
            {urgente ? 'Requer atenção imediata' : atencao ? 'Vale a pena revisar' : 'Aviso'} · {alerts.length} {alerts.length === 1 ? 'item' : 'itens'}
            {resumo.possui_debitos ? ` · ${formatCurrency(resumo.total_debitos)} em aberto` : ''}
          </p>
          <p className="mt-1 text-sm leading-relaxed" style={{ color: 'var(--text-primary)' }}>
            {principal.mensagem}
          </p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <Link to="/perfil" className="btn-secondary text-xs gap-2 px-3 py-2">
          Ver centro de alertas
        </Link>
        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            aria-label="Dispensar este aviso"
            className="rounded-full p-2 text-text-secondary hover:text-white hover:bg-dark-hover transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}