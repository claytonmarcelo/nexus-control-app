import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useModal } from '../../contexts/ModalContext';
import { itemService, userService, rentalService, alertService } from '../../services/services';
import { adminService } from '../../services/adminService';
import { isRootAdmin } from '../../utils/access';
import ItemFormModal from '../dashboard/ItemFormModal';

const ROLE_META = {
  cliente: {
    label: 'Cliente',
    description: 'Experiência de compra e acompanhamento de pedidos',
    className: 'border-sky-400/30 bg-sky-400/10 text-sky-700 dark:text-sky-200',
  },
  funcionario: {
    label: 'Funcionário',
    description: 'Operação do catálogo e atendimento',
    className: 'border-emerald-400/30 bg-emerald-400/10 text-emerald-700 dark:text-emerald-200',
  },
  admin: {
    label: 'Administrador',
    description: 'Visão global e gestão completa do Nexus',
    className: 'border-nexus-400/40 bg-nexus-500/15 text-nexus-800 dark:text-nexus-200',
  },
};

const FALLBACK_PAGES = [
  { key: 'dashboard', label: 'Dashboard', path: '/dashboard', roles: ['cliente', 'funcionario', 'admin'] },
  { key: 'itens', label: 'Catálogo', path: '/itens', roles: ['cliente', 'funcionario', 'admin'] },
  { key: 'carrinho', label: 'Carrinho', path: '/carrinho', roles: ['cliente', 'funcionario', 'admin'] },
  { key: 'checkout', label: 'Checkout', path: '/checkout', roles: ['cliente', 'funcionario', 'admin'] },
  { key: 'pedidos', label: 'Meus pedidos', path: '/pedidos', roles: ['cliente', 'funcionario', 'admin'] },
  { key: 'usuarios', label: 'Usuários', path: '/usuarios', roles: ['admin'] },
  { key: 'admin', label: 'Admin Control Center', path: '/admin', roles: ['admin'] },
  { key: 'perfil', label: 'Perfil', path: '/perfil', roles: ['cliente', 'funcionario', 'admin'] },
];

const PAYMENT_STATUS_OPTIONS = [
  { value: 'pendente', label: 'Pendente' },
  { value: 'processando', label: 'Processando' },
  { value: 'confirmado', label: 'Confirmado' },
  { value: 'recusado', label: 'Recusado' },
  { value: 'estornado', label: 'Estornado' },
];

const ORDER_STATUS_OPTIONS = [
  { value: 'novo', label: 'Novo' },
  { value: 'processando', label: 'Em processamento' },
  { value: 'concluido', label: 'Concluído' },
  { value: 'cancelado', label: 'Cancelado' },
];

const STATUS_CONTA_OPTIONS = [
  { value: '', label: 'Todas' },
  { value: 'ativo', label: 'Ativas' },
  { value: 'aviso_inatividade', label: 'Aviso de inatividade' },
  { value: 'bloqueado_inatividade', label: 'Bloqueadas (inatividade)' },
  { value: 'desativada', label: 'Desativadas' },
];

const ALUGUEL_STATUS_OPTIONS = [
  { value: '', label: 'Todos os status' },
  { value: 'aguardando_pagamento', label: 'Aguardando pagamento' },
  { value: 'ativo', label: 'Ativos' },
  { value: 'vencido', label: 'Vencidos' },
  { value: 'regularizado', label: 'Regularizados (aguardando devolução)' },
  { value: 'devolvido', label: 'Devolvidos' },
  { value: 'cancelado', label: 'Cancelados' },
];

const RETIRADA_STATUS = [
  { value: 'pendente', label: 'Pendente' },
  { value: 'agendada', label: 'Agendada' },
  { value: 'realizada', label: 'Realizada (entregue/devolvida)' },
];

const TABS = [
  { key: 'visao-geral', label: 'Visão geral', icon: 'chart' },
  { key: 'acessos', label: 'Acessos', icon: 'shield' },
  { key: 'produtos', label: 'Produtos', icon: 'box' },
  { key: 'pedidos', label: 'Pedidos', icon: 'receipt' },
  { key: 'alugueis', label: 'Aluguéis', icon: 'clock' },
];

export default function AdminControlCenter() {
  const { isAdmin } = useAuth();
  const { toast, confirm } = useModal();
  const [activeTab, setActiveTab] = useState('visao-geral');
  const [previewRole, setPreviewRole] = useState('cliente');
  const [pages, setPages] = useState(FALLBACK_PAGES);
  const [roleViews, setRoleViews] = useState([]);
  const [users, setUsers] = useState([]);
  const [items, setItems] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [permissionDraft, setPermissionDraft] = useState({
    role: 'cliente',
    active: true,
    permissions: {},
  });
  const [loadingPermissions, setLoadingPermissions] = useState(false);
  const [savingPermissions, setSavingPermissions] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [savingProduct, setSavingProduct] = useState(false);
  const [deletingProductId, setDeletingProductId] = useState(null);
  const [orderDrafts, setOrderDrafts] = useState({});
  const [savingOrderId, setSavingOrderId] = useState(null);
  const [expandedOrderId, setExpandedOrderId] = useState(null);
  const [batchSaving, setBatchSaving] = useState(null); // { pageKey, role } | null
  const [globalPermissionOverrides, setGlobalPermissionOverrides] = useState({});

  const [rentals, setRentals] = useState([]);
  const [rentalStatusFilter, setRentalStatusFilter] = useState('');
  const [rentalsLoading, setRentalsLoading] = useState(false);
  const [updatingRetiradaId, setUpdatingRetiradaId] = useState(null);

  const [userStatusFilter, setUserStatusFilter] = useState('');

  const [userEvents, setUserEvents] = useState([]);
  const [userEventsLoading, setUserEventsLoading] = useState(false);

  const loadControlData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);

    const results = await Promise.allSettled([
      adminService.getPages(),
      userService.getAll({ limit: 100 }),
      itemService.getAll({ limit: 100 }),
      adminService.getOrders({ limit: 100 }),
    ]);

    const [pagesResult, usersResult, itemsResult, ordersResult] = results;
    const failedSources = [];

    if (pagesResult.status === 'fulfilled') {
      setPages(normalizePages(pagesResult.value));
      setRoleViews(asArray(pagesResult.value?.roleViews));
    } else {
      failedSources.push('mapa de páginas');
    }

    if (usersResult.status === 'fulfilled') {
      setUsers(extractCollection(usersResult.value, 'users'));
    } else {
      failedSources.push('usuários');
    }

    if (itemsResult.status === 'fulfilled') {
      setItems(extractCollection(itemsResult.value, 'items'));
    } else {
      failedSources.push('produtos');
    }

    if (ordersResult.status === 'fulfilled') {
      setOrders(extractCollection(ordersResult.value, 'orders'));
    } else {
      failedSources.push('pedidos');
    }

    if (failedSources.length > 0) {
      toast({
        message: `Não foi possível atualizar: ${failedSources.join(', ')}.`,
        variant: 'warning',
      });
    }

    setLoading(false);
  }, [toast]);

  useEffect(() => {
    if (isAdmin) loadControlData();
  }, [isAdmin, loadControlData]);

  useEffect(() => {
    if (!selectedUserId && users.length > 0) {
      setSelectedUserId(users[0].id);
    }
  }, [selectedUserId, users]);

  const selectedUser = useMemo(
    () => users.find((targetUser) => String(targetUser.id) === String(selectedUserId)) || null,
    [selectedUserId, users],
  );

  useEffect(() => {
    if (!isAdmin) return undefined;
    let cancelled = false;
    userService.getAll({
      limit: 100,
      status_conta: userStatusFilter || undefined,
    })
      .then((res) => { if (!cancelled) setUsers(extractCollection(res, 'users')); })
      .catch(() => { /* silencioso: o estado anterior permanece */ });
    return () => { cancelled = true; };
  }, [isAdmin, userStatusFilter]);

  useEffect(() => {
    if (!isAdmin || activeTab !== 'alugueis') return undefined;
    let cancelled = false;
    setRentalsLoading(true);
    rentalService.getForOperation({ status: rentalStatusFilter || undefined })
      .then((data) => { if (!cancelled) setRentals(Array.isArray(data?.alugueis) ? data.alugueis : []); })
      .catch(() => { if (!cancelled) setRentals([]); })
      .finally(() => { if (!cancelled) setRentalsLoading(false); });
    return () => { cancelled = true; };
  }, [isAdmin, activeTab, rentalStatusFilter]);

  useEffect(() => {
    if (!isAdmin || !selectedUser?.id) { setUserEvents([]); return undefined; }
    let cancelled = false;
    setUserEventsLoading(true);
    alertService.getUserEvents(selectedUser.id, { limit: 50 })
      .then((data) => { if (!cancelled) setUserEvents(Array.isArray(data?.eventos) ? data.eventos : []); })
      .catch(() => { if (!cancelled) setUserEvents([]); })
      .finally(() => { if (!cancelled) setUserEventsLoading(false); });
    return () => { cancelled = true; };
  }, [isAdmin, selectedUser?.id]);

  useEffect(() => {
    if (!selectedUser) return undefined;

    let isCurrent = true;
    const fallbackPermissions = buildDefaultPermissions(selectedUser.nivel_acesso, pages);
    setPermissionDraft({
      role: selectedUser.nivel_acesso || 'cliente',
      active: isUserActive(selectedUser),
      permissions: { ...fallbackPermissions, ...(selectedUser.permissions || {}) },
    });
    setLoadingPermissions(true);

    adminService.getUserPermissions(selectedUser.id)
      .then((payload) => {
        if (!isCurrent) return;
        const permissions = payload?.permissions || payload?.data?.permissions;
        if (permissions) {
          setPermissionDraft((current) => ({ ...current, permissions: { ...fallbackPermissions, ...permissions } }));
        }
      })
      .catch(() => {
        // The admin route remains useful even if an older API does not expose
        // the legacy per-user endpoint yet; defaults are shown in that case.
      })
      .finally(() => {
        if (isCurrent) setLoadingPermissions(false);
      });

    return () => {
      isCurrent = false;
    };
  }, [selectedUser, pages]);

  const filteredUsers = useMemo(() => {
    const query = userSearch.trim().toLowerCase();
    if (!query) return users;
    return users.filter((targetUser) => (
      targetUser.nome?.toLowerCase().includes(query)
      || targetUser.email?.toLowerCase().includes(query)
    ));
  }, [userSearch, users]);

  const visiblePreviewPages = useMemo(
    () => pages.filter((page) => pageIsVisibleForRole(page, previewRole, roleViews)),
    [pages, previewRole, roleViews],
  );

  const overview = useMemo(() => ({
    activeUsers: users.filter(isUserActive).length,
    pendingOrders: orders.filter((order) => normalizeStatus(order.status_pagamento) === 'pendente').length,
    approvedRevenue: orders
      .filter((order) => ['confirmado', 'aprovado', 'pago'].includes(normalizeStatus(order.status_pagamento)))
      .reduce((total, order) => total + toNumber(order.total ?? order.valor_total ?? order.total_geral), 0),
  }), [orders, users]);

  const handlePermissionSave = async () => {
    if (!selectedUser || isRootAdmin(selectedUser)) return;

    setSavingPermissions(true);
    try {
      const result = await adminService.updatePermissions({
        userId: selectedUser.id,
        nivel_acesso: permissionDraft.role,
        ativo: permissionDraft.active,
        permissions: permissionDraft.permissions,
      });
      const savedUser = result?.user || {};
      const savedPermissions = result?.permissions || permissionDraft.permissions;
      setUsers((current) => current.map((targetUser) => (
        String(targetUser.id) === String(selectedUser.id)
          ? {
            ...targetUser,
            ...savedUser,
            nivel_acesso: savedUser.nivel_acesso || permissionDraft.role,
            ativo: savedUser.ativo ?? savedUser.active ?? permissionDraft.active,
            permissions: savedPermissions,
          }
          : targetUser
      )));
      setPermissionDraft((current) => ({ ...current, permissions: savedPermissions }));
      toast({ message: 'Acessos atualizados com sucesso.', variant: 'success' });
    } catch (error) {
      toast({
        message: error.response?.data?.message || 'Não foi possível atualizar os acessos.',
        variant: 'danger',
      });
    } finally {
      setSavingPermissions(false);
    }
  };

  // Batch update: aplica enable/disable de uma página para TODOS os usuários de um role
  const handleBatchUpdate = useCallback(async (pageKey, role, enable) => {
    const targetUsers = users.filter((u) => (role === 'all' || u.nivel_acesso === role) && !isRootAdmin(u));
    if (targetUsers.length === 0) {
      toast({ message: `Nenhum usuário com perfil ${ROLE_META[role]?.label} encontrado.`, variant: 'info' });
      return;
    }
    setBatchSaving({ pageKey, role, enable });
    try {
      await Promise.all(
        targetUsers.map((u) => {
          const fallback = buildDefaultPermissions(u.nivel_acesso, pages);
          const current = { ...fallback, ...(u.permissions || {}) };
          return adminService.updatePermissions({
            userId: u.id,
            nivel_acesso: u.nivel_acesso,
            ativo: isUserActive(u),
            permissions: { ...current, [pageKey]: enable },
          });
        }),
      );
      setUsers((prev) =>
        prev.map((u) => {
          if ((role !== 'all' && u.nivel_acesso !== role) || isRootAdmin(u)) return u;
          const fallback = buildDefaultPermissions(u.nivel_acesso, pages);
          return { ...u, permissions: { ...fallback, ...(u.permissions || {}), [pageKey]: enable } };
        }),
      );
      if (role === 'all') {
        setGlobalPermissionOverrides((current) => ({ ...current, [pageKey]: enable }));
      }
      const audience = role === 'all' ? 'todos os usuários' : `usuários com perfil ${ROLE_META[role]?.label}`;
      toast({
        message: `Acesso ${enable ? 'liberado' : 'bloqueado'} para ${targetUsers.length} ${audience} na página.`,
        variant: 'success',
      });
    } catch {
      toast({ message: 'Não foi possível atualizar o acesso em lote.', variant: 'danger' });
    } finally {
      setBatchSaving(null);
    }
  }, [users, pages, toast]);

  const handleRoleChange = (role) => {
    setPermissionDraft((current) => ({
      ...current,
      role,
      permissions: {
        ...buildDefaultPermissions(role, pages),
        ...current.permissions,
      },
    }));
  };

  const handleProductSave = async (formData) => {
    const payload = normalizeProductForm(formData);
    setSavingProduct(true);
    try {
      if (editingProduct) {
        const result = await itemService.update(editingProduct.id, payload);
        const item = result?.item || { ...editingProduct, ...payload };
        setItems((current) => current.map((product) => (
          String(product.id) === String(editingProduct.id) ? { ...product, ...item } : product
        )));
        toast({ message: 'Produto atualizado com sucesso.', variant: 'success' });
      } else {
        const result = await itemService.create(payload);
        const item = result?.item || result;
        setItems((current) => [item, ...current]);
        toast({ message: 'Produto criado com sucesso.', variant: 'success' });
      }
      setProductModalOpen(false);
      setEditingProduct(null);
    } finally {
      setSavingProduct(false);
    }
  };

  const handleProductDelete = async (product) => {
    const accepted = await confirm({
      title: 'Excluir produto',
      message: `Deseja remover “${product.nome}” do catálogo? Esta ação não pode ser desfeita.`,
      confirmText: 'Excluir',
      cancelText: 'Cancelar',
      variant: 'danger',
    });
    if (!accepted) return;

    setDeletingProductId(product.id);
    try {
      await itemService.delete(product.id);
      setItems((current) => current.filter((target) => String(target.id) !== String(product.id)));
      toast({ message: 'Produto removido do catálogo.', variant: 'success' });
    } catch (error) {
      toast({
        message: error.response?.data?.message || 'Não foi possível excluir o produto.',
        variant: 'danger',
      });
    } finally {
      setDeletingProductId(null);
    }
  };

  const [seedingCatalog, setSeedingCatalog] = useState(false);

  const handleSeedCatalog = async () => {
    const accepted = await confirm({
      title: 'Popular Catálogo Oficial',
      message: 'Deseja sincronizar e popular o banco de dados com os 35 produtos e serviços do catálogo oficial Nexus Control (servidores, redes, periféricos, armazenamento, energia, áudio, impressoras, telefonia, rack e serviços corporativos)?',
      confirmText: 'Sim, popular catálogo',
      cancelText: 'Cancelar',
      variant: 'info',
    });
    if (!accepted) return;

    setSeedingCatalog(true);
    try {
      await adminService.seedCatalog();
      toast({ message: 'Catálogo oficial semeado com sucesso!', variant: 'success' });
      await loadControlData(true);
    } catch (err) {
      toast({ message: 'Erro ao popular catálogo: ' + (err.response?.data?.message || err.message), variant: 'danger' });
    } finally {
      setSeedingCatalog(false);
    }
  };

  const updateOrderDraft = (order, key, value) => {
    setOrderDrafts((current) => ({
      ...current,
      [order.id]: {
        status_pagamento: order.status_pagamento || 'pendente',
        status_pedido: order.status_pedido || 'novo',
        ...current[order.id],
        [key]: value,
      },
    }));
  };

  const saveOrderStatus = async (order) => {
    const draft = {
      status_pagamento: order.status_pagamento || 'pendente',
      status_pedido: order.status_pedido || 'novo',
      ...orderDrafts[order.id],
    };
    setSavingOrderId(order.id);
    try {
      const result = await adminService.updateOrderStatus(order.id, draft);
      const savedOrder = result?.order || result?.pedido || {};
      setOrders((current) => current.map((targetOrder) => (
        String(targetOrder.id) === String(order.id)
          ? { ...targetOrder, ...savedOrder, ...draft }
          : targetOrder
      )));
      setOrderDrafts((current) => {
        const next = { ...current };
        delete next[order.id];
        return next;
      });
      toast({ message: `Pedido #${order.id} atualizado.`, variant: 'success' });
    } catch (error) {
      toast({
        message: error.response?.data?.message || 'Não foi possível atualizar este pedido.',
        variant: 'danger',
      });
    } finally {
      setSavingOrderId(null);
    }
  };

  const handleRetiradaUpdate = async (aluguel, novoStatus) => {
    if (!RETIRADA_STATUS.some((s) => s.value === novoStatus)) {
      toast({ message: 'Status de retirada inválido.', variant: 'danger' });
      return;
    }
    const meta = RETIRADA_STATUS.find((s) => s.value === novoStatus);
    const isConfirmed = await confirm({
      title: 'Atualizar retirada',
      message: `Confirmar alteração do status de retirada do item "${aluguel.item_nome || `aluguel #${aluguel.id}`}" para "${meta.label}"?`,
      confirmText: 'Atualizar retirada',
      variant: novoStatus === 'realizada' ? 'warning' : 'info',
    });
    if (!isConfirmed) return;

    setUpdatingRetiradaId(aluguel.id);
    try {
      await rentalService.updatePickup(aluguel.id, { status_retirada: novoStatus });
      setRentals((current) => current.map((r) => (
        String(r.id) === String(aluguel.id)
          ? {
              ...r,
              status_retirada: novoStatus,
              status: novoStatus === 'realizada' ? 'devolvido' : r.status,
            }
          : r
      )));
      toast({ message: 'Retirada atualizada.', variant: 'success' });
    } catch (error) {
      toast({
        message: error.response?.data?.message || 'Não foi possível atualizar a retirada.',
        variant: 'danger',
      });
    } finally {
      setUpdatingRetiradaId(null);
    }
  };

  if (!isAdmin) {
    return <AccessDenied />;
  }

  if (loading) {
    return <ControlCenterSkeleton />;
  }

  return (
    <div className="space-y-6 animate-fade-in pb-6">
      {/* ── Header / Hero Banner Premium ── */}
      <section
        className="relative overflow-hidden rounded-3xl border p-6 sm:p-8 transition-all"
        style={{
          backgroundColor: 'var(--bg-elevated-1)',
          borderColor: 'var(--accent-gold-border)',
          boxShadow: 'var(--shadow-card), 0 0 24px rgba(212, 175, 55, 0.06)',
        }}
      >
        <div
          className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full blur-3xl opacity-25"
          style={{ backgroundColor: 'var(--accent-gold)' }}
        />
        <div
          className="pointer-events-none absolute -left-20 -bottom-20 h-64 w-64 rounded-full blur-3xl opacity-15"
          style={{ backgroundColor: 'var(--accent-gold-light)' }}
        />
        <div className="relative z-10 flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div
              className="mb-3 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-widest"
              style={{
                backgroundColor: 'var(--accent-gold-faint)',
                borderColor: 'var(--accent-gold-border)',
                color: 'var(--accent-gold)',
              }}
            >
              <span className="flex h-4 w-4 items-center justify-center">
                <ControlIcon kind="shield" className="h-3.5 w-3.5" />
              </span>
              Operação protegida
            </div>
            <h1
              className="text-3xl font-bold tracking-tight sm:text-4xl"
              style={{
                fontFamily: 'var(--font-display)',
                color: 'var(--text-primary)',
              }}
            >
              Admin Control Center
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 sm:text-base" style={{ color: 'var(--text-secondary)' }}>
              Controle os acessos, catálogo e pedidos do Nexus com uma visão única da operação.
            </p>
          </div>
          <button
            type="button"
            onClick={() => loadControlData(true)}
            className="btn-secondary self-start xl:self-auto shadow-sm"
          >
            <ControlIcon kind="refresh" className="mr-2 h-4 w-4" />
            Atualizar dados
          </button>
        </div>
      </section>

      {/* ── Abas de Navegação Principal ── */}
      <nav
        className="flex max-w-full gap-2 overflow-x-auto rounded-2xl p-2 border backdrop-blur-md"
        style={{
          backgroundColor: 'var(--bg-elevated-1)',
          borderColor: 'var(--border-color)',
          boxShadow: 'var(--shadow-card)',
        }}
        aria-label="Seções administrativas"
        role="tablist"
      >
        {TABS.map((tab) => {
          const active = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setActiveTab(tab.key)}
              className="flex min-h-11 shrink-0 items-center gap-2 rounded-xl px-5 py-2 text-sm font-semibold transition-all duration-200 border"
              style={{
                background: active ? 'linear-gradient(135deg, var(--accent-gold-light), var(--accent-gold-dark))' : 'transparent',
                color: active ? '#0d0d0d' : 'var(--text-secondary)',
                borderColor: active ? 'var(--accent-gold-light)' : 'transparent',
                boxShadow: active ? '0 4px 16px var(--accent-gold-glow)' : 'none',
              }}
              onMouseEnter={(e) => {
                if (!active) {
                  e.currentTarget.style.backgroundColor = 'var(--bg-hover)';
                  e.currentTarget.style.color = 'var(--text-primary)';
                }
              }}
              onMouseLeave={(e) => {
                if (!active) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = 'var(--text-secondary)';
                }
              }}
            >
              <ControlIcon kind={tab.icon} className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </nav>

      {activeTab === 'visao-geral' && (
        <OverviewSection
          users={users}
          items={items}
          orders={orders}
          overview={overview}
          pages={pages}
          previewRole={previewRole}
          roleViews={roleViews}
          visiblePages={visiblePreviewPages}
          onPreviewRoleChange={setPreviewRole}
          onNavigate={setActiveTab}
        />
      )}

      {activeTab === 'acessos' && (
        <AccessSection
          pages={pages}
          allUsers={users}
          users={filteredUsers}
          selectedUser={selectedUser}
          permissionDraft={permissionDraft}
          loadingPermissions={loadingPermissions}
          savingPermissions={savingPermissions}
          batchSaving={batchSaving}
          globalPermissionOverrides={globalPermissionOverrides}
          userSearch={userSearch}
          userStatusFilter={userStatusFilter}
          onUserStatusFilterChange={setUserStatusFilter}
          userEvents={userEvents}
          userEventsLoading={userEventsLoading}
          onUserSearchChange={setUserSearch}
          onUserSelect={setSelectedUserId}
          onDraftChange={setPermissionDraft}
          onRoleChange={handleRoleChange}
          onSave={handlePermissionSave}
          onBatchUpdate={handleBatchUpdate}
        />
      )}

      {activeTab === 'produtos' && (
        <ProductsSection
          items={items}
          deletingProductId={deletingProductId}
          seedingCatalog={seedingCatalog}
          onSeed={handleSeedCatalog}
          onCreate={() => { setEditingProduct(null); setProductModalOpen(true); }}
          onEdit={(product) => { setEditingProduct(product); setProductModalOpen(true); }}
          onDelete={handleProductDelete}
        />
      )}

      {activeTab === 'pedidos' && (
        <OrdersSection
          orders={orders}
          orderDrafts={orderDrafts}
          savingOrderId={savingOrderId}
          expandedOrderId={expandedOrderId}
          onDraftChange={updateOrderDraft}
          onSave={saveOrderStatus}
          onExpandedChange={setExpandedOrderId}
        />
      )}

      {activeTab === 'alugueis' && (
        <RentalsSection
          rentals={rentals}
          loading={rentalsLoading}
          statusFilter={rentalStatusFilter}
          onStatusFilterChange={setRentalStatusFilter}
          updatingRetiradaId={updatingRetiradaId}
          onRetiradaUpdate={handleRetiradaUpdate}
        />
      )}

      <ItemFormModal
        isOpen={productModalOpen}
        onClose={() => { if (!savingProduct) { setProductModalOpen(false); setEditingProduct(null); } }}
        onSubmit={handleProductSave}
        initialData={editingProduct}
        loading={savingProduct}
      />
    </div>
  );
}

function OverviewSection({ users, items, orders, overview, pages, previewRole, roleViews, visiblePages, onPreviewRoleChange, onNavigate }) {
  return (
    <div className="space-y-6" role="tabpanel">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Usuários ativos" value={overview.activeUsers} detail={`de ${users.length} cadastrados`} icon="users" />
        <MetricCard label="Produtos no catálogo" value={items.length} detail="prontos para venda" icon="box" />
        <MetricCard label="Pedidos pendentes" value={overview.pendingOrders} detail={`de ${orders.length} no total`} icon="receipt" accent="amber" />
        <MetricCard label="Receita confirmada" value={formatCurrency(overview.approvedRevenue)} detail="pagamentos aprovados" icon="chart" accent="green" />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-5">
        <section
          className="card p-6 xl:col-span-3 transition-all"
          style={{
            backgroundColor: 'var(--bg-elevated-1)',
            borderColor: 'var(--border-color)',
            boxShadow: 'var(--shadow-card)',
          }}
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em]" style={{ color: 'var(--accent-gold)' }}>
                Pré-visualização por perfil
              </p>
              <h2
                className="mt-2 text-xl font-bold tracking-tight"
                style={{
                  fontFamily: 'var(--font-display)',
                  color: 'var(--text-primary)',
                }}
              >
                Rotas visíveis na experiência
              </h2>
              <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
                Confira o que cada perfil pode encontrar na navegação.
              </p>
            </div>
            <div className="flex flex-nowrap gap-2" aria-label="Alternar perfil visualizado">
              {Object.entries(ROLE_META).map(([role, meta]) => {
                const active = previewRole === role;
                return (
                  <button
                    key={role}
                    type="button"
                    onClick={() => onPreviewRoleChange(role)}
                    aria-pressed={active}
                    className={`min-h-10 shrink-0 whitespace-nowrap rounded-xl border px-3 text-sm font-semibold transition-all ${
                      active ? meta.className + ' shadow-sm' : ''
                    }`}
                    style={
                      !active
                        ? {
                            backgroundColor: 'var(--bg-elevated-2)',
                            borderColor: 'var(--border-color)',
                            color: 'var(--text-secondary)',
                          }
                        : {}
                    }
                  >
                    {meta.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div
            className="mt-6 rounded-2xl border p-4 sm:p-5 transition-all"
            style={{
              backgroundColor: 'var(--bg-elevated-2)',
              borderColor: 'var(--border-color)',
            }}
          >
            <div
              className="flex flex-wrap items-center gap-3 border-b pb-4"
              style={{ borderColor: 'var(--border-color)' }}
            >
              <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${ROLE_META[previewRole].className}`}>
                Interface {ROLE_META[previewRole].label}
              </span>
              <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                {visiblePages.length} páginas liberadas
              </span>
            </div>
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {visiblePages.map((page) => (
                <div
                  key={page.key}
                  className="flex items-center gap-3 rounded-xl border p-3 transition-all hover:scale-[1.01]"
                  style={{
                    backgroundColor: 'var(--bg-elevated-1)',
                    borderColor: 'var(--border-color)',
                  }}
                >
                  <span
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border"
                    style={{
                      backgroundColor: 'var(--accent-gold-faint)',
                      borderColor: 'var(--accent-gold-border)',
                      color: 'var(--accent-gold)',
                    }}
                  >
                    <ControlIcon kind={getPageIcon(page.key)} className="h-4 w-4" />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                      {page.label}
                    </span>
                    <span className="block truncate text-xs font-mono" style={{ color: 'var(--text-muted)' }}>
                      {page.path || `/${page.key}`}
                    </span>
                  </span>
                  <span className="ml-auto h-2 w-2 rounded-full bg-emerald-400" aria-label="Liberada" />
                </div>
              ))}
              {visiblePages.length === 0 && (
                <p
                  className="col-span-full rounded-xl border border-dashed p-6 text-center text-sm"
                  style={{ borderColor: 'var(--border-color)', color: 'var(--text-muted)' }}
                >
                  Nenhuma página liberada para este perfil.
                </p>
              )}
            </div>
          </div>
        </section>

        <section
          className="card p-6 xl:col-span-2 transition-all flex flex-col justify-between"
          style={{
            backgroundColor: 'var(--bg-elevated-1)',
            borderColor: 'var(--border-color)',
            boxShadow: 'var(--shadow-card)',
          }}
        >
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em]" style={{ color: 'var(--accent-gold)' }}>
              Atalhos operacionais
            </p>
            <h2
              className="mt-2 text-xl font-bold tracking-tight"
              style={{
                fontFamily: 'var(--font-display)',
                color: 'var(--text-primary)',
              }}
            >
              Ações prioritárias
            </h2>
            <div className="mt-5 space-y-3">
              <ActionShortcut icon="shield" title="Revisar acessos" text="Ajuste funções, bloqueios e permissões por página." action={() => onNavigate('acessos')} />
              <ActionShortcut icon="box" title="Atualizar catálogo" text="Cadastre ou ajuste produtos disponíveis no carrinho." action={() => onNavigate('produtos')} />
              <ActionShortcut icon="receipt" title="Acompanhar pagamentos" text="Monitore cada pedido e atualize o status de cobrança." action={() => onNavigate('pedidos')} />
            </div>
          </div>
        </section>
      </div>

      <SystemRouteMap pages={pages} roleViews={roleViews} />
    </div>
  );
}

const PAGE_DESCRIPTIONS = {
  dashboard: 'Visão geral com indicadores de desempenho e resumo.',
  itens: 'Catálogo interativo de produtos, serviços e equipamentos.',
  carrinho: 'Gerenciamento de seleção de itens e cálculo de frete/total.',
  checkout: 'Processamento de pagamentos automático via Pix e Cartão.',
  pedidos: 'Acompanhamento do status e histórico de compras efetuadas.',
  usuarios: 'Gestão de usuários, controle de permissões e privilégios.',
  admin: 'Painel de controle com matriz de acessos e infraestrutura.',
  perfil: 'Configurações da conta e preferências pessoais do usuário.',
};

function SystemRouteMap({ pages, roleViews }) {
  const [roleFilter, setRoleFilter] = useState('all');
  const [search, setSearch] = useState('');

  const filteredPages = useMemo(() => {
    return pages.filter((page) => {
      const matchesSearch =
        !search.trim() ||
        page.label?.toLowerCase().includes(search.toLowerCase()) ||
        (page.path || `/${page.key}`).toLowerCase().includes(search.toLowerCase());

      if (!matchesSearch) return false;
      if (roleFilter === 'all') return true;

      return pageIsVisibleForRole(page, roleFilter, roleViews);
    });
  }, [pages, roleFilter, roleViews, search]);

  return (
    <section
      className="relative overflow-hidden rounded-3xl border p-6 sm:p-8 transition-all duration-300"
      style={{
        backgroundColor: 'var(--bg-elevated-1)',
        borderColor: 'var(--accent-gold-border)',
        boxShadow: 'var(--shadow-card)',
      }}
    >
      {/* Background Subtle Glow Accent */}
      <div
        className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full opacity-15 blur-3xl"
        style={{ backgroundColor: 'var(--accent-gold)' }}
      />
      <div
        className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full opacity-10 blur-3xl"
        style={{ backgroundColor: 'var(--accent-gold-light)' }}
      />

      {/* Header Container */}
      <div
        className="relative z-10 flex flex-col gap-5 border-b pb-6 sm:flex-row sm:items-center sm:justify-between"
        style={{ borderColor: 'var(--border-color)' }}
      >
        <div className="flex items-center gap-4">
          <div
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border"
            style={{
              backgroundColor: 'var(--accent-gold-faint)',
              borderColor: 'var(--accent-gold-border)',
              color: 'var(--accent-gold)',
              boxShadow: '0 0 20px var(--accent-gold-glow)',
            }}
          >
            <ControlIcon kind="map" className="h-6 w-6" />
          </div>
          <div>
            <h2
              className="text-xl font-bold tracking-tight sm:text-2xl"
              style={{
                fontFamily: 'var(--font-display)',
                color: 'var(--text-primary)',
              }}
            >
              Mapa de Rotas do Sistema
            </h2>
            <p className="mt-1 text-xs sm:text-sm" style={{ color: 'var(--text-secondary)' }}>
              Fonte de verdade para matriz de permissões, controle de acesso (RBAC) e navegação.
            </p>
          </div>
        </div>

        {/* Counter Badge with Pulse Indicator */}
        <div className="flex items-center gap-3">
          <span
            className="inline-flex items-center gap-2 rounded-xl border px-3.5 py-1.5 text-xs font-semibold backdrop-blur-md"
            style={{
              backgroundColor: 'var(--accent-gold-faint)',
              borderColor: 'var(--accent-gold-border)',
              color: 'var(--accent-gold)',
            }}
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            {filteredPages.length} {filteredPages.length === 1 ? 'rota visível' : 'rotas mapeadas'}
          </span>
        </div>
      </div>

      {/* Filters & Search Toolbar */}
      <div className="relative z-10 mt-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        {/* Role Filter Tabs */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="mr-1 text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--accent-gold)' }}>
            Filtrar por:
          </span>
          <button
            type="button"
            onClick={() => setRoleFilter('all')}
            className="rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all duration-200 border"
            style={
              roleFilter === 'all'
                ? {
                    background: 'linear-gradient(135deg, var(--accent-gold-light), var(--accent-gold-dark))',
                    color: '#0d0d0d',
                    borderColor: 'var(--accent-gold-light)',
                    boxShadow: '0 2px 10px var(--accent-gold-glow)',
                  }
                : {
                    backgroundColor: 'var(--bg-elevated-2)',
                    borderColor: 'var(--border-color)',
                    color: 'var(--text-secondary)',
                  }
            }
          >
            Todas ({pages.length})
          </button>
          {Object.entries(ROLE_META).map(([role, meta]) => {
            const count = pages.filter((p) => pageIsVisibleForRole(p, role, roleViews)).length;
            const active = roleFilter === role;
            return (
              <button
                key={role}
                type="button"
                onClick={() => setRoleFilter(role)}
                className="rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all duration-200 border"
                style={
                  active
                    ? {
                        background: 'linear-gradient(135deg, var(--accent-gold-light), var(--accent-gold-dark))',
                        color: '#0d0d0d',
                        borderColor: 'var(--accent-gold-light)',
                        boxShadow: '0 2px 10px var(--accent-gold-glow)',
                      }
                    : {
                        backgroundColor: 'var(--bg-elevated-2)',
                        borderColor: 'var(--border-color)',
                        color: 'var(--text-secondary)',
                      }
                }
              >
                {meta.label} ({count})
              </button>
            );
          })}
        </div>

        {/* Real-time Search Input */}
        <div className="relative min-w-[220px] lg:w-64">
          <ControlIcon kind="search" className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: 'var(--accent-gold)' }} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por rota ou caminho..."
            className="input w-full pl-9 py-1.5 text-xs"
          />
        </div>
      </div>

      {/* Route Cards Grid */}
      <div className="relative z-10 mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {filteredPages.map((page) => {
          const allowedRolesCount = Object.keys(ROLE_META).filter((role) =>
            pageIsVisibleForRole(page, role, roleViews)
          ).length;

          return (
            <article
              key={page.key}
              className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
              style={{
                backgroundColor: 'var(--bg-elevated-2)',
                borderColor: 'var(--border-color)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--accent-gold-border)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-color)';
              }}
            >
              {/* Header: Icon + Path Badge */}
              <div className="flex items-center justify-between gap-3">
                <span
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border transition-all duration-300"
                  style={{
                    backgroundColor: 'var(--accent-gold-faint)',
                    borderColor: 'var(--accent-gold-border)',
                    color: 'var(--accent-gold)',
                  }}
                >
                  <ControlIcon kind={getPageIcon(page.key)} className="h-5 w-5" />
                </span>
                <code
                  className="rounded-lg border px-2.5 py-1 text-[11px] font-mono font-semibold"
                  style={{
                    backgroundColor: 'var(--bg-elevated-1)',
                    borderColor: 'var(--border-color)',
                    color: 'var(--accent-gold)',
                  }}
                >
                  {page.path || `/${page.key}`}
                </code>
              </div>

              {/* Title & Purpose Description */}
              <div className="my-4">
                <h3
                  className="text-base font-bold transition-colors"
                  style={{
                    fontFamily: 'var(--font-display)',
                    color: 'var(--text-primary)',
                  }}
                >
                  {page.label}
                </h3>
                <p className="mt-1 text-xs leading-relaxed line-clamp-2" style={{ color: 'var(--text-secondary)' }}>
                  {PAGE_DESCRIPTIONS[page.key] || 'Página integrada à matriz de navegação do sistema.'}
                </p>
              </div>

              {/* Matrix Role Badges */}
              <div className="pt-3 border-t" style={{ borderColor: 'var(--border-color)' }}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] uppercase font-bold tracking-wider" style={{ color: 'var(--accent-gold)' }}>
                    Nível de Acesso
                  </span>
                  <span className="text-[10px] font-medium" style={{ color: 'var(--text-muted)' }}>
                    {allowedRolesCount === 3 ? 'Acesso total' : `${allowedRolesCount}/3 perfis`}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {Object.entries(ROLE_META).map(([role, meta]) => {
                    const allowed = pageIsVisibleForRole(page, role, roleViews);
                    return (
                      <span
                        key={role}
                        className={`inline-flex items-center gap-1 rounded-lg border px-2 py-0.5 text-[11px] font-medium transition-all ${
                          allowed
                            ? meta.className
                            : 'border-transparent opacity-60'
                        }`}
                        style={!allowed ? { backgroundColor: 'var(--bg-elevated-1)', color: 'var(--text-muted)' } : {}}
                        title={allowed ? `Acesso permitido para ${meta.label}` : `Acesso restrito para ${meta.label}`}
                      >
                        {allowed ? (
                          <ControlIcon kind="check" className="h-3 w-3 text-emerald-400 shrink-0" />
                        ) : (
                          <ControlIcon kind="lock" className="h-3 w-3 shrink-0" />
                        )}
                        {meta.label}
                      </span>
                    );
                  })}
                </div>
              </div>
            </article>
          );
        })}

        {filteredPages.length === 0 && (
          <div
            className="col-span-full rounded-2xl border border-dashed p-8 text-center"
            style={{
              backgroundColor: 'var(--bg-elevated-2)',
              borderColor: 'var(--border-color)',
            }}
          >
            <span
              className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl border"
              style={{
                backgroundColor: 'var(--accent-gold-faint)',
                borderColor: 'var(--accent-gold-border)',
                color: 'var(--accent-gold)',
              }}
            >
              <ControlIcon kind="search" className="h-6 w-6" />
            </span>
            <p className="mt-3 text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Nenhuma rota encontrada</p>
            <p className="mt-1 text-xs" style={{ color: 'var(--text-secondary)' }}>Experimente ajustar o filtro de busca ou perfil selecionado.</p>
          </div>
        )}
      </div>
    </section>
  );
}

/* ─── ACCESS SECTION ─────────────────────────────────────── */

/** Sub-abas internas da seção Acessos */
const ACCESS_SUBTABS = [
  { key: 'individual', label: 'Controle Individual', icon: 'user' },
  { key: 'global', label: 'Controle Global (RBAC)', icon: 'shield' },
];

/**
 * AccessSection — aba principal de Acessos com duas sub-seções:
 *  1. Controle Individual: lista de usuários + painel lateral de edição inline
 *  2. Controle Global: matriz RBAC (página × role) editável de forma global
 */
function AccessSection({ pages, users, selectedUser, permissionDraft, loadingPermissions, savingPermissions, batchSaving, globalPermissionOverrides, userSearch, userStatusFilter, onUserStatusFilterChange, userEvents, userEventsLoading, onUserSearchChange, onUserSelect, onDraftChange, onRoleChange, onSave, onBatchUpdate }) {
  const [accessSubTab, setAccessSubTab] = useState('individual');

  const activeCount = users.filter(isUserActive).length;
  const adminCount = users.filter((u) => u.nivel_acesso === 'admin').length;

  return (
    <div className="space-y-5" role="tabpanel">
      {/* ── Stats ── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Total de usuários', value: users.length, textColor: 'var(--accent-gold)', icon: 'users' },
          { label: 'Contas ativas', value: activeCount, textColor: '#34d399', icon: 'check' },
          { label: 'Administradores', value: adminCount, textColor: 'var(--accent-gold)', icon: 'shield' },
          { label: 'Contas bloqueadas', value: users.length - activeCount, textColor: '#f87171', icon: 'lock' },
        ].map((stat) => (
          <div
            key={stat.label}
            className="card p-4 flex items-center gap-3 transition-all"
            style={{ backgroundColor: 'var(--bg-elevated-1)', borderColor: 'var(--border-color)' }}
          >
            <span
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border"
              style={{ backgroundColor: 'var(--accent-gold-faint)', borderColor: 'var(--accent-gold-border)', color: 'var(--accent-gold)' }}
            >
              <ControlIcon kind={stat.icon} className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <p className="text-lg font-bold leading-tight" style={{ fontFamily: 'var(--font-display)', color: stat.textColor }}>{stat.value}</p>
              <p className="text-[11px] truncate" style={{ color: 'var(--text-muted)' }}>{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Sub-navegação interna ── */}
      <div
        className="flex gap-1 rounded-xl border p-1 w-fit"
        style={{ backgroundColor: 'var(--bg-elevated-1)', borderColor: 'var(--border-color)' }}
      >
        {ACCESS_SUBTABS.map((tab) => {
          const active = accessSubTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setAccessSubTab(tab.key)}
              className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all duration-200 border"
              style={active
                ? {
                    background: 'linear-gradient(135deg, var(--accent-gold-light), var(--accent-gold-dark))',
                    color: '#0d0d0d',
                    borderColor: 'var(--accent-gold-light)',
                    boxShadow: '0 2px 10px var(--accent-gold-glow)',
                  }
                : {
                    backgroundColor: 'transparent',
                    borderColor: 'transparent',
                    color: 'var(--text-secondary)',
                  }
              }
              aria-selected={active}
            >
              <ControlIcon kind={tab.icon} className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ── Sub-seção: Controle Individual ── */}
      {accessSubTab === 'individual' && (
        <IndividualAccessPanel
          pages={pages}
          users={users}
          selectedUser={selectedUser}
          permissionDraft={permissionDraft}
          loadingPermissions={loadingPermissions}
          savingPermissions={savingPermissions}
          userSearch={userSearch}
          userStatusFilter={userStatusFilter}
          onUserStatusFilterChange={onUserStatusFilterChange}
          userEvents={userEvents}
          userEventsLoading={userEventsLoading}
          onUserSearchChange={onUserSearchChange}
          onUserSelect={onUserSelect}
          onDraftChange={onDraftChange}
          onRoleChange={onRoleChange}
          onSave={onSave}
        />
      )}

      {/* ── Sub-seção: Controle Global RBAC ── */}
      {accessSubTab === 'global' && (
        <GlobalAccessPanel
          pages={pages}
          users={users}
          batchSaving={batchSaving}
          globalPermissionOverrides={globalPermissionOverrides}
          onBatchUpdate={onBatchUpdate}
        />
      )}
    </div>
  );
}

/* ─── INDIVIDUAL ACCESS PANEL ─── */
/**
 * Painel split: esquerda = lista de usuários, direita = editor inline de permissões.
 * Em mobile vira empilhado (coluna).
 */
function IndividualAccessPanel({ pages, users, selectedUser, permissionDraft, loadingPermissions, savingPermissions, userSearch, userStatusFilter, onUserStatusFilterChange, userEvents, userEventsLoading, onUserSearchChange, onUserSelect, onDraftChange, onRoleChange, onSave }) {

  const handleSelectUser = (userId) => {
    onUserSelect(userId);
  };

  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-[380px_1fr]">

      {/* ── Coluna esquerda: Diretório de usuários ── */}
      <section
        className="card flex flex-col min-h-0"
        style={{ backgroundColor: 'var(--bg-elevated-1)', borderColor: 'var(--border-color)' }}
      >
        <div
          className="flex flex-col gap-3 border-b p-5"
          style={{ borderColor: 'var(--border-color)' }}
        >
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em]" style={{ color: 'var(--accent-gold)' }}>Diretório</p>
            <h2
              className="mt-1 text-lg font-bold"
              style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}
            >Selecione um usuário</h2>
          </div>
          <label className="relative">
            <span className="sr-only">Buscar usuário</span>
            <ControlIcon kind="search" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: 'var(--accent-gold)' }} />
            <input
              value={userSearch}
              onChange={(e) => onUserSearchChange(e.target.value)}
              className="input py-2 pl-9 text-sm w-full"
              placeholder="Buscar nome ou e-mail…"
            />
          </label>
          <label className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
            <span className="shrink-0">Situação</span>
            <select
              value={userStatusFilter || ''}
              onChange={(e) => onUserStatusFilterChange?.(e.target.value)}
              className="input py-1.5 text-sm flex-1"
              aria-label="Filtrar por situação da conta"
            >
              {STATUS_CONTA_OPTIONS.map((opt) => (
                <option key={opt.value || 'todos'} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </label>
        </div>

        <div className="overflow-y-auto max-h-[560px]" style={{ borderColor: 'var(--border-color)' }}>
          {users.length === 0 ? (
            <EmptyPanel icon="users" title="Nenhum usuário encontrado" text="Tente ajustar o filtro de busca." />
          ) : users.map((targetUser) => {
            const roleMeta = ROLE_META[targetUser.nivel_acesso] || ROLE_META.cliente;
            const root = isRootAdmin(targetUser);
            const isSelected = String(targetUser.id) === String(selectedUser?.id);
            const statusPill = statusContaPill(targetUser);

            return (
              <button
                key={targetUser.id}
                type="button"
                onClick={() => handleSelectUser(targetUser.id)}
                className="w-full flex items-center gap-3 p-4 text-left transition-all duration-150 border-l-2"
                style={{
                  borderLeftColor: isSelected ? 'var(--accent-gold)' : 'transparent',
                  backgroundColor: isSelected ? 'var(--accent-gold-faint)' : 'transparent',
                  borderBottom: '1px solid var(--border-color)',
                }}
                id={`user-row-${targetUser.id}`}
                aria-selected={isSelected}
              >
                {/* Avatar */}
                <span
                  className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border text-sm font-bold"
                  style={{
                    backgroundColor: 'var(--accent-gold-faint)',
                    borderColor: 'var(--accent-gold-border)',
                    color: 'var(--accent-gold)',
                  }}
                >
                  {initials(targetUser.nome)}
                  <span className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 ${statusPill.dotClass}`}
                    style={{ borderColor: 'var(--bg-elevated-1)' }}
                  />
                </span>
                {/* Info */}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span
                      className="font-semibold text-sm truncate"
                      style={{ color: isSelected ? 'var(--accent-gold)' : 'var(--text-primary)' }}
                    >{targetUser.nome || 'Usuário sem nome'}</span>
                    {root && (
                      <span
                        className="rounded-full border px-1.5 py-0.5 text-[10px] font-bold"
                        style={{ backgroundColor: 'var(--accent-gold-faint)', borderColor: 'var(--accent-gold-border)', color: 'var(--accent-gold)' }}
                      >Raiz</span>
                    )}
                  </div>
                  <p className="text-xs truncate" style={{ color: 'var(--text-secondary)' }}>{targetUser.email}</p>
                  <div className="mt-1 flex flex-wrap gap-1">
                    <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-medium ${roleMeta.className}`}>{roleMeta.label}</span>
                    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium ${statusPill.className}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${statusPill.dotClass}`} />
                      {statusPill.label}
                    </span>
                  </div>
                </div>
                {/* Chevron indicator */}
                <ControlIcon
                  kind="chevron"
                  className="h-4 w-4 shrink-0 transition-colors"
                  style={{ color: isSelected ? 'var(--accent-gold)' : 'var(--text-muted)' }}
                />
              </button>
            );
          })}
        </div>
      </section>

      {/* ── Coluna direita: Editor inline de permissões ── */}
      <section
        className="card flex flex-col min-h-0"
        style={{ backgroundColor: 'var(--bg-elevated-1)', borderColor: 'var(--border-color)' }}
      >
        {!selectedUser ? (
          <div className="flex flex-1 flex-col items-center justify-center p-12 text-center gap-4">
            <span
              className="flex h-16 w-16 items-center justify-center rounded-2xl border"
              style={{ backgroundColor: 'var(--accent-gold-faint)', borderColor: 'var(--accent-gold-border)', color: 'var(--accent-gold)' }}
            >
              <ControlIcon kind="user" className="h-8 w-8" />
            </span>
            <div>
              <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>Nenhum usuário selecionado</p>
              <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>Selecione um usuário na lista ao lado para editar suas permissões.</p>
            </div>
          </div>
        ) : (
          <>
            <UserPermissionEditor
              user={selectedUser}
              pages={pages}
              permissionDraft={permissionDraft}
              loadingPermissions={loadingPermissions}
              savingPermissions={savingPermissions}
              onDraftChange={onDraftChange}
              onRoleChange={onRoleChange}
              onSave={onSave}
            />
            <UserEventsPanel
              user={selectedUser}
              events={userEvents}
              loading={userEventsLoading}
            />
          </>
        )}
      </section>
    </div>
  );
}

/* ─── USER PERMISSION EDITOR (inline, no painel direito) ─── */
function UserPermissionEditor({ user, pages, permissionDraft, loadingPermissions, savingPermissions, onDraftChange, onRoleChange, onSave }) {
  const rootUser = isRootAdmin(user);

  return (
    <div className="flex flex-col h-full">
      {/* Header do editor */}
      <div
        className="flex items-center gap-4 border-b p-5"
        style={{ borderColor: 'var(--border-color)' }}
      >
        <div
          className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border text-sm font-bold"
          style={{ backgroundColor: 'var(--accent-gold-faint)', borderColor: 'var(--accent-gold-border)', color: 'var(--accent-gold)' }}
        >
          {initials(user.nome)}
          <span
            className={`absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 ${isUserActive(user) ? 'bg-emerald-400' : 'bg-red-400'}`}
            style={{ borderColor: 'var(--bg-elevated-1)' }}
          />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-base font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>{user.nome || 'Usuário'}</h2>
            {rootUser && (
              <span
                className="rounded-full border px-2 py-0.5 text-[10px] font-bold"
                style={{ backgroundColor: 'var(--accent-gold-faint)', borderColor: 'var(--accent-gold-border)', color: 'var(--accent-gold)' }}
              >Raiz</span>
            )}
            <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${permissionDraft.active ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300' : 'border-red-400/30 bg-red-400/10 text-red-300'}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${permissionDraft.active ? 'bg-emerald-400' : 'bg-red-400'}`} />
              {permissionDraft.active ? 'Liberado' : 'Bloqueado'}
            </span>
          </div>
          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{user.email}</p>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-xs hidden sm:block" style={{ color: 'var(--text-muted)' }}>
            Editando permissões individualmente
          </span>
        </div>
      </div>

      {/* Corpo do editor */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        {rootUser ? (
          <div
            className="flex flex-col items-center justify-center gap-3 rounded-2xl border p-8 text-center"
            style={{ backgroundColor: 'var(--accent-gold-faint)', borderColor: 'var(--accent-gold-border)' }}
          >
            <span
              className="flex h-12 w-12 items-center justify-center rounded-2xl border"
              style={{ backgroundColor: 'var(--accent-gold-faint)', borderColor: 'var(--accent-gold-border)', color: 'var(--accent-gold)' }}
            >
              <ControlIcon kind="shield" className="h-6 w-6" />
            </span>
            <div>
              <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>Administrador Raiz Protegido</p>
              <p className="mt-1 text-xs max-w-xs" style={{ color: 'var(--text-secondary)' }}>As permissões deste administrador raiz são permanentes e não podem ser alteradas pelo painel de controle.</p>
            </div>
          </div>
        ) : (
          <>
            {/* Configurações da conta */}
            <div>
              <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--accent-gold)' }}>Configurações da conta</p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label>
                  <span className="label text-xs">Nível de acesso</span>
                  <select
                    value={permissionDraft.role}
                    onChange={(e) => onRoleChange(e.target.value)}
                    className="input text-sm"
                  >
                    {Object.entries(ROLE_META).map(([role, meta]) => (
                      <option key={role} value={role}>{meta.label}</option>
                    ))}
                  </select>
                </label>
                <div>
                  <span className="label text-xs">Status da conta</span>
                  <label
                    className="flex min-h-[46px] cursor-pointer items-center justify-between rounded-xl border px-4 gap-2 transition-all"
                    style={{ backgroundColor: 'var(--bg-elevated-2)', borderColor: 'var(--border-color)' }}
                  >
                    <span>
                      <span className="block text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{permissionDraft.active ? 'Conta liberada' : 'Conta bloqueada'}</span>
                      <span className="block text-[11px]" style={{ color: 'var(--text-muted)' }}>Bloqueia toda a navegação</span>
                    </span>
                    <input
                      type="checkbox"
                      checked={permissionDraft.active}
                      onChange={(e) => onDraftChange((cur) => ({ ...cur, active: e.target.checked }))}
                      className="h-4 w-4 accent-nexus-500 shrink-0"
                    />
                  </label>
                </div>
              </div>
            </div>

            {/* Badge de perfil */}
            {permissionDraft.role && ROLE_META[permissionDraft.role] && (
              <div className={`flex items-center gap-2.5 rounded-xl border px-3.5 py-2.5 ${ROLE_META[permissionDraft.role].className}`}>
                <ControlIcon kind="shield" className="h-4 w-4 shrink-0" />
                <span className="text-xs leading-snug">{ROLE_META[permissionDraft.role].description}</span>
              </div>
            )}

            {/* Permissões de navegação */}
            <div>
              <div className="flex items-end justify-between mb-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--accent-gold)' }}>Permissões de navegação</p>
                  <p className="mt-0.5 text-[11px]" style={{ color: 'var(--text-secondary)' }}>Desative páginas para removê-las da experiência do usuário.</p>
                </div>
                {loadingPermissions && (
                  <span className="flex items-center gap-1.5 text-[11px]" style={{ color: 'var(--text-secondary)' }}>
                    <Spinner className="h-3 w-3" />Carregando…
                  </span>
                )}
              </div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {pages.map((page) => {
                  const enabled = permissionDraft.permissions?.[page.key] !== false;
                  return (
                    <label
                      key={page.key}
                      className="flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition-all duration-200"
                      style={enabled
                        ? { backgroundColor: 'var(--accent-gold-faint)', borderColor: 'var(--accent-gold-border)' }
                        : { backgroundColor: 'var(--bg-elevated-2)', borderColor: 'var(--border-color)' }
                      }
                    >
                      <span
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border transition-colors"
                        style={enabled
                          ? { backgroundColor: 'var(--accent-gold-faint)', borderColor: 'var(--accent-gold-border)', color: 'var(--accent-gold)' }
                          : { backgroundColor: 'var(--bg-elevated-1)', borderColor: 'var(--border-color)', color: 'var(--text-muted)' }
                        }
                      >
                        <ControlIcon kind={getPageIcon(page.key)} className="h-4 w-4" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span
                          className="block truncate text-sm font-semibold"
                          style={{ color: enabled ? 'var(--text-primary)' : 'var(--text-secondary)' }}
                        >{page.label}</span>
                        <span className="block truncate text-[11px] font-mono" style={{ color: 'var(--text-muted)' }}>{page.path || `/${page.key}`}</span>
                      </span>
                      <input
                        type="checkbox"
                        checked={enabled}
                        onChange={(e) => onDraftChange((cur) => ({
                          ...cur,
                          permissions: { ...cur.permissions, [page.key]: e.target.checked },
                        }))}
                        className="h-4 w-4 shrink-0 accent-nexus-500"
                      />
                    </label>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Footer com ações */}
      {!rootUser && (
        <div
          className="flex items-center justify-between gap-3 border-t p-5"
          style={{ borderColor: 'var(--border-color)' }}
        >
          <p className="text-xs hidden sm:block" style={{ color: 'var(--text-muted)' }}>Alterações aplicadas imediatamente no servidor.</p>
          <button
            type="button"
            onClick={onSave}
            disabled={savingPermissions || loadingPermissions}
            className="btn-primary py-2.5 px-6 text-sm ml-auto"
          >
            {savingPermissions
              ? <><Spinner className="mr-2 h-4 w-4" />Salvando…</>
              : <><ControlIcon kind="check" className="mr-2 h-4 w-4" />Salvar acessos</>}
          </button>
        </div>
      )}
    </div>
  );
}

/* ─── GLOBAL ACCESS PANEL (RBAC Matrix) ─── */
/**
 * Painel de controle global: exibe uma matriz Pages × Roles com indicadores visuais.
 * Permite ao admin ver de forma consolidada quais roles têm acesso a quais páginas.
 * Nota: edição global de roles por página é operacional/visual — as mudanças individuais
 * ainda são salvas via o painel individual por usuário.
 */
function GlobalAccessPanel({ pages, users, batchSaving, globalPermissionOverrides, onBatchUpdate }) {
  const [roleFilter, setRoleFilter] = useState('all');
  const [search, setSearch] = useState('');

  const filteredPages = useMemo(() => {
    return pages.filter((page) => {
      const matchesSearch =
        !search.trim() ||
        page.label?.toLowerCase().includes(search.toLowerCase()) ||
        (page.path || `/${page.key}`).toLowerCase().includes(search.toLowerCase());
      return matchesSearch;
    });
  }, [pages, search]);

  // Estatísticas por role
  const roleStats = useMemo(() => {
    return Object.keys(ROLE_META).map((role) => {
      const usersWithRole = users.filter((u) => u.nivel_acesso === role);
      const active = usersWithRole.filter(isUserActive).length;
      return { role, total: usersWithRole.length, active };
    });
  }, [users]);

  return (
    <div className="space-y-5">
      {/* Cards de resumo por perfil */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {roleStats.map(({ role, total, active }) => {
          const meta = ROLE_META[role];
          return (
            <div key={role} className={`rounded-2xl border p-5 ${meta.className}`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <ControlIcon kind="shield" className="h-4 w-4" />
                  <span className="text-sm font-semibold">{meta.label}</span>
                </div>
                <span className="text-xs opacity-70">{meta.description}</span>
              </div>
              <div className="flex items-end gap-3">
                <div>
                  <p className="text-2xl font-bold">{total}</p>
                  <p className="text-xs opacity-70">usuários neste perfil</p>
                </div>
                <div className="ml-auto text-right">
                  <p className="text-lg font-semibold text-emerald-600 dark:text-emerald-300">{active}</p>
                  <p className="text-xs opacity-70">ativos</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Matriz RBAC */}
      <section
        className="card overflow-hidden"
        style={{ backgroundColor: 'var(--bg-elevated-1)', borderColor: 'var(--border-color)' }}
      >
        {/* Header */}
        <div
          className="flex flex-col gap-4 border-b p-5 sm:flex-row sm:items-center sm:justify-between"
          style={{ borderColor: 'var(--border-color)' }}
        >
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em]" style={{ color: 'var(--accent-gold)' }}>Matriz de acesso</p>
            <h2 className="mt-1.5 text-xl font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>Controle Global por Perfil</h2>
            <p className="mt-0.5 text-sm" style={{ color: 'var(--text-secondary)' }}>
              Visão consolidada de quais perfis têm acesso a cada página do sistema.
            </p>
          </div>
          <label className="relative sm:w-64">
            <ControlIcon kind="search" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: 'var(--accent-gold)' }} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input py-2 pl-9 text-sm w-full"
              placeholder="Filtrar páginas…"
            />
          </label>
        </div>

        {/* Filtro de role */}
        <div
          className="flex flex-wrap items-center gap-2 border-b px-5 py-3"
          style={{ borderColor: 'var(--border-color)' }}
        >
          <span className="text-xs font-bold uppercase tracking-wider mr-1" style={{ color: 'var(--accent-gold)' }}>Filtrar por perfil:</span>
          <button
            type="button"
            onClick={() => setRoleFilter('all')}
            className="rounded-xl px-3 py-1 text-xs font-semibold transition-all border"
            style={roleFilter === 'all'
              ? {
                  background: 'linear-gradient(135deg, var(--accent-gold-light), var(--accent-gold-dark))',
                  color: '#0d0d0d',
                  borderColor: 'var(--accent-gold-light)',
                  boxShadow: '0 2px 8px var(--accent-gold-glow)',
                }
              : { backgroundColor: 'var(--bg-elevated-2)', borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }
            }
          >
            Todos os perfis ({pages.length} páginas)
          </button>
          {Object.entries(ROLE_META).map(([role, meta]) => (
            <button
              key={role}
              type="button"
              onClick={() => setRoleFilter(role)}
              className={`rounded-xl px-3 py-1 text-xs font-semibold transition-all border ${
                roleFilter === role ? meta.className : ''
              }`}
              style={roleFilter !== role
                ? { backgroundColor: 'var(--bg-elevated-2)', borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }
                : {}
              }
            >
              {meta.label}
            </button>
          ))}
        </div>

        {/* Tabela da matriz */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b" style={{ borderColor: 'var(--border-color)' }}>
                <th
                  className="py-3 pl-5 pr-4 text-left text-xs font-bold uppercase tracking-wider w-[220px]"
                  style={{ color: 'var(--accent-gold)' }}
                >
                  Página / Rota
                </th>
                {Object.entries(ROLE_META).map(([role, meta]) => (
                  <th key={role} className="py-3 px-4 text-center text-xs font-semibold uppercase tracking-wider">
                    <span className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 ${meta.className}`}>
                      <ControlIcon kind="shield" className="h-3 w-3" />
                      {meta.label}
                    </span>
                  </th>
                ))}
                <th className="py-3 px-4 text-center text-xs font-bold uppercase tracking-wider whitespace-nowrap" style={{ color: 'var(--accent-gold)' }}>
                  Cobertura
                </th>
                <th className="py-3 px-5 text-right text-xs font-bold uppercase tracking-wider whitespace-nowrap" style={{ color: 'var(--accent-gold)' }}>
                  Todos os usuários
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredPages
                .filter((page) => {
                  if (roleFilter === 'all') return true;
                  return page.roles?.includes(roleFilter) ?? roleFilter === 'admin';
                })
                .map((page) => {
                  const roleAccess = Object.keys(ROLE_META).map((role) => ({
                    role,
                    allowed: globalPermissionOverrides[page.key] ?? (page.roles?.includes(role) ?? role === 'admin'),
                  }));
                  const allowedCount = roleAccess.filter((r) => r.allowed).length;
                  const coveragePct = Math.round((allowedCount / Object.keys(ROLE_META).length) * 100);
                  const rowSaving = batchSaving?.pageKey === page.key && batchSaving?.role === 'all';

                  return (
                    <tr
                      key={page.key}
                      className="group transition-colors"
                      style={{ borderBottom: '1px solid var(--border-color)' }}
                      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--bg-hover)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = ''; }}
                    >
                      {/* Página */}
                      <td className="py-3.5 pl-5 pr-4">
                        <div className="flex items-center gap-3">
                          <span
                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border"
                            style={{ backgroundColor: 'var(--accent-gold-faint)', borderColor: 'var(--accent-gold-border)', color: 'var(--accent-gold)' }}
                          >
                            <ControlIcon kind={getPageIcon(page.key)} className="h-4 w-4" />
                          </span>
                          <div>
                            <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>{page.label}</p>
                            <code className="text-[10px] font-mono" style={{ color: 'var(--text-muted)' }}>{page.path || `/${page.key}`}</code>
                          </div>
                        </div>
                      </td>

                      {/* Células de acesso por role */}
                      {roleAccess.map(({ role, allowed }) => (
                        <td key={role} className="py-3.5 px-4 text-center">
                          <span
                            title={allowed ? `${ROLE_META[role].label} tem acesso` : `${ROLE_META[role].label} sem acesso`}
                            className={`inline-flex h-8 w-8 items-center justify-center rounded-lg border mx-auto transition-all ${
                              allowed
                                ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-400'
                                : 'opacity-50'
                            }`}
                            style={!allowed ? { backgroundColor: 'var(--bg-elevated-2)', borderColor: 'var(--border-color)', color: 'var(--text-muted)' } : {}}
                          >
                            {allowed
                              ? <ControlIcon kind="check" className="h-4 w-4" />
                              : <ControlIcon kind="lock" className="h-3.5 w-3.5" />
                            }
                          </span>
                        </td>
                      ))}

                      {/* Cobertura */}
                      <td className="py-3.5 px-4">
                        <div className="flex flex-col items-center gap-1">
                          <span className={`text-xs font-semibold ${coveragePct === 100 ? 'text-emerald-400' : coveragePct >= 66 ? '' : 'text-amber-400'}`}
                            style={coveragePct >= 66 && coveragePct < 100 ? { color: 'var(--accent-gold)' } : {}}
                          >
                            {allowedCount}/{Object.keys(ROLE_META).length}
                          </span>
                          <div
                            className="w-16 h-1.5 rounded-full overflow-hidden"
                            style={{ backgroundColor: 'var(--border-color)' }}
                          >
                            <div
                              className={`h-full rounded-full transition-all ${
                                coveragePct === 100 ? 'bg-emerald-400' : coveragePct >= 66 ? '' : 'bg-amber-400'
                              }`}
                              style={{ width: `${coveragePct}%`, background: coveragePct >= 66 && coveragePct < 100 ? 'var(--accent-gold)' : undefined }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-5">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => onBatchUpdate(page.key, 'all', true)}
                            disabled={rowSaving}
                            className="btn-primary min-h-9 px-3 py-1.5 text-xs"
                            aria-label={`Liberar ${page.label} para todos os usuários`}
                          >
                            {rowSaving && batchSaving.enable ? <Spinner className="h-4 w-4" /> : 'Liberar'}
                          </button>
                          <button
                            type="button"
                            onClick={() => onBatchUpdate(page.key, 'all', false)}
                            disabled={rowSaving}
                            className="btn-secondary min-h-9 px-3 py-1.5 text-xs"
                            aria-label={`Bloquear ${page.label} para todos os usuários`}
                          >
                            {rowSaving && !batchSaving.enable ? <Spinner className="h-4 w-4" /> : 'Bloquear'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>

          {filteredPages.length === 0 && (
            <EmptyPanel icon="search" title="Nenhuma página encontrada" text="Experimente ajustar o filtro de busca." />
          )}
        </div>

        {/* Legenda */}
        <div
          className="flex flex-wrap items-center gap-4 border-t px-5 py-3 text-xs"
          style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}
        >
          <span className="font-bold uppercase tracking-wider" style={{ color: 'var(--accent-gold)' }}>Legenda:</span>
          <span className="flex items-center gap-1.5">
            <span className="flex h-5 w-5 items-center justify-center rounded border border-emerald-400/30 bg-emerald-400/10 text-emerald-400">
              <ControlIcon kind="check" className="h-3 w-3" />
            </span>
            Acesso permitido
          </span>
          <span className="flex items-center gap-1.5">
            <span
              className="flex h-5 w-5 items-center justify-center rounded border opacity-50"
              style={{ backgroundColor: 'var(--bg-elevated-2)', borderColor: 'var(--border-color)', color: 'var(--text-muted)' }}
            >
              <ControlIcon kind="lock" className="h-3 w-3" />
            </span>
            Acesso restrito
          </span>
          <span className="ml-auto" style={{ color: 'var(--text-muted)' }}>
            Configurações individuais por usuário disponíveis na aba <strong style={{ color: 'var(--text-secondary)' }}>Controle Individual</strong>.
          </span>
        </div>
      </section>
    </div>
  );
}


function ProductsSection({ items, deletingProductId, seedingCatalog, onSeed, onCreate, onEdit, onDelete }) {
  return (
    <section
      className="card"
      role="tabpanel"
      style={{ backgroundColor: 'var(--bg-elevated-1)', borderColor: 'var(--border-color)' }}
    >
      <div
        className="flex flex-col gap-4 border-b p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6"
        style={{ borderColor: 'var(--border-color)' }}
      >
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em]" style={{ color: 'var(--accent-gold)' }}>Catálogo do carrinho</p>
          <h2 className="mt-2 text-xl font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>Produtos e estoque</h2>
          <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>{items.length} produtos cadastrados para venda.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onSeed}
            disabled={seedingCatalog}
            className="btn-secondary self-start sm:self-auto"
            title="Sincroniza e adiciona os 21 produtos padrão da loja"
          >
            {seedingCatalog ? <Spinner className="mr-2 h-4 w-4" /> : <ControlIcon kind="chart" className="mr-2 h-4 w-4" />}
            {seedingCatalog ? 'Semeando...' : 'Popular Catálogo Oficial'}
          </button>
          <button type="button" onClick={onCreate} className="btn-primary self-start sm:self-auto">
            <ControlIcon kind="plus" className="mr-2 h-5 w-5" />Novo produto
          </button>
        </div>
      </div>

      <div>
        {items.map((product) => (
          <article
            key={product.id}
            className="flex flex-col gap-4 p-5 transition-all sm:flex-row sm:items-center sm:p-6"
            style={{ borderBottom: '1px solid var(--border-color)' }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--bg-hover)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = ''; }}
          >
            <span
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border"
              style={{ backgroundColor: 'var(--accent-gold-faint)', borderColor: 'var(--accent-gold-border)', color: 'var(--accent-gold)' }}
            >
              <ControlIcon kind="box" className="h-6 w-6" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="truncate font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>{product.nome}</h3>
                {product.categoria && (
                  <span
                    className="rounded-full border px-2 py-0.5 text-[11px] font-semibold"
                    style={{ backgroundColor: 'var(--accent-gold-faint)', borderColor: 'var(--accent-gold-border)', color: 'var(--accent-gold)' }}
                  >{product.categoria}</span>
                )}
              </div>
              {product.descricao && <p className="mt-1 line-clamp-2 text-sm" style={{ color: 'var(--text-secondary)' }}>{product.descricao}</p>}
              <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm">
                <span className="font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--accent-gold)' }}>{formatCurrency(product.valor_venda)}</span>
                <span className={toNumber(product.estoque) > 0 ? 'text-emerald-400' : 'text-red-400'}>Estoque: {product.estoque ?? 0}</span>
                {product.criador_nome && <span style={{ color: 'var(--text-muted)' }}>Por {product.criador_nome}</span>}
              </div>
            </div>
            <div className="flex shrink-0 gap-2">
              <button type="button" onClick={() => onEdit(product)} className="btn-secondary min-h-10 px-4 py-2 text-xs"><ControlIcon kind="edit" className="mr-1.5 h-4 w-4" />Editar</button>
              <button type="button" onClick={() => onDelete(product)} disabled={deletingProductId === product.id} className="btn-danger min-h-10 px-4 py-2 text-xs">
                {deletingProductId === product.id ? <Spinner className="h-4 w-4" /> : <><ControlIcon kind="trash" className="mr-1.5 h-4 w-4" />Excluir</>}
              </button>
            </div>
          </article>
        ))}
        {items.length === 0 && (
          <EmptyPanel
            icon="box"
            title="Catálogo vazio"
            text="O banco de dados ainda não possui produtos cadastrados. Clique abaixo para popular automaticamente com o catálogo oficial de 21 produtos."
            actionLabel={seedingCatalog ? "Populando..." : "Popular Catálogo Oficial (21 itens)"}
            onAction={onSeed}
          />
        )}
      </div>
    </section>
  );
}

function OrdersSection({ orders, orderDrafts, savingOrderId, expandedOrderId, onDraftChange, onSave, onExpandedChange }) {
  return (
    <section
      className="card"
      role="tabpanel"
      style={{ backgroundColor: 'var(--bg-elevated-1)', borderColor: 'var(--border-color)' }}
    >
      <div
        className="flex flex-col gap-2 border-b p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6"
        style={{ borderColor: 'var(--border-color)' }}
      >
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em]" style={{ color: 'var(--accent-gold)' }}>Operação financeira</p>
          <h2 className="mt-2 text-xl font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>Pedidos e pagamentos</h2>
          <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>Monitore a cobrança e o processamento de cada compra.</p>
        </div>
        <span
          className="w-fit rounded-full border px-3 py-1.5 text-sm font-semibold"
          style={{ backgroundColor: 'var(--accent-gold-faint)', borderColor: 'var(--accent-gold-border)', color: 'var(--accent-gold)' }}
        >{orders.length} pedidos</span>
      </div>

      <div>
        {orders.map((order) => {
          const draft = {
            status_pagamento: order.status_pagamento || 'pendente',
            status_pedido: order.status_pedido || 'novo',
            ...orderDrafts[order.id],
          };
          const expanded = String(expandedOrderId) === String(order.id);
          const orderItems = getOrderItems(order);
          return (
            <article
              key={order.id}
              className="p-5 sm:p-6"
              style={{ borderBottom: '1px solid var(--border-color)' }}
            >
              <div className="flex flex-col gap-5 xl:flex-row xl:items-center">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>Pedido #{order.codigo || order.numero || order.id}</h3>
                    <StatusPill status={draft.status_pagamento} />
                    <StatusPill status={draft.status_pedido} type="order" />
                  </div>
                  <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
                    <span>{getOrderCustomer(order)}</span>
                    <span>{formatDate(order.criado_em || order.created_at || order.data_criacao)}</span>
                    <span className="capitalize">{order.forma_pagamento || order.metodo_pagamento || 'Pagamento não informado'}</span>
                    <strong style={{ color: 'var(--accent-gold)', fontFamily: 'var(--font-display)' }}>{formatCurrency(order.total ?? order.valor_total ?? order.total_geral)}</strong>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:w-[410px]">
                  <label className="sr-only" htmlFor={`payment-${order.id}`}>Status do pagamento</label>
                  <select id={`payment-${order.id}`} value={draft.status_pagamento} onChange={(event) => onDraftChange(order, 'status_pagamento', event.target.value)} className="input py-2 text-sm">
                    {statusOptions(PAYMENT_STATUS_OPTIONS, draft.status_pagamento).map((status) => <option key={status.value} value={status.value}>{status.label}</option>)}
                  </select>
                  <label className="sr-only" htmlFor={`order-${order.id}`}>Status do pedido</label>
                  <select id={`order-${order.id}`} value={draft.status_pedido} onChange={(event) => onDraftChange(order, 'status_pedido', event.target.value)} className="input py-2 text-sm">
                    {statusOptions(ORDER_STATUS_OPTIONS, draft.status_pedido).map((status) => <option key={status.value} value={status.value}>{status.label}</option>)}
                  </select>
                </div>
                <div className="flex gap-2 xl:justify-end">
                  <button type="button" onClick={() => onExpandedChange(expanded ? null : order.id)} className="btn-secondary min-h-10 px-3 py-2" aria-expanded={expanded} aria-label={expanded ? 'Ocultar itens' : 'Ver itens'}><ControlIcon kind={expanded ? 'chevronUp' : 'chevronDown'} className="h-5 w-5" /></button>
                  <button type="button" onClick={() => onSave(order)} disabled={savingOrderId === order.id} className="btn-primary min-h-10 px-4 py-2 text-xs">
                    {savingOrderId === order.id ? <Spinner className="h-4 w-4" /> : 'Atualizar'}
                  </button>
                </div>
              </div>
              {expanded && (
                <div
                  className="mt-5 rounded-2xl border p-4"
                  style={{ backgroundColor: 'var(--bg-elevated-2)', borderColor: 'var(--accent-gold-border)' }}
                >
                  <p className="text-xs font-bold uppercase tracking-[0.16em]" style={{ color: 'var(--accent-gold)' }}>Itens do pedido</p>
                  <div className="mt-3 space-y-2">
                    {orderItems.map((item, index) => (
                      <div
                        key={`${item.id || item.item_id || item.nome}-${index}`}
                        className="flex flex-wrap items-center justify-between gap-2 rounded-xl border px-3 py-2.5 text-sm"
                        style={{ backgroundColor: 'var(--bg-elevated-1)', borderColor: 'var(--border-color)' }}
                      >
                        <span style={{ color: 'var(--text-primary)' }}>{item.nome || item.item_nome || item.produto_nome || 'Produto'}</span>
                        <span style={{ color: 'var(--text-secondary)' }}>{item.quantidade || 1} × {formatCurrency(item.preco_unitario ?? item.valor_unitario ?? item.preco)}</span>
                        <strong style={{ color: 'var(--accent-gold)', fontFamily: 'var(--font-display)' }}>{formatCurrency(item.subtotal ?? item.total ?? toNumber(item.quantidade || 1) * toNumber(item.preco_unitario ?? item.valor_unitario ?? item.preco))}</strong>
                      </div>
                    ))}
                    {orderItems.length === 0 && (
                      <p
                        className="rounded-xl border p-3 text-sm"
                        style={{ backgroundColor: 'var(--bg-elevated-1)', borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}
                      >Itens detalhados não disponíveis para este pedido.</p>
                    )}
                  </div>
                </div>
              )}
            </article>
          );
        })}
        {orders.length === 0 && <EmptyPanel icon="receipt" title="Nenhum pedido registrado" text="Os pedidos feitos no checkout aparecerão aqui para acompanhamento." />}
      </div>
    </section>
  );
}

function MetricCard({ label, value, detail, icon, accent = 'gold' }) {
  const accentStyles = {
    gold: {
      border: 'var(--accent-gold-border)',
      bg: 'var(--accent-gold-faint)',
      color: 'var(--accent-gold)',
      glow: 'var(--accent-gold-glow)',
    },
    amber: {
      border: 'rgba(245, 158, 11, 0.3)',
      bg: 'rgba(245, 158, 11, 0.08)',
      color: '#f59e0b',
      glow: 'rgba(245, 158, 11, 0.15)',
    },
    green: {
      border: 'rgba(16, 185, 129, 0.3)',
      bg: 'rgba(16, 185, 129, 0.08)',
      color: '#10b981',
      glow: 'rgba(16, 185, 129, 0.15)',
    },
  };
  const theme = accentStyles[accent] || accentStyles.gold;

  return (
    <div
      className="card p-5 group relative overflow-hidden transition-all duration-300"
      style={{
        backgroundColor: 'var(--bg-elevated-1)',
        borderColor: 'var(--border-color)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'var(--accent-gold-border)';
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.15), 0 0 16px var(--accent-gold-glow)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'var(--border-color)';
        e.currentTarget.style.transform = '';
        e.currentTarget.style.boxShadow = '';
      }}
    >
      {/* Decorative top gold stripe on hover */}
      <div
        className="absolute top-0 left-0 right-0 h-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{ background: 'linear-gradient(90deg, transparent, var(--accent-gold), transparent)' }}
      />
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>{label}</p>
          <p
            className="mt-2 truncate text-2xl font-extrabold tracking-tight"
            style={{
              fontFamily: 'var(--font-display)',
              color: 'var(--text-primary)',
            }}
          >
            {value}
          </p>
          <p className="mt-1 text-xs" style={{ color: 'var(--text-secondary)' }}>{detail}</p>
        </div>
        <span
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border transition-all duration-300"
          style={{
            backgroundColor: theme.bg,
            borderColor: theme.border,
            color: theme.color,
            boxShadow: `0 2px 10px ${theme.glow}`,
          }}
        >
          <ControlIcon kind={icon} className="h-5 w-5" />
        </span>
      </div>
    </div>
  );
}

function ActionShortcut({ icon, title, text, action }) {
  return (
    <button
      type="button"
      onClick={action}
      className="group flex w-full items-center gap-3.5 rounded-xl border p-4 text-left transition-all duration-200"
      style={{
        backgroundColor: 'var(--bg-elevated-2)',
        borderColor: 'var(--border-color)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'var(--accent-gold-border)';
        e.currentTarget.style.backgroundColor = 'var(--bg-hover)';
        e.currentTarget.style.transform = 'translateY(-1px)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'var(--border-color)';
        e.currentTarget.style.backgroundColor = 'var(--bg-elevated-2)';
        e.currentTarget.style.transform = '';
      }}
    >
      <span
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition-colors"
        style={{
          backgroundColor: 'var(--accent-gold-faint)',
          borderColor: 'var(--accent-gold-border)',
          color: 'var(--accent-gold)',
        }}
      >
        <ControlIcon kind={icon} className="h-5 w-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{title}</span>
        <span className="mt-0.5 block text-xs" style={{ color: 'var(--text-secondary)' }}>{text}</span>
      </span>
      <ControlIcon kind="chevron" className="h-4 w-4 transition-transform group-hover:translate-x-1" style={{ color: 'var(--accent-gold)' }} />
    </button>
  );
}

function StatusPill({ status, type = 'payment' }) {
  const normalized = normalizeStatus(status);
  const classes = normalized === 'confirmado' || normalized === 'aprovado' || normalized === 'pago' || normalized === 'concluido'
    ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300'
    : normalized === 'recusado' || normalized === 'cancelado' || normalized === 'falhou' || normalized === 'estornado'
      ? 'border-red-400/30 bg-red-400/10 text-red-300'
      : normalized === 'processando'
        ? 'border-sky-400/30 bg-sky-400/10 text-sky-300'
        : 'border-amber-400/30 bg-amber-400/10 text-amber-300';
  return <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${classes}`}>{formatStatus(status, type)}</span>;
}

function EmptyPanel({ icon, title, text, actionLabel, onAction }) {
  return (
    <div className="flex flex-col items-center justify-center p-10 text-center animate-fade-in">
      <span
        className="flex h-14 w-14 items-center justify-center rounded-2xl border"
        style={{
          backgroundColor: 'var(--accent-gold-faint)',
          borderColor: 'var(--accent-gold-border)',
          color: 'var(--accent-gold)',
          boxShadow: '0 4px 16px rgba(212,175,55,0.08)',
        }}
      >
        <ControlIcon kind={icon} className="h-7 w-7" />
      </span>
      <h3 className="mt-4 font-bold text-base" style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>{title}</h3>
      <p className="mt-1 max-w-sm text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{text}</p>
      {actionLabel && <button type="button" onClick={onAction} className="btn-primary mt-5 text-xs">{actionLabel}</button>}
    </div>
  );
}

function AccessDenied() {
  return (
    <div className="card mx-auto max-w-xl p-8 text-center" style={{ backgroundColor: 'var(--bg-elevated-1)', borderColor: 'var(--border-color)' }}>
      <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-400/10 border border-red-400/20 text-red-300"><ControlIcon kind="shield" className="h-7 w-7" /></span>
      <h1 className="mt-5 text-2xl font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>Acesso administrativo necessário</h1>
      <p className="mt-2 text-sm" style={{ color: 'var(--text-secondary)' }}>Este centro de controle está disponível apenas para administradores.</p>
    </div>
  );
}

function ControlCenterSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-44 rounded-3xl border" style={{ backgroundColor: 'var(--bg-elevated-1)', borderColor: 'var(--border-color)' }} />
      <div className="h-14 rounded-2xl border" style={{ backgroundColor: 'var(--bg-elevated-1)', borderColor: 'var(--border-color)' }} />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((index) => <div key={index} className="h-32 rounded-2xl border" style={{ backgroundColor: 'var(--bg-elevated-1)', borderColor: 'var(--border-color)' }} />)}
      </div>
      <div className="h-96 rounded-2xl border" style={{ backgroundColor: 'var(--bg-elevated-1)', borderColor: 'var(--border-color)' }} />
    </div>
  );
}

function Spinner({ className = '' }) {
  return <svg className={`animate-spin ${className}`} viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle className="opacity-25" cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" /><path className="opacity-75" fill="currentColor" d="M12 3a9 9 0 0 0-9 9h3a6 6 0 0 1 6-6V3Z" /></svg>;
}

function ControlIcon({ kind, className = '' }) {
  const common = { className, fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24', 'aria-hidden': true };
  const paths = {
    chart: <><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 19V5m0 14h16M8 16v-4m4 4V8m4 8v-6" /></>,
    shield: <><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m12 3 8 3v5c0 5-3.4 8.9-8 10-4.6-1.1-8-5-8-10V6l8-3Z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m9 12 2 2 4-4" /></>,
    box: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m20 7-8-4-8 4m16 0-8 4m8-4v10l-8 4m0-10L4 7m8 4v10" />,
    receipt: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3h14v18l-3-2-4 2-4-2-3 2V3Zm4 5h6m-6 4h6" />,
    users: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2m16-10a4 4 0 1 0 0-8m4 18v-2a4 4 0 0 0-3-3.87M12 7a4 4 0 1 0-8 0 4 4 0 0 0 8 0Z" />,
    refresh: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h5M20 20v-5h-5M5.8 18.2A8 8 0 0 0 19 15M18.2 5.8A8 8 0 0 0 5 9" />,
    search: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m21 21-4.35-4.35m1.35-5.15a6.5 6.5 0 1 1-13 0 6.5 6.5 0 0 1 13 0Z" />,
    chevron: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m9 5 7 7-7 7" />,
    chevronDown: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m6 9 6 6 6-6" />,
    chevronUp: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m18 15-6-6-6 6" />,
    check: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m5 12 4 4L19 6" />,
    plus: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 5v14m7-7H5" />,
    edit: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L8 18l-4 1 1-4L16.5 3.5Z" />,
    trash: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 7h16m-10 4v6m4-6v6M9 7V4h6v3m-9 0 1 14h10l1-14" />,
    cart: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4h2l2.4 11.1a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 1.9-1.4L21 8H7m3 12a1 1 0 1 1-2 0 1 1 0 0 1 2 0Zm9 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z" />,
    user: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 21a8 8 0 0 0-16 0m12-14a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z" />,
    map: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l5.447 2.724A1 1 0 0021 18.818V8.045a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />,
    lock: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2zm10-10V7a4 4 0 0 0-8 0v4h8z" />,
    clock: <><circle cx="12" cy="12" r="9" strokeWidth="2" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 7v5l3 2" /></>,
  };
  return <svg {...common}>{paths[kind] || paths.chart}</svg>;
}

function normalizePages(payload) {
  const source = extractCollection(payload, 'pages');
  if (!source.length) return FALLBACK_PAGES;
  return source.map((entry) => {
    const fallback = FALLBACK_PAGES.find((page) => page.key === (entry?.key || entry));
    if (typeof entry === 'string') return fallback || { key: entry, label: titleCase(entry), path: `/${entry}`, roles: ['admin'] };
    return {
      key: entry.key || entry.id || entry.slug,
      label: entry.label || entry.nome || fallback?.label || titleCase(entry.key || entry.id || 'Página'),
      path: entry.path || entry.rota || fallback?.path || `/${entry.key || entry.id}`,
      roles: asArray(entry.roles || entry.allowedRoles || entry.niveis_acesso || fallback?.roles),
      defaultPermissions: entry.defaultPermissions || entry.default_permissions || {},
    };
  }).filter((page) => page.key);
}

function extractCollection(payload, key) {
  if (Array.isArray(payload)) return payload;
  const direct = payload?.[key];
  if (Array.isArray(direct)) return direct;
  const nested = payload?.data?.[key];
  if (Array.isArray(nested)) return nested;
  return [];
}

function asArray(value) {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') return value.split(',').map((item) => item.trim()).filter(Boolean);
  return [];
}

function buildDefaultPermissions(role, pageList) {
  return pageList.reduce((permissions, page) => {
    const configured = page.defaultPermissions?.[role];
    permissions[page.key] = typeof configured === 'boolean'
      ? configured
      : pageIsVisibleForRole(page, role, []);
    return permissions;
  }, {});
}

function pageIsVisibleForRole(page, role, roleViews) {
  if (typeof page.defaultPermissions?.[role] === 'boolean') return page.defaultPermissions[role];
  if (page.roles?.length) return page.roles.includes(role);
  const roleView = asArray(roleViews).find((view) => view?.role === role || view?.key === role || view?.nivel_acesso === role);
  const rolePages = asArray(roleView?.pages || roleView?.pageKeys || roleView?.routes);
  if (rolePages.length) return rolePages.some((value) => value === page.key || value === page.path);
  return role === 'admin';
}

function isUserActive(targetUser) {
  const value = targetUser?.ativo ?? targetUser?.active ?? targetUser?.status;
  return ![false, 0, '0', 'bloqueado', 'blocked', 'inativo', 'inactive'].includes(value);
}

function normalizeProductForm(data) {
  return {
    ...data,
    estoque: Number(data.estoque ?? 0),
    valor_venda: data.valor_venda === '' || data.valor_venda == null ? 0 : Number(data.valor_venda),
    valor_aluguel_mensal: data.valor_aluguel_mensal === '' || data.valor_aluguel_mensal == null ? 0 : Number(data.valor_aluguel_mensal),
  };
}

function getOrderItems(order) {
  const raw = order.itens || order.items || order.produtos || [];
  if (Array.isArray(raw)) return raw;
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

function getOrderCustomer(order) {
  return order.usuario_nome || order.cliente_nome || order.customer_name || order.user_name || order.usuario_email || order.cliente_email || 'Cliente não identificado';
}

function statusOptions(options, currentValue) {
  return options.some((option) => option.value === currentValue)
    ? options
    : [{ value: currentValue, label: formatStatus(currentValue) }, ...options];
}

function formatStatus(value, type) {
  const fallback = type === 'order' ? 'Novo' : 'Pendente';
  if (!value) return fallback;
  return String(value).replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function normalizeStatus(value) {
  return String(value || '').toLowerCase().trim().replaceAll(' ', '_');
}

function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(toNumber(value));
}

function formatDate(value) {
  if (!value) return 'Data não informada';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}

function toNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function initials(name) {
  return String(name || 'U').trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase();
}

function titleCase(value) {
  return String(value).replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function getPageIcon(key) {
  if (['carrinho', 'checkout'].includes(key)) return 'cart';
  if (['usuarios', 'admin'].includes(key)) return key === 'admin' ? 'shield' : 'users';
  if (['itens', 'produtos'].includes(key)) return 'box';
  if (['pedidos'].includes(key)) return 'receipt';
  if (['perfil'].includes(key)) return 'user';
  return 'chart';
}

/**
 * Badge amigável do status da conta, considerando o novo campo status_conta
 * mantido em sincronia com o flag `ativo`. Se o backend ainda não enviar
 * status_conta (contas antigas), caímos no heurístico anterior.
 */
function statusContaPill(targetUser) {
  const status = targetUser?.status_conta;
  if (status === 'desativada') {
    return { label: 'Desativada', className: 'border-red-400/25 bg-red-400/10 text-red-300', dotClass: 'bg-red-400' };
  }
  if (status === 'bloqueado_inatividade') {
    return { label: 'Bloqueada (inatividade)', className: 'border-orange-400/25 bg-orange-400/10 text-orange-300', dotClass: 'bg-orange-400' };
  }
  if (status === 'aviso_inatividade') {
    return { label: 'Aviso de inatividade', className: 'border-amber-400/25 bg-amber-400/10 text-amber-300', dotClass: 'bg-amber-400' };
  }
  if (status === 'ativo') {
    return { label: 'Ativa', className: 'border-emerald-400/25 bg-emerald-400/8 text-emerald-300', dotClass: 'bg-emerald-400' };
  }
  const active = isUserActive(targetUser);
  return active
    ? { label: 'Ativa', className: 'border-emerald-400/25 bg-emerald-400/8 text-emerald-300', dotClass: 'bg-emerald-400' }
    : { label: 'Bloqueada', className: 'border-red-400/25 bg-red-400/8 text-red-300', dotClass: 'bg-red-400' };
}

/* ─── USER EVENTS PANEL (auditoria rápida de uma conta) ─── */
function UserEventsPanel({ user, events, loading }) {
  return (
    <section
      className="mt-4 border-t pt-5"
      style={{ borderColor: 'var(--border-color)' }}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em]" style={{ color: 'var(--accent-gold)' }}>
            Auditoria
          </p>
          <h3 className="mt-1 text-sm font-semibold" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>
            Histórico recente de {user?.nome || 'usuário'}
          </h3>
          <p className="mt-1 text-xs" style={{ color: 'var(--text-secondary)' }}>
            Pedidos, pagamentos, aluguéis e demais eventos vinculados a esta conta (inclusive histórico recuperado).
          </p>
        </div>
        {loading && <Spinner className="h-5 w-5" />}
      </div>
      {!loading && (events?.length ?? 0) === 0 ? (
        <p className="mt-3 rounded-xl border border-dark-border bg-dark-hover/30 p-3 text-xs" style={{ color: 'var(--text-secondary)' }}>
          Nenhum evento registrado ainda.
        </p>
      ) : (
        <ul className="mt-3 max-h-64 space-y-2 overflow-y-auto pr-1">
          {(events ?? []).slice(0, 30).map((event) => (
            <li
              key={event.id ?? `${event.tipo_evento}-${event.criado_em}`}
              className="flex items-start gap-3 rounded-xl border p-3"
              style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-elevated-2)' }}
            >
              <span className="mt-1 h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: 'var(--accent-gold)' }} aria-hidden="true" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold capitalize" style={{ color: 'var(--text-primary)' }}>
                  {(event.tipo_evento || event.tipo || 'evento').replace(/_/g, ' ')}
                </p>
                {event.descricao && (
                  <p className="mt-0.5 text-xs" style={{ color: 'var(--text-secondary)' }}>{event.descricao}</p>
                )}
                <p className="mt-1 text-[10px] uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
                  {formatDate(event.criado_em || event.data)}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/* ─── RENTALS SECTION (Aluguéis) ─── */
function RentalsSection({ rentals, loading, statusFilter, onStatusFilterChange, updatingRetiradaId, onRetiradaUpdate }) {
  return (
    <div className="space-y-5" role="tabpanel">
      <div
        className="card flex flex-col gap-3 p-5 sm:flex-row sm:items-end sm:justify-between"
        style={{ backgroundColor: 'var(--bg-elevated-1)', borderColor: 'var(--border-color)' }}
      >
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em]" style={{ color: 'var(--accent-gold)' }}>
            Operação de aluguéis
          </p>
          <h2 className="mt-1 text-lg font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>
            Acompanhe prazos, excedentes e retiradas
          </h2>
          <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
            Aluguéis vencidos, itens aguardando retirada e devoluções em um só lugar.
          </p>
        </div>
        <label className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
          <span>Status</span>
          <select
            value={statusFilter || ''}
            onChange={(e) => onStatusFilterChange(e.target.value)}
            className="input py-1.5 text-sm"
            aria-label="Filtrar aluguéis por status"
          >
            {ALUGUEL_STATUS_OPTIONS.map((opt) => (
              <option key={opt.value || 'todos'} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </label>
      </div>

      <div className="card overflow-hidden" style={{ backgroundColor: 'var(--bg-elevated-1)', borderColor: 'var(--border-color)' }}>
        {loading ? (
          <div className="flex items-center justify-center gap-3 p-8" style={{ color: 'var(--text-secondary)' }}>
            <Spinner className="h-6 w-6" />
            <span>Carregando aluguéis…</span>
          </div>
        ) : (rentals?.length ?? 0) === 0 ? (
          <EmptyPanel icon="clock" title="Nenhum aluguel nesta visualização" text="Ajuste o filtro de status acima para ver outras fases." />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead
                className="border-b uppercase tracking-wider text-xs"
                style={{ borderColor: 'var(--border-color)', color: 'var(--text-muted)' }}
              >
                <tr>
                  <th className="p-4 text-left">Item</th>
                  <th className="p-4 text-left">Cliente</th>
                  <th className="p-4 text-left">Status</th>
                  <th className="p-4 text-left">Prazo</th>
                  <th className="p-4 text-left">Excedente</th>
                  <th className="p-4 text-left">Retirada</th>
                  <th className="p-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {rentals.map((r) => (
                  <RentalRow
                    key={r.id}
                    rental={r}
                    updatingRetiradaId={updatingRetiradaId}
                    onRetiradaUpdate={onRetiradaUpdate}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function RentalRow({ rental, updatingRetiradaId, onRetiradaUpdate }) {
  const vencido = rental.status === 'vencido';
  const regularizadoAguardandoDevolucao = rental.status === 'regularizado' && rental.status_retirada !== 'realizada';
  const diasExcedentes = Number(rental.dias_excedentes ?? rental.dias_excedentes_calculados ?? 0);
  const isUpdating = String(updatingRetiradaId ?? '') === String(rental.id);

  return (
    <tr
      className="border-b"
      style={{
        borderColor: 'var(--border-color)',
        backgroundColor: vencido ? 'rgba(239,68,68,0.06)' : regularizadoAguardandoDevolucao ? 'rgba(245,158,11,0.05)' : 'transparent',
      }}
    >
      <td className="p-4">
        <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>{rental.item_nome || `Item #${rental.item_id}`}</p>
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Aluguel #{rental.id} · Pedido #{rental.pedido_id ?? '—'}</p>
      </td>
      <td className="p-4">
        <p style={{ color: 'var(--text-primary)' }}>{rental.usuario_nome || '—'}</p>
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{rental.usuario_email || ''}</p>
      </td>
      <td className="p-4">
        <RentalStatusPill status={rental.status} />
      </td>
      <td className="p-4">
        <p style={{ color: 'var(--text-primary)' }}>
          {rental.data_inicio ? formatDate(rental.data_inicio) : '—'}
          {' → '}
          {rental.data_prevista_devolucao ? formatDate(rental.data_prevista_devolucao) : '—'}
        </p>
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{rental.dias_aluguel ?? '—'} dias · Qtd {rental.quantidade ?? 1}</p>
      </td>
      <td className="p-4">
        {diasExcedentes > 0 ? (
          <div>
            <p className="font-semibold" style={{ color: '#f87171' }}>{diasExcedentes} {diasExcedentes === 1 ? 'dia' : 'dias'}</p>
            {rental.valor_excedente && (
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{formatCurrency(rental.valor_excedente)}</p>
            )}
          </div>
        ) : (
          <span style={{ color: 'var(--text-muted)' }}>—</span>
        )}
      </td>
      <td className="p-4">
        <RetiradaPill status={rental.status_retirada || 'nenhum'} />
      </td>
      <td className="p-4 text-right">
        <label className="inline-flex items-center gap-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
          <span className="sr-only sm:not-sr-only">Retirada:</span>
          <select
            value={rental.status_retirada || 'pendente'}
            onChange={(e) => onRetiradaUpdate(rental, e.target.value)}
            disabled={isUpdating || rental.status === 'cancelado'}
            className="input py-1 text-xs"
            aria-label={`Atualizar retirada do aluguel ${rental.id}`}
          >
            {RETIRADA_STATUS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </label>
      </td>
    </tr>
  );
}

function RentalStatusPill({ status }) {
  const map = {
    aguardando_pagamento: 'border-nexus-400/30 bg-nexus-500/10 text-nexus-200',
    ativo: 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200',
    vencido: 'border-red-400/30 bg-red-400/10 text-red-200',
    regularizado: 'border-amber-400/30 bg-amber-400/10 text-amber-200',
    devolvido: 'border-sky-400/30 bg-sky-400/10 text-sky-200',
    cancelado: 'border-zinc-400/30 bg-zinc-400/10 text-zinc-200',
  };
  return (
    <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${map[status] || map.cancelado}`}>
      {String(status || '—').replace(/_/g, ' ')}
    </span>
  );
}

function RetiradaPill({ status }) {
  const map = {
    pendente: 'border-zinc-400/30 bg-zinc-400/10 text-zinc-200',
    agendada: 'border-sky-400/30 bg-sky-400/10 text-sky-200',
    realizada: 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200',
    nenhum: 'border-zinc-400/25 bg-zinc-400/5 text-zinc-300',
  };
  return (
    <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${map[status] || map.nenhum}`}>
      {String(status || 'nenhum').replace(/_/g, ' ')}
    </span>
  );
}
