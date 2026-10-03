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
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-white">Meu Perfil</h1>
        <p className="text-nexus-400 mt-1">Gerencie suas informações pessoais e segurança</p>
      </div>

      <div className="card overflow-hidden">
        <div className="border-b border-dark-border">
          <nav className="flex" aria-label="Abas do perfil">
            <button
              onClick={() => setActiveTab('info')}
              className={`flex-1 px-6 py-4 text-sm font-medium transition-colors border-b-2 ${
                activeTab === 'info'
                  ? 'border-nexus-500 text-white'
                  : 'border-transparent text-nexus-400 hover:text-nexus-300 hover:bg-dark-hover'
              }`}
            >
              Informações
            </button>
            <button
              onClick={() => setActiveTab('security')}
              className={`flex-1 px-6 py-4 text-sm font-medium transition-colors border-b-2 ${
                activeTab === 'security'
                  ? 'border-nexus-500 text-white'
                  : 'border-transparent text-nexus-400 hover:text-nexus-300 hover:bg-dark-hover'
              }`}
            >
              Segurança
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`flex-1 px-6 py-4 text-sm font-medium transition-colors border-b-2 ${
                activeTab === 'history'
                  ? 'border-nexus-500 text-white'
                  : 'border-transparent text-nexus-400 hover:text-nexus-300 hover:bg-dark-hover'
              }`}
            >
              Histórico de Compras
            </button>
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'info' && (
            <form onSubmit={handleInfoSubmit} className="space-y-5" noValidate>
              <div className="flex items-center gap-6 mb-6">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-nexus-500 to-nexus-700 flex items-center justify-center text-3xl font-bold text-white">
                  {user?.nome?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-white">{user?.nome}</h2>
                  <p className="text-nexus-400">{user?.email}</p>
                  <RoleBadge role={user?.nivel_acesso} className="mt-2 inline-block" />
                  {rootAdmin && <p className="mt-2 text-xs text-yellow-300">Administrador raiz protegido</p>}
                </div>
              </div>

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

              <div className="pt-4 border-t border-dark-border">
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
            <form onSubmit={handlePasswordSubmit} className="space-y-5" noValidate>
              <div className="mb-6">
                <div className={`p-4 rounded-xl border ${rootAdmin ? 'bg-yellow-600/10 border-yellow-500/30' : 'bg-nexus-600/10 border-nexus-500/30'}`}>
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-nexus-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    <div>
                      <h3 className="font-medium text-white">{rootAdmin ? 'Conta protegida' : 'Segurança da conta'}</h3>
                      <p className="text-sm text-nexus-400 mt-1">
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

              <div className="pt-4 border-t border-dark-border">
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
              {loadingOrders ? (
                <div className="flex flex-col items-center justify-center py-12 gap-3 text-nexus-400">
                  <Spinner size="lg" />
                  <p>Carregando seu histórico de aquisições...</p>
                </div>
              ) : orders.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto mb-4 bg-nexus-600/10 rounded-full flex items-center justify-center">
                    <svg className="w-8 h-8 text-nexus-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-white mb-2">Nenhuma compra encontrada</h3>
                  <p className="text-nexus-400">Você ainda não realizou aquisições no sistema.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {orders.map(order => (
                    <div key={order.id} className="p-5 rounded-2xl bg-dark-card border border-dark-border hover:border-nexus-500/30 transition-colors">
                      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-4 pb-4 border-b border-dark-border">
                        <div>
                          <p className="text-nexus-400 text-sm">
                            Pedido <span className="text-white font-mono">#{order.id}</span> • {formatDate(order.criado_em)}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="px-2 py-1 text-xs font-medium rounded-md bg-green-500/20 text-green-400 border border-green-500/20">
                              {order.status_pagamento}
                            </span>
                            <span className="px-2 py-1 text-xs font-medium rounded-md bg-nexus-500/20 text-nexus-400 border border-nexus-500/20 uppercase">
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
      </div>

      <div className="card p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Informações da conta</h2>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div>
            <dt className="text-nexus-500">ID do usuário</dt>
            <dd className="text-white font-mono">{user?.id}</dd>
          </div>
          <div>
            <dt className="text-nexus-500">Nível de acesso</dt>
            <dd className="text-white capitalize">{user?.nivel_acesso}</dd>
          </div>
          <div>
            <dt className="text-nexus-500">Membro desde</dt>
            <dd className="text-white">{formatDate(user?.criado_em)}</dd>
          </div>
        </dl>
      </div>

      <section className="card p-6 border border-red-500/30" aria-labelledby="delete-account-title">
        <h2 id="delete-account-title" className="text-lg font-semibold text-red-300">Excluir conta</h2>
        {rootAdmin ? (
          <p className="mt-2 text-sm text-nexus-400">A conta do administrador raiz é protegida e não pode ser excluída.</p>
        ) : (
          <form onSubmit={handleDeleteAccount} className="mt-3 space-y-4">
            <p className="text-sm text-nexus-400">
              A exclusão é permanente e remove seu acesso, histórico de compras e negociações. Itens publicados no catálogo serão mantidos sob responsabilidade do administrador do sistema.
            </p>
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
            <button
              type="submit"
              className="btn-danger"
              disabled={deletingAccount}
            >
              {deletingAccount ? (
                <span className="flex items-center justify-center gap-2">
                  <Spinner size="md" />
                  Excluindo conta...
                </span>
              ) : 'Excluir minha conta'}
            </button>
          </form>
        )}
      </section>
    </div>
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