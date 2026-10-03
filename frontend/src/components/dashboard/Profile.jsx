import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { userService, checkoutService } from '../../services/services';
import { useModal } from '../../contexts/ModalContext';
import { formatDate } from '../../utils/date';
import { isRootAdmin } from '../../utils/access';
import { validatePassword, PASSWORD_POLICY_MESSAGE } from '../../utils/password';
import Spinner from '../ui/Spinner';

export default function Profile() {
  const { user, updateUser, logout } = useAuth();
  const { toast, confirm } = useModal();
  const [activeTab, setActiveTab] = useState('info');
  const [formData, setFormData] = useState({ nome: '', email: '' });
  const [passwordData, setPasswordData] = useState({ senha_atual: '', nova_senha: '', confirmar_nova_senha: '' });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [deletingOrderId, setDeletingOrderId] = useState(null);
  const [accountDeletionPassword, setAccountDeletionPassword] = useState('');
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [accountDeletionError, setAccountDeletionError] = useState('');
  const rootAdmin = isRootAdmin(user);

  useEffect(() => {
    if (activeTab === 'history') {
      loadOrders();
    }
  }, [activeTab]);

  const loadOrders = async () => {
    setLoadingOrders(true);
    try {
      const data = await checkoutService.getMyOrders({ limit: 50 });
      setOrders(data || []);
    } catch (error) {
      toast({ message: 'Erro ao carregar histórico de compras', variant: 'danger' });
    } finally {
      setLoadingOrders(false);
    }
  };

  const handleDeleteOrder = async (id) => {
    const isConfirmed = await confirm({
      title: 'Excluir Histórico',
      message: 'Tem certeza que deseja excluir esta compra do seu histórico? Esta ação é irreversível e o pedido sumirá do sistema.',
    });

    if (isConfirmed) {
      setDeletingOrderId(id);
      try {
        await checkoutService.deleteOrder(id);
        setOrders((current) => current.filter((order) => String(order.id) !== String(id)));
        toast({ message: 'Compra removida do histórico', variant: 'success' });
      } catch (error) {
        const message = error.response?.data?.message || 'Erro ao deletar registro de compra';
        toast({ message, variant: 'danger' });
      } finally {
        setDeletingOrderId(null);
      }
    }
  };

  const handleInfoChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateInfoForm = () => {
    const newErrors = {};
    if (!formData.nome.trim()) newErrors.nome = 'Nome é obrigatório';
    else if (formData.nome.length < 2) newErrors.nome = 'Nome deve ter no mínimo 2 caracteres';
    if (!formData.email) newErrors.email = 'Email é obrigatório';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Email inválido';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validatePasswordForm = () => {
    const newErrors = {};
    if (!passwordData.senha_atual) {
      newErrors.senha_atual = 'Senha atual é obrigatória';
    }
    const passwordError = validatePassword(passwordData.nova_senha);
    if (passwordError) {
      newErrors.nova_senha = passwordError;
    }
    if (!passwordData.confirmar_nova_senha) {
      newErrors.confirmar_nova_senha = 'Confirmação de nova senha é obrigatória';
    } else if (passwordData.nova_senha !== passwordData.confirmar_nova_senha) {
      newErrors.confirmar_nova_senha = 'As senhas não conferem';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInfoSubmit = async (e) => {
    e.preventDefault();
    if (rootAdmin) return;
    if (!validateInfoForm()) return;

    setLoading(true);
    try {
      await userService.update(user.id, { nome: formData.nome, email: formData.email });
      updateUser({ nome: formData.nome, email: formData.email });
      toast({ message: 'Perfil atualizado com sucesso', variant: 'success' });
    } catch (error) {
      const message = error.response?.data?.message || 'Erro ao atualizar perfil';
      toast({ message, variant: 'danger' });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (rootAdmin) return;
    if (!validatePasswordForm()) return;

    setLoading(true);
    try {
      await userService.changePassword(user.id, {
        senha_atual: passwordData.senha_atual,
        nova_senha: passwordData.nova_senha
      });
      setPasswordData({ senha_atual: '', nova_senha: '', confirmar_nova_senha: '' });
      toast({ message: 'Senha alterada com sucesso', variant: 'success' });
    } catch (error) {
      const message = error.response?.data?.message || 'Erro ao alterar senha';
      toast({ message, variant: 'danger' });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async (e) => {
    e.preventDefault();
    if (!accountDeletionPassword) {
      setAccountDeletionError('Informe sua senha atual para continuar');
      return;
    }

    const isConfirmed = await confirm({
      title: 'Excluir sua conta permanentemente?',
      message: 'Esta ação é irreversível. Seu acesso, histórico de compras e negociações serão excluídos. Os itens publicados no catálogo serão preservados e transferidos para o administrador do sistema.',
      confirmText: 'Excluir minha conta',
    });
    if (!isConfirmed) return;

    setDeletingAccount(true);
    try {
      await userService.deleteOwnAccount({ senha_atual: accountDeletionPassword });
      logout();
    } catch (error) {
      const message = error.response?.data?.message || 'Erro ao excluir sua conta';
      setAccountDeletionError(message);
    } finally {
      setDeletingAccount(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6 lg:space-y-8 animate-fade-in">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-nexus-500">Conta e preferências</p>
        <h1 className="mt-2 text-3xl font-bold text-white sm:text-4xl">Meu perfil</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-text-secondary sm:text-base">
          Gerencie seus dados, a segurança do acesso e o histórico da sua conta.
        </p>
      </header>

      <section className="relative overflow-hidden rounded-2xl border border-dark-border bg-dark-card p-5 shadow-elevation-1 sm:p-7" aria-label="Resumo do perfil">
        <div className="pointer-events-none absolute -right-16 -top-24 h-56 w-56 rounded-full bg-nexus-500/10 blur-3xl" />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-4 sm:gap-5">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-nexus-500/30 bg-gradient-to-br from-nexus-500/30 to-nexus-700/20 text-2xl font-bold text-nexus-300 sm:h-20 sm:w-20 sm:text-3xl">
              {user?.nome?.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium uppercase tracking-wider text-nexus-500">Perfil pessoal</p>
              <h2 className="mt-1 truncate text-xl font-semibold text-white sm:text-2xl">{user?.nome}</h2>
              <p className="mt-1 truncate text-sm text-text-secondary">{user?.email}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:justify-end">
            <RoleBadge role={user?.nivel_acesso} />
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-300">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              Conta ativa
            </span>
          </div>
        </div>
      </section>

      <section className="card mb-0 overflow-hidden" aria-label="Gerenciar perfil">
          <div className="border-b border-dark-border p-2 sm:p-3">
            <nav className="grid grid-cols-3 gap-1" aria-label="Abas do perfil" role="tablist">
            <button
              id="profile-info-tab"
              type="button"
              onClick={() => setActiveTab('info')}
              role="tab"
              aria-label="Dados pessoais"
              aria-selected={activeTab === 'info'}
              aria-controls="profile-tab-panel"
              className={`flex min-h-14 items-center justify-center gap-2 rounded-xl px-2 py-3 text-xs font-semibold transition-colors sm:min-h-16 sm:gap-3 sm:px-4 sm:text-sm ${
                activeTab === 'info'
                  ? 'bg-nexus-500/10 text-nexus-300 ring-1 ring-inset ring-nexus-500/20'
                  : 'text-text-secondary hover:bg-dark-hover hover:text-white'
              }`}
            >
              <ProfileTabIcon type="info" />
              <span><span className="sm:hidden">Dados</span><span className="hidden sm:inline">Dados pessoais</span></span>
            </button>
            <button
              id="profile-security-tab"
              type="button"
              onClick={() => setActiveTab('security')}
              role="tab"
              aria-selected={activeTab === 'security'}
              aria-controls="profile-tab-panel"
              className={`flex min-h-14 items-center justify-center gap-2 rounded-xl px-2 py-3 text-xs font-semibold transition-colors sm:min-h-16 sm:gap-3 sm:px-4 sm:text-sm ${
                activeTab === 'security'
                  ? 'bg-nexus-500/10 text-nexus-300 ring-1 ring-inset ring-nexus-500/20'
                  : 'text-text-secondary hover:bg-dark-hover hover:text-white'
              }`}
            >
              <ProfileTabIcon type="security" />
              <span>Segurança</span>
            </button>
            <button
              id="profile-history-tab"
              type="button"
              onClick={() => setActiveTab('history')}
              role="tab"
              aria-label="Histórico"
              aria-selected={activeTab === 'history'}
              aria-controls="profile-tab-panel"
              className={`flex min-h-14 items-center justify-center gap-2 rounded-xl px-2 py-3 text-xs font-semibold transition-colors sm:min-h-16 sm:gap-3 sm:px-4 sm:text-sm ${
                activeTab === 'history'
                  ? 'bg-nexus-500/10 text-nexus-300 ring-1 ring-inset ring-nexus-500/20'
                  : 'text-text-secondary hover:bg-dark-hover hover:text-white'
              }`}
            >
              <ProfileTabIcon type="history" />
              <span>Histórico</span>
            </button>
            </nav>
          </div>

        <div id="profile-tab-panel" className="p-5 sm:p-7 lg:p-8" role="tabpanel" aria-labelledby={`profile-${activeTab}-tab`}>
          {activeTab === 'info' && (
            <form onSubmit={handleInfoSubmit} className="space-y-6" noValidate>
              <div className="border-b border-dark-border pb-5">
                <p className="text-xs font-semibold uppercase tracking-wider text-nexus-500">Seus dados</p>
                <h2 className="mt-1 text-xl font-semibold text-white">Informações pessoais</h2>
                <p className="mt-1 text-sm leading-relaxed text-text-secondary">
                  Essas informações identificam você nas comunicações e atividades da plataforma.
                </p>
                {rootAdmin && <p className="mt-3 text-sm text-amber-300">Os dados do administrador raiz são protegidos.</p>}
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label htmlFor="nome" className="label">Nome completo *</label>
                <input
                  id="nome"
                  name="nome"
                  type="text"
                  value={formData.nome || user?.nome}
                  onChange={handleInfoChange}
                  disabled={rootAdmin || loading}
                  className={`input ${errors.nome ? 'border-red-500 focus:ring-red-500' : ''}`}
                  placeholder="Seu nome"
                  aria-invalid={!!errors.nome}
                  aria-describedby={errors.nome ? 'nome-error' : undefined}
                />
                {errors.nome && <p id="nome-error" className="mt-1 text-sm text-red-400" role="alert">{errors.nome}</p>}
              </div>

              <div>
                <label htmlFor="email" className="label">Email *</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email || user?.email}
                  onChange={handleInfoChange}
                  disabled={rootAdmin || loading}
                  className={`input ${errors.email ? 'border-red-500 focus:ring-red-500' : ''}`}
                  placeholder="seu@email.com"
                  aria-invalid={!!errors.email}
                  aria-describedby={errors.email ? 'email-error' : undefined}
                />
                {errors.email && <p id="email-error" className="mt-1 text-sm text-red-400" role="alert">{errors.email}</p>}
              </div>
              </div>

              <div className="flex flex-col-reverse gap-3 border-t border-dark-border pt-5 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-text-secondary">Campos marcados com * são obrigatórios.</p>
                <button type="submit" className="btn-primary" disabled={rootAdmin || loading}>
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <Spinner size="md" />
                      Salvando...
                    </span>
                  ) : (
                    'Salvar alterações'
                  )}
                </button>
              </div>
            </form>
          )}

          {activeTab === 'security' && (
            <form onSubmit={handlePasswordSubmit} className="space-y-6" noValidate>
              <div className="border-b border-dark-border pb-5">
                <p className="text-xs font-semibold uppercase tracking-wider text-nexus-500">Proteção de acesso</p>
                <h2 className="mt-1 text-xl font-semibold text-white">Segurança da conta</h2>
                <p className="mt-1 text-sm leading-relaxed text-text-secondary">
                  Atualize sua senha periodicamente para manter sua conta protegida.
                </p>
              </div>
              <div>
                <div className={`rounded-xl border p-4 ${rootAdmin ? 'border-amber-500/30 bg-amber-500/5' : 'border-nexus-500/20 bg-nexus-500/5'}`}>
                  <div className="flex items-start gap-3">
                    <svg aria-hidden="true" className="mt-0.5 h-5 w-5 flex-shrink-0 text-nexus-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    <div>
                      <h3 className="font-medium text-white">{rootAdmin ? 'Conta protegida' : 'Requisitos da senha'}</h3>
                      <p className="mt-1 text-sm leading-relaxed text-text-secondary">
                        {rootAdmin ? 'A conta do administrador raiz não pode ser alterada.' : PASSWORD_POLICY_MESSAGE}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label htmlFor="senha_atual" className="label">Senha atual *</label>
                <div className="relative">
                  <input
                    id="senha_atual"
                    name="senha_atual"
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={passwordData.senha_atual}
                    onChange={handlePasswordChange}
                    disabled={rootAdmin || loading}
                    className={`input pr-12 ${errors.senha_atual ? 'border-red-500 focus:ring-red-500' : ''}`}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    aria-invalid={!!errors.senha_atual}
                    aria-describedby={errors.senha_atual ? 'senha_atual-error' : undefined}
                  />
                  <PasswordToggle
                    visible={showCurrentPassword}
                    onClick={() => setShowCurrentPassword(prev => !prev)}
                    label={showCurrentPassword ? 'Ocultar senha atual' : 'Mostrar senha atual'}
                  />
                </div>
                {errors.senha_atual && <p id="senha_atual-error" className="mt-1 text-sm text-red-400" role="alert">{errors.senha_atual}</p>}
              </div>

              <div>
                <label htmlFor="nova_senha" className="label">Nova senha *</label>
                <div className="relative">
                  <input
                    id="nova_senha"
                    name="nova_senha"
                    type={showNewPassword ? 'text' : 'password'}
                    value={passwordData.nova_senha}
                    onChange={handlePasswordChange}
                    disabled={rootAdmin || loading}
                    className={`input pr-12 ${errors.nova_senha ? 'border-red-500 focus:ring-red-500' : ''}`}
                    placeholder="6 dígitos + 1 símbolo"
                    autoComplete="new-password"
                    maxLength={7}
                    aria-invalid={!!errors.nova_senha}
                    aria-describedby={errors.nova_senha ? 'nova_senha-error' : undefined}
                  />
                  <PasswordToggle
                    visible={showNewPassword}
                    onClick={() => setShowNewPassword(prev => !prev)}
                    label={showNewPassword ? 'Ocultar nova senha' : 'Mostrar nova senha'}
                  />
                </div>
                {errors.nova_senha && <p id="nova_senha-error" className="mt-1 text-sm text-red-400" role="alert">{errors.nova_senha}</p>}
              </div>

              <div>
                <label htmlFor="confirmar_nova_senha" className="label">Confirmar nova senha *</label>
                <div className="relative">
                  <input
                    id="confirmar_nova_senha"
                    name="confirmar_nova_senha"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={passwordData.confirmar_nova_senha}
                    onChange={handlePasswordChange}
                    disabled={rootAdmin || loading}
                    className={`input pr-12 ${errors.confirmar_nova_senha ? 'border-red-500 focus:ring-red-500' : ''}`}
                    placeholder="6 dígitos + 1 símbolo"
                    autoComplete="new-password"
                    maxLength={7}
                    aria-invalid={!!errors.confirmar_nova_senha}
                    aria-describedby={errors.confirmar_nova_senha ? 'confirmar-error' : undefined}
                  />
                  <PasswordToggle
                    visible={showConfirmPassword}
                    onClick={() => setShowConfirmPassword(prev => !prev)}
                    label={showConfirmPassword ? 'Ocultar confirmação de senha' : 'Mostrar confirmação de senha'}
                  />
                </div>
                {errors.confirmar_nova_senha && <p id="confirmar-error" className="mt-1 text-sm text-red-400" role="alert">{errors.confirmar_nova_senha}</p>}
              </div>

              <div className="border-t border-dark-border pt-5">
                <button type="submit" className="btn-primary" disabled={rootAdmin || loading}>
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <Spinner size="md" />
                      Alterando...
                    </span>
                  ) : (
                    'Alterar senha'
                  )}
                </button>
              </div>
            </form>
          )}

          {activeTab === 'history' && (
            <div className="space-y-6">
              <div className="border-b border-dark-border pb-5">
                <p className="text-xs font-semibold uppercase tracking-wider text-nexus-500">Suas atividades</p>
                <h2 className="mt-1 text-xl font-semibold text-white">Histórico de compras</h2>
                <p className="mt-1 text-sm leading-relaxed text-text-secondary">
                  Consulte os pedidos associados à sua conta e os respectivos detalhes.
                </p>
              </div>
              {loadingOrders ? (
                <div className="flex flex-col items-center justify-center gap-3 py-12 text-text-secondary">
                  <Spinner size="lg" />
                  <p>Carregando seu histórico de compras...</p>
                </div>
              ) : orders.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto mb-4 bg-nexus-600/10 rounded-full flex items-center justify-center">
                    <svg aria-hidden="true" className="h-8 w-8 text-nexus-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <h3 className="mb-2 text-lg font-medium text-white">Nenhum pedido por aqui ainda</h3>
                  <p className="mx-auto max-w-sm text-sm leading-relaxed text-text-secondary">
                    Quando você realizar uma compra, os detalhes do pedido aparecerão nesta seção.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {orders.map(order => (
                    <div key={order.id} className="p-5 rounded-2xl bg-dark-card border border-dark-border hover:border-nexus-500/30 transition-colors">
                      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-4 pb-4 border-b border-dark-border">
                        <div>
                          <p className="text-sm text-text-secondary">
                            Pedido <span className="text-white font-mono">#{order.id}</span> • {formatDate(order.criado_em)}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="rounded-md border border-emerald-500/20 bg-emerald-500/10 px-2 py-1 text-xs font-medium text-emerald-300">
                              {order.status_pagamento}
                            </span>
                            <span className="rounded-md border border-nexus-500/20 bg-nexus-500/10 px-2 py-1 text-xs font-medium uppercase text-nexus-300">
                              {order.metodo_pagamento}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between sm:justify-end gap-6">
                          <p className="text-xl font-bold text-white">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(order.total)}
                          </p>
                          <button 
                            onClick={() => handleDeleteOrder(order.id)}
                            disabled={deletingOrderId === order.id}
                            className="p-2 text-red-400 hover:text-white hover:bg-red-500/20 rounded-lg transition-colors border border-transparent hover:border-red-500/30 disabled:cursor-wait disabled:opacity-50"
                            title="Excluir do Histórico"
                            aria-label={`Excluir pedido ${order.id} do histórico`}
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        {(Array.isArray(order.items)
                          ? order.items
                          : typeof order.items === 'string'
                          ? JSON.parse(order.items)
                          : Array.isArray(order.itens)
                          ? order.itens
                          : []
                        ).map((item, idx) => (
                          <div key={idx} className="flex justify-between items-center text-sm">
                            <span className="text-gray-300">
                              <span className="text-nexus-500 mr-2">{item.quantidade}x</span>
                              {item.nome || item.item_nome || `Item #${item.item_id}`}
                            </span>
                            <span className="text-gray-400 font-mono">
                              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.preco_unitario || 0)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      <section className="card mb-0 p-5 sm:p-6" aria-labelledby="account-summary-title">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 id="account-summary-title" className="text-lg font-semibold text-white">Detalhes da conta</h2>
            <p className="mt-1 text-sm text-text-secondary">Informações de cadastro e nível de acesso.</p>
          </div>
        </div>
        <dl className="mt-5 grid gap-3 border-t border-dark-border pt-4 sm:grid-cols-3">
          <div className="rounded-xl bg-dark-hover/40 px-4 py-3">
            <dt className="text-xs font-medium text-text-secondary">Identificação</dt>
            <dd className="mt-1 font-mono text-sm font-semibold text-white">#{user?.id}</dd>
          </div>
          <div className="rounded-xl bg-dark-hover/40 px-4 py-3">
            <dt className="text-xs font-medium text-text-secondary">Nível de acesso</dt>
            <dd className="mt-1 text-sm font-semibold capitalize text-white">{user?.nivel_acesso}</dd>
          </div>
          <div className="rounded-xl bg-dark-hover/40 px-4 py-3">
            <dt className="text-xs font-medium text-text-secondary">Membro desde</dt>
            <dd className="mt-1 text-sm font-semibold text-white">{formatDate(user?.criado_em)}</dd>
          </div>
        </dl>
      </section>

      <section className="rounded-2xl border border-red-500/20 bg-dark-card p-5 sm:p-6 lg:p-7" aria-labelledby="delete-account-title">
        <div className="grid gap-6 sm:grid-cols-[minmax(0,1fr)_minmax(260px,0.85fr)] sm:items-center">
          <div>
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-500/10 text-red-300">
                <svg aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 9v4m0 4h.01M10.3 3.9L2.7 17a2 2 0 001.7 3h15.2a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z" />
                </svg>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-red-300">Zona de risco</p>
                <h2 id="delete-account-title" className="mt-1 text-lg font-semibold text-white">Excluir conta</h2>
              </div>
            </div>
            {rootAdmin ? (
              <p className="mt-3 text-sm leading-relaxed text-text-secondary">A conta do administrador raiz é protegida e não pode ser excluída.</p>
            ) : (
              <p className="mt-3 max-w-xl text-sm leading-relaxed text-text-secondary">
                A exclusão remove seu acesso e histórico de compras e negociações. Os itens publicados no catálogo serão preservados sob responsabilidade do administrador.
              </p>
            )}
          </div>
          {!rootAdmin && (
            <form onSubmit={handleDeleteAccount} className="space-y-3 sm:border-l sm:border-dark-border sm:pl-6">
            <div>
              <label htmlFor="senha_exclusao_conta" className="label">Confirme sua senha atual</label>
              <input
                id="senha_exclusao_conta"
                name="senha_exclusao_conta"
                type="password"
                value={accountDeletionPassword}
                onChange={(event) => {
                  setAccountDeletionPassword(event.target.value);
                  setAccountDeletionError('');
                }}
                disabled={deletingAccount}
                className={`input ${accountDeletionError ? 'border-red-500 focus:ring-red-500' : ''}`}
                autoComplete="current-password"
                aria-invalid={!!accountDeletionError}
                aria-describedby={accountDeletionError ? 'excluir-conta-error' : undefined}
              />
              {accountDeletionError && (
                <p id="excluir-conta-error" className="mt-1 text-sm text-red-400" role="alert">{accountDeletionError}</p>
              )}
            </div>
              <button type="submit" className="btn-danger w-full sm:w-auto" disabled={deletingAccount}>
                {deletingAccount ? (
                  <span className="flex items-center justify-center gap-2">
                    <Spinner size="md" />
                    Excluindo conta...
                  </span>
                ) : 'Excluir minha conta'}
              </button>
            </form>
          )}
        </div>
      </section>
    </div>
  );
}

function ProfileTabIcon({ type }) {
  const paths = {
    info: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.5 20.1a7.5 7.5 0 0115 0 17.9 17.9 0 01-7.5 1.65 17.9 17.9 0 01-7.5-1.65z" />,
    security: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 3l8 3v5c0 5.2-3.4 8.6-8 10-4.6-1.4-8-4.8-8-10V6l8-3zm-3 9l2 2 4-4" />,
    history: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 12a9 9 0 109-9 9 9 0 00-6.4 2.6L3 8m0-5v5h5m4-1v5l3 2" />,
  };

  return (
    <svg aria-hidden="true" className="h-4 w-4 shrink-0 sm:h-5 sm:w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      {paths[type]}
    </svg>
  );
}

function RoleBadge({ role, className }) {
  const styles = {
    admin: 'bg-red-600/20 text-red-400',
    funcionario: 'bg-green-600/20 text-green-400',
    cliente: 'bg-nexus-600/20 text-nexus-400',
  };

  const labels = {
    admin: 'Administrador',
    funcionario: 'Funcionário',
    cliente: 'Cliente',
  };

  return (
    <span className={`px-3 py-1 text-sm font-medium rounded-full ${styles[role]} ${className || ''}`}>
      {labels[role]}
    </span>
  );
}

function PasswordToggle({ visible, onClick, label }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center justify-center p-2 rounded-lg text-nexus-400 hover:text-nexus-300 hover:bg-dark-hover transition-colors"
      aria-label={label || (visible ? 'Ocultar senha' : 'Mostrar senha')}
    >
      <svg aria-hidden="true" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        {visible ? (
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M3 3l18 18M10.6 10.6a2 2 0 0 0 2.8 2.8M9.9 5.2A10.8 10.8 0 0 1 12 5c5.2 0 8.7 4.4 9.8 7a15.6 15.6 0 0 1-3.1 4.4M6.2 6.2C4.4 7.5 3.2 9.3 2.2 12c1.1 2.6 4.6 7 9.8 7 1 0 2-.2 2.9-.5" />
        ) : (
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M2.2 12C3.3 9.4 6.8 5 12 5s8.7 4.4 9.8 7c-1.1 2.6-4.6 7-9.8 7s-8.7-4.4-9.8-7Z M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
        )}
      </svg>
    </button>
  );
}