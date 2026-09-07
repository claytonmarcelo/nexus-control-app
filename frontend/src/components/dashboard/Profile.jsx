import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { userService } from '../../services/services';
import { useModal } from '../../contexts/ModalContext';
import { formatDate } from '../../utils/date';
import { isRootAdmin } from '../../utils/access';

export default function Profile() {
  const { user, updateUser } = useAuth();
  const { toast, confirm } = useModal();
  const [activeTab, setActiveTab] = useState('info');
  const [formData, setFormData] = useState({ nome: '', email: '' });
  const [passwordData, setPasswordData] = useState({ senha_atual: '', nova_senha: '', confirmar_nova_senha: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const rootAdmin = isRootAdmin(user);

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
    if (!passwordData.senha_atual) newErrors.senha_atual = 'Senha atual é obrigatória';
    if (!passwordData.nova_senha) newErrors.nova_senha = 'Nova senha é obrigatória';
    else if (passwordData.nova_senha.length < 6) newErrors.nova_senha = 'Nova senha deve ter no mínimo 6 caracteres';
    if (passwordData.nova_senha !== passwordData.confirmar_nova_senha) newErrors.confirmar_nova_senha = 'As senhas não conferem';
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
                      <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
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
                        {rootAdmin ? 'A conta do administrador raiz não pode ser alterada.' : 'Mantenha sua conta segura alterando sua senha periodicamente. Use exatamente 6 caracteres, com dígitos e um caractere especial.'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label htmlFor="senha_atual" className="label">Senha atual *</label>
                <input
                  id="senha_atual"
                  name="senha_atual"
                  type="password"
                  value={passwordData.senha_atual}
                  onChange={handlePasswordChange}
                  disabled={rootAdmin || loading}
                  className={`input ${errors.senha_atual ? 'border-red-500 focus:ring-red-500' : ''}`}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  aria-invalid={!!errors.senha_atual}
                  aria-describedby={errors.senha_atual ? 'senha_atual-error' : undefined}
                />
                {errors.senha_atual && <p id="senha_atual-error" className="mt-1 text-sm text-red-400" role="alert">{errors.senha_atual}</p>}
              </div>

              <div>
                <label htmlFor="nova_senha" className="label">Nova senha *</label>
                <input
                  id="nova_senha"
                  name="nova_senha"
                  type="password"
                  value={passwordData.nova_senha}
                  onChange={handlePasswordChange}
                  disabled={rootAdmin || loading}
                  className={`input ${errors.nova_senha ? 'border-red-500 focus:ring-red-500' : ''}`}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  aria-invalid={!!errors.nova_senha}
                  aria-describedby={errors.nova_senha ? 'nova_senha-error' : undefined}
                />
                {errors.nova_senha && <p id="nova_senha-error" className="mt-1 text-sm text-red-400" role="alert">{errors.nova_senha}</p>}
              </div>

              <div>
                <label htmlFor="confirmar_nova_senha" className="label">Confirmar nova senha *</label>
                <input
                  id="confirmar_nova_senha"
                  name="confirmar_nova_senha"
                  type="password"
                  value={passwordData.confirmar_nova_senha}
                  onChange={handlePasswordChange}
                  disabled={rootAdmin || loading}
                  className={`input ${errors.confirmar_nova_senha ? 'border-red-500 focus:ring-red-500' : ''}`}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  aria-invalid={!!errors.confirmar_nova_senha}
                  aria-describedby={errors.confirmar_nova_senha ? 'confirmar-error' : undefined}
                />
                {errors.confirmar_nova_senha && <p id="confirmar-error" className="mt-1 text-sm text-red-400" role="alert">{errors.confirmar_nova_senha}</p>}
              </div>

              <div className="pt-4 border-t border-dark-border">
                <button type="submit" className="btn-primary" disabled={rootAdmin || loading}>
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Alterando...
                    </span>
                  ) : (
                    'Alterar senha'
                  )}
                </button>
              </div>
            </form>
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