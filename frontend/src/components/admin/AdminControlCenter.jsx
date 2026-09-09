import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useModal } from '../../contexts/ModalContext';
import { itemService, userService } from '../../services/services';
import { adminService } from '../../services/adminService';
import { isRootAdmin } from '../../utils/access';
import ItemFormModal from '../dashboard/ItemFormModal';

const ROLE_META = {
  cliente: {
    label: 'Cliente',
    description: 'Experiência de compra e acompanhamento de pedidos',
    className: 'border-sky-400/30 bg-sky-400/10 text-sky-200',
  },
  funcionario: {
    label: 'Funcionário',
    description: 'Operação do catálogo e atendimento',
    className: 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200',
  },
  admin: {
    label: 'Administrador',
    description: 'Visão global e gestão completa do Nexus',
    className: 'border-nexus-400/40 bg-nexus-500/15 text-nexus-200',
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

const TABS = [
  { key: 'visao-geral', label: 'Visão geral', icon: 'chart' },
  { key: 'acessos', label: 'Acessos', icon: 'shield' },
  { key: 'produtos', label: 'Produtos', icon: 'box' },
  { key: 'pedidos', label: 'Pedidos', icon: 'receipt' },
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

  if (!isAdmin) {
    return <AccessDenied />;
  }

  if (loading) {
    return <ControlCenterSkeleton />;
  }

  return (
    <div className="space-y-6 animate-fade-in pb-4">
      <section className="relative overflow-hidden rounded-3xl border border-nexus-500/25 bg-dark-card p-6 shadow-glass-lg sm:p-8">
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-nexus-500/10 blur-3xl" />
        <div className="relative flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-nexus-400">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-nexus-400/30 bg-nexus-500/10">
                <ControlIcon kind="shield" className="h-4 w-4" />
              </span>
              Operação protegida
            </div>
            <h1 className="font-display text-3xl font-bold text-white sm:text-4xl">Admin Control Center</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-nexus-300 sm:text-base">
              Controle os acessos, catálogo e pedidos do Nexus com uma visão única da operação.
            </p>
          </div>
          <button type="button" onClick={() => loadControlData(true)} className="btn-secondary self-start xl:self-auto">
            <ControlIcon kind="refresh" className="mr-2 h-5 w-5" />
            Atualizar dados
          </button>
        </div>
      </section>

      <nav className="glass flex max-w-full gap-1 overflow-x-auto rounded-2xl p-2" aria-label="Seções administrativas" role="tablist">
        {TABS.map((tab) => {
          const active = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setActiveTab(tab.key)}
              className={`flex min-h-11 shrink-0 items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all ${
                active
                  ? 'bg-nexus-600 text-white shadow-champagne'
                  : 'text-nexus-300 hover:bg-dark-hover hover:text-white'
              }`}
            >
              <ControlIcon kind={tab.icon} className="h-4 w-4" />
              {tab.label}
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
          users={filteredUsers}
          selectedUser={selectedUser}
          permissionDraft={permissionDraft}
          loadingPermissions={loadingPermissions}
          savingPermissions={savingPermissions}
          userSearch={userSearch}
          onUserSearchChange={setUserSearch}
          onUserSelect={setSelectedUserId}
          onDraftChange={setPermissionDraft}
          onRoleChange={handleRoleChange}
          onSave={handlePermissionSave}
        />
      )}

      {activeTab === 'produtos' && (
        <ProductsSection
          items={items}
          deletingProductId={deletingProductId}
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
        <section className="card p-6 xl:col-span-3">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-nexus-400">Pré-visualização por perfil</p>
              <h2 className="mt-2 text-xl font-semibold text-white">Rotas visíveis na experiência</h2>
              <p className="mt-1 text-sm text-nexus-400">Confira o que cada perfil pode encontrar na navegação.</p>
            </div>
            <div className="flex flex-wrap gap-2" aria-label="Alternar perfil visualizado">
              {Object.entries(ROLE_META).map(([role, meta]) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => onPreviewRoleChange(role)}
                  aria-pressed={previewRole === role}
                  className={`min-h-10 rounded-xl border px-3 text-sm font-medium transition-all ${
                    previewRole === role ? meta.className : 'border-dark-border bg-dark-hover text-nexus-300 hover:text-white'
                  }`}
                >
                  {meta.label}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-dark-border bg-dark-bg/60 p-4 sm:p-5">
            <div className="flex flex-wrap items-center gap-3 border-b border-dark-border pb-4">
              <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${ROLE_META[previewRole].className}`}>
                Interface {ROLE_META[previewRole].label}
              </span>
              <span className="text-sm text-nexus-400">{visiblePages.length} páginas liberadas</span>
            </div>
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {visiblePages.map((page) => (
                <div key={page.key} className="flex items-center gap-3 rounded-xl border border-dark-border bg-dark-card/80 p-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-nexus-500/10 text-nexus-300">
                    <ControlIcon kind={getPageIcon(page.key)} className="h-4 w-4" />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium text-white">{page.label}</span>
                    <span className="block truncate text-xs text-nexus-400">{page.path || `/${page.key}`}</span>
                  </span>
                  <span className="ml-auto h-2 w-2 rounded-full bg-emerald-400" aria-label="Liberada" />
                </div>
              ))}
              {visiblePages.length === 0 && (
                <p className="col-span-full rounded-xl border border-dashed border-dark-border p-6 text-center text-sm text-nexus-400">Nenhuma página liberada para este perfil.</p>
              )}
            </div>
          </div>
        </section>

        <section className="card p-6 xl:col-span-2">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-nexus-400">Atalhos operacionais</p>
          <h2 className="mt-2 text-xl font-semibold text-white">Ações prioritárias</h2>
          <div className="mt-5 space-y-3">
            <ActionShortcut icon="shield" title="Revisar acessos" text="Ajuste funções, bloqueios e permissões por página." action={() => onNavigate('acessos')} />
            <ActionShortcut icon="box" title="Atualizar catálogo" text="Cadastre ou ajuste produtos disponíveis no carrinho." action={() => onNavigate('produtos')} />
            <ActionShortcut icon="receipt" title="Acompanhar pagamentos" text="Monitore cada pedido e atualize o status de cobrança." action={() => onNavigate('pedidos')} />
          </div>
        </section>
      </div>

      <section className="card overflow-hidden">
        <div className="flex flex-col gap-2 border-b border-dark-border p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-white">Mapa de rotas do sistema</h2>
            <p className="mt-1 text-sm text-nexus-400">Fonte de verdade para permissões e navegação.</p>
          </div>
          <span className="text-sm text-nexus-400">{pages.length} rotas mapeadas</span>
        </div>
        <div className="grid grid-cols-1 divide-y divide-dark-border md:grid-cols-2 md:divide-x md:divide-y-0 xl:grid-cols-4">
          {pages.map((page) => (
            <div key={page.key} className="p-5">
              <div className="flex items-start justify-between gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-nexus-500/10 text-nexus-300">
                  <ControlIcon kind={getPageIcon(page.key)} className="h-5 w-5" />
                </span>
                <span className="rounded-full border border-dark-border bg-dark-hover px-2 py-1 text-[11px] text-nexus-400">{page.path || `/${page.key}`}</span>
              </div>
              <p className="mt-4 font-medium text-white">{page.label}</p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {Object.entries(ROLE_META).map(([role, meta]) => {
                  const allowed = pageIsVisibleForRole(page, role, roleViews);
                  return (
                    <span key={role} className={`rounded-full px-2 py-1 text-[11px] ${allowed ? meta.className : 'bg-dark-hover text-nexus-500'}`}>
                      {meta.label}
                    </span>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function AccessSection({ pages, users, selectedUser, permissionDraft, loadingPermissions, savingPermissions, userSearch, onUserSearchChange, onUserSelect, onDraftChange, onRoleChange, onSave }) {
  const rootUser = selectedUser && isRootAdmin(selectedUser);

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-5" role="tabpanel">
      <section className="card xl:col-span-2">
        <div className="border-b border-dark-border p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-nexus-400">Diretório de acesso</p>
          <h2 className="mt-2 text-xl font-semibold text-white">Usuários</h2>
          <label className="relative mt-4 block">
            <span className="sr-only">Buscar usuário</span>
            <ControlIcon kind="search" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-nexus-400" />
            <input
              value={userSearch}
              onChange={(event) => onUserSearchChange(event.target.value)}
              className="input py-2 pl-10 text-sm"
              placeholder="Buscar nome ou e-mail"
            />
          </label>
        </div>
        <div className="max-h-[620px] divide-y divide-dark-border overflow-y-auto">
          {users.map((targetUser) => {
            const selected = String(selectedUser?.id) === String(targetUser.id);
            const role = ROLE_META[targetUser.nivel_acesso] || ROLE_META.cliente;
            return (
              <button
                key={targetUser.id}
                type="button"
                onClick={() => onUserSelect(targetUser.id)}
                className={`flex w-full items-center gap-3 p-4 text-left transition-colors ${selected ? 'bg-nexus-500/10' : 'hover:bg-dark-hover'}`}
              >
                <span className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-dark-hover text-sm font-semibold text-nexus-200">
                  {initials(targetUser.nome)}
                  <span className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-dark-card ${isUserActive(targetUser) ? 'bg-emerald-400' : 'bg-red-400'}`} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium text-white">{targetUser.nome || 'Usuário sem nome'}</span>
                  <span className="block truncate text-xs text-nexus-400">{targetUser.email}</span>
                  <span className={`mt-1 inline-flex rounded-full border px-2 py-0.5 text-[11px] ${role.className}`}>{role.label}</span>
                </span>
                <ControlIcon kind="chevron" className={`h-4 w-4 shrink-0 transition-transform ${selected ? 'rotate-90 text-nexus-300' : 'text-nexus-500'}`} />
              </button>
            );
          })}
          {users.length === 0 && <p className="p-8 text-center text-sm text-nexus-400">Nenhum usuário encontrado.</p>}
        </div>
      </section>

      <section className="card p-5 sm:p-6 xl:col-span-3">
        {!selectedUser ? (
          <div className="flex min-h-[360px] flex-col items-center justify-center text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-nexus-500/10 text-nexus-300"><ControlIcon kind="users" className="h-7 w-7" /></span>
            <p className="mt-4 font-medium text-white">Selecione um usuário</p>
            <p className="mt-1 text-sm text-nexus-400">Escolha uma pessoa para editar os acessos.</p>
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-4 border-b border-dark-border pb-5 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-center gap-3">
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-nexus-500/10 text-base font-semibold text-nexus-200">{initials(selectedUser.nome)}</span>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-xl font-semibold text-white">{selectedUser.nome}</h2>
                    {rootUser && <span className="rounded-full border border-nexus-400/40 bg-nexus-500/10 px-2 py-0.5 text-[11px] font-semibold text-nexus-200">Administrador raiz</span>}
                  </div>
                  <p className="text-sm text-nexus-400">{selectedUser.email}</p>
                </div>
              </div>
              <span className={`inline-flex w-fit items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold ${permissionDraft.active ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200' : 'border-red-400/30 bg-red-400/10 text-red-200'}`}>
                <span className={`h-2 w-2 rounded-full ${permissionDraft.active ? 'bg-emerald-400' : 'bg-red-400'}`} />
                {permissionDraft.active ? 'Acesso liberado' : 'Acesso bloqueado'}
              </span>
            </div>

            {rootUser ? (
              <div className="mt-6 rounded-2xl border border-nexus-400/25 bg-nexus-500/10 p-5 text-sm text-nexus-200">
                Este é o administrador raiz do sistema. Suas permissões permanecem protegidas.
              </div>
            ) : (
              <>
                <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <label>
                    <span className="label">Nível de acesso</span>
                    <select value={permissionDraft.role} onChange={(event) => onRoleChange(event.target.value)} className="input">
                      {Object.entries(ROLE_META).map(([role, meta]) => <option key={role} value={role}>{meta.label}</option>)}
                    </select>
                  </label>
                  <div>
                    <span className="label">Status da conta</span>
                    <label className="flex min-h-[50px] cursor-pointer items-center justify-between rounded-xl border border-dark-border bg-dark-hover px-4">
                      <span>
                        <span className="block text-sm font-medium text-white">{permissionDraft.active ? 'Conta liberada' : 'Conta bloqueada'}</span>
                        <span className="block text-xs text-nexus-400">Bloqueia toda a navegação</span>
                      </span>
                      <input
                        type="checkbox"
                        checked={permissionDraft.active}
                        onChange={(event) => onDraftChange((current) => ({ ...current, active: event.target.checked }))}
                        className="h-5 w-5 accent-nexus-500"
                      />
                    </label>
                  </div>
                </div>

                <div className="mt-7">
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                      <span className="label mb-0">Permissões de navegação</span>
                      <p className="mt-1 text-sm text-nexus-400">Desative uma página para removê-la da experiência deste usuário.</p>
                    </div>
                    {loadingPermissions && <span className="text-xs text-nexus-400">Carregando permissões…</span>}
                  </div>
                  <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
                    {pages.map((page) => {
                      const enabled = permissionDraft.permissions?.[page.key] !== false;
                      return (
                        <label key={page.key} className="flex cursor-pointer items-center gap-3 rounded-xl border border-dark-border bg-dark-hover p-4 transition-colors hover:border-nexus-500/40">
                          <input
                            type="checkbox"
                            checked={enabled}
                            onChange={(event) => onDraftChange((current) => ({
                              ...current,
                              permissions: { ...current.permissions, [page.key]: event.target.checked },
                            }))}
                            className="h-5 w-5 shrink-0 accent-nexus-500"
                          />
                          <span className="flex min-w-0 flex-1 items-center gap-3">
                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-dark-card text-nexus-300"><ControlIcon kind={getPageIcon(page.key)} className="h-4 w-4" /></span>
                            <span className="min-w-0"><span className="block truncate text-sm font-medium text-white">{page.label}</span><span className="block truncate text-xs text-nexus-400">{page.path || `/${page.key}`}</span></span>
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div className="mt-7 flex flex-col-reverse gap-3 border-t border-dark-border pt-5 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-xs text-nexus-500">As alterações são registradas imediatamente no servidor.</p>
                  <button type="button" onClick={onSave} disabled={savingPermissions || loadingPermissions} className="btn-primary">
                    {savingPermissions ? <><Spinner className="mr-2 h-4 w-4" />Salvando…</> : <><ControlIcon kind="check" className="mr-2 h-5 w-5" />Salvar acessos</>}
                  </button>
                </div>
              </>
            )}
          </>
        )}
      </section>
    </div>
  );
}

function ProductsSection({ items, deletingProductId, onCreate, onEdit, onDelete }) {
  return (
    <section className="card" role="tabpanel">
      <div className="flex flex-col gap-4 border-b border-dark-border p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-nexus-400">Catálogo do carrinho</p>
          <h2 className="mt-2 text-xl font-semibold text-white">Produtos e estoque</h2>
          <p className="mt-1 text-sm text-nexus-400">{items.length} produtos cadastrados para venda.</p>
        </div>
        <button type="button" onClick={onCreate} className="btn-primary self-start sm:self-auto"><ControlIcon kind="plus" className="mr-2 h-5 w-5" />Novo produto</button>
      </div>

      <div className="divide-y divide-dark-border">
        {items.map((product) => (
          <article key={product.id} className="flex flex-col gap-4 p-5 transition-colors hover:bg-dark-hover/60 sm:flex-row sm:items-center sm:p-6">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-nexus-400/20 bg-nexus-500/10 text-nexus-300"><ControlIcon kind="box" className="h-6 w-6" /></span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="truncate font-semibold text-white">{product.nome}</h3>
                {product.categoria && <span className="rounded-full bg-dark-card px-2 py-1 text-[11px] text-nexus-400">{product.categoria}</span>}
              </div>
              {product.descricao && <p className="mt-1 line-clamp-2 text-sm text-nexus-400">{product.descricao}</p>}
              <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm">
                <span className="font-semibold text-nexus-200">{formatCurrency(product.valor_venda)}</span>
                <span className={toNumber(product.estoque) > 0 ? 'text-emerald-300' : 'text-red-300'}>Estoque: {product.estoque ?? 0}</span>
                {product.criador_nome && <span className="text-nexus-500">Por {product.criador_nome}</span>}
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
        {items.length === 0 && <EmptyPanel icon="box" title="Catálogo vazio" text="Crie o primeiro produto para disponibilizá-lo no carrinho." actionLabel="Novo produto" onAction={onCreate} />}
      </div>
    </section>
  );
}

function OrdersSection({ orders, orderDrafts, savingOrderId, expandedOrderId, onDraftChange, onSave, onExpandedChange }) {
  return (
    <section className="card" role="tabpanel">
      <div className="flex flex-col gap-2 border-b border-dark-border p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-nexus-400">Operação financeira</p>
          <h2 className="mt-2 text-xl font-semibold text-white">Pedidos e pagamentos</h2>
          <p className="mt-1 text-sm text-nexus-400">Monitore a cobrança e o processamento de cada compra.</p>
        </div>
        <span className="w-fit rounded-full border border-dark-border bg-dark-hover px-3 py-1.5 text-sm text-nexus-300">{orders.length} pedidos</span>
      </div>

      <div className="divide-y divide-dark-border">
        {orders.map((order) => {
          const draft = {
            status_pagamento: order.status_pagamento || 'pendente',
            status_pedido: order.status_pedido || 'novo',
            ...orderDrafts[order.id],
          };
          const expanded = String(expandedOrderId) === String(order.id);
          const orderItems = getOrderItems(order);
          return (
            <article key={order.id} className="p-5 sm:p-6">
              <div className="flex flex-col gap-5 xl:flex-row xl:items-center">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold text-white">Pedido #{order.codigo || order.numero || order.id}</h3>
                    <StatusPill status={draft.status_pagamento} />
                    <StatusPill status={draft.status_pedido} type="order" />
                  </div>
                  <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm text-nexus-400">
                    <span>{getOrderCustomer(order)}</span>
                    <span>{formatDate(order.criado_em || order.created_at || order.data_criacao)}</span>
                    <span className="capitalize">{order.forma_pagamento || order.metodo_pagamento || 'Pagamento não informado'}</span>
                    <strong className="text-nexus-200">{formatCurrency(order.total ?? order.valor_total ?? order.total_geral)}</strong>
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
                <div className="mt-5 rounded-2xl border border-dark-border bg-dark-bg/60 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-nexus-400">Itens do pedido</p>
                  <div className="mt-3 space-y-2">
                    {orderItems.map((item, index) => (
                      <div key={`${item.id || item.item_id || item.nome}-${index}`} className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-dark-card px-3 py-2.5 text-sm">
                        <span className="text-white">{item.nome || item.item_nome || item.produto_nome || 'Produto'}</span>
                        <span className="text-nexus-400">{item.quantidade || 1} × {formatCurrency(item.preco_unitario ?? item.valor_unitario ?? item.preco)}</span>
                        <strong className="text-nexus-200">{formatCurrency(item.subtotal ?? item.total ?? toNumber(item.quantidade || 1) * toNumber(item.preco_unitario ?? item.valor_unitario ?? item.preco))}</strong>
                      </div>
                    ))}
                    {orderItems.length === 0 && <p className="rounded-xl bg-dark-card p-3 text-sm text-nexus-400">Itens detalhados não disponíveis para este pedido.</p>}
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
  const colors = {
    gold: 'border-nexus-500/20 bg-nexus-500/10 text-nexus-300',
    amber: 'border-amber-400/20 bg-amber-400/10 text-amber-300',
    green: 'border-emerald-400/20 bg-emerald-400/10 text-emerald-300',
  };
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-nexus-400">{label}</p>
          <p className="mt-2 truncate text-2xl font-bold text-white">{value}</p>
          <p className="mt-1 text-xs text-nexus-500">{detail}</p>
        </div>
        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${colors[accent]}`}><ControlIcon kind={icon} className="h-5 w-5" /></span>
      </div>
    </div>
  );
}

function ActionShortcut({ icon, title, text, action }) {
  return (
    <button type="button" onClick={action} className="group flex w-full items-center gap-3 rounded-xl border border-dark-border bg-dark-hover p-4 text-left transition-all hover:border-nexus-500/40 hover:bg-nexus-500/10">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-dark-card text-nexus-300 transition-colors group-hover:bg-nexus-500/15"><ControlIcon kind={icon} className="h-5 w-5" /></span>
      <span className="min-w-0 flex-1"><span className="block font-medium text-white">{title}</span><span className="mt-0.5 block text-sm text-nexus-400">{text}</span></span>
      <ControlIcon kind="chevron" className="h-4 w-4 text-nexus-500" />
    </button>
  );
}

function StatusPill({ status, type = 'payment' }) {
  const normalized = normalizeStatus(status);
  const classes = normalized === 'confirmado' || normalized === 'aprovado' || normalized === 'pago' || normalized === 'concluido'
    ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200'
    : normalized === 'recusado' || normalized === 'cancelado' || normalized === 'falhou' || normalized === 'estornado'
      ? 'border-red-400/30 bg-red-400/10 text-red-200'
      : normalized === 'processando'
        ? 'border-sky-400/30 bg-sky-400/10 text-sky-200'
        : 'border-amber-400/30 bg-amber-400/10 text-amber-200';
  return <span className={`rounded-full border px-2 py-1 text-[11px] font-semibold ${classes}`}>{formatStatus(status, type)}</span>;
}

function EmptyPanel({ icon, title, text, actionLabel, onAction }) {
  return (
    <div className="flex flex-col items-center justify-center p-10 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-nexus-500/10 text-nexus-300"><ControlIcon kind={icon} className="h-7 w-7" /></span>
      <h3 className="mt-4 font-semibold text-white">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-nexus-400">{text}</p>
      {actionLabel && <button type="button" onClick={onAction} className="btn-primary mt-5">{actionLabel}</button>}
    </div>
  );
}

function AccessDenied() {
  return (
    <div className="card mx-auto max-w-xl p-8 text-center">
      <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-400/10 text-red-300"><ControlIcon kind="shield" className="h-7 w-7" /></span>
      <h1 className="mt-5 text-2xl font-bold text-white">Acesso administrativo necessário</h1>
      <p className="mt-2 text-nexus-400">Este centro de controle está disponível apenas para administradores.</p>
    </div>
  );
}

function ControlCenterSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-48 rounded-3xl border border-dark-border bg-dark-card" />
      <div className="h-14 rounded-2xl border border-dark-border bg-dark-card" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((index) => <div key={index} className="h-32 rounded-2xl border border-dark-border bg-dark-card" />)}
      </div>
      <div className="h-96 rounded-2xl border border-dark-border bg-dark-card" />
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
