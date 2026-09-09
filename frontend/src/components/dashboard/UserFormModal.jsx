import { useState, useEffect } from 'react';
import { useModal } from '../../contexts/ModalContext';
import { validatePassword } from '../../utils/password';

export default function UserFormModal({ isOpen, onClose, onSubmit, initialData, isCurrentUser }) {
  const [formData, setFormData] = useState({ nome: '', email: '', senha: '', nivel_acesso: 'cliente' });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { toast } = useModal();

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData({
          nome: initialData.nome,
          email: initialData.email,
          senha: '',
          nivel_acesso: initialData.nivel_acesso
        });
      } else {
        setFormData({ nome: '', email: '', senha: '', nivel_acesso: 'cliente' });
      }
      setErrors({});
    }
  }, [isOpen, initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.nome.trim()) newErrors.nome = 'Nome é obrigatório';
    else if (formData.nome.length < 2) newErrors.nome = 'Nome deve ter no mínimo 2 caracteres';
    if (!formData.email) newErrors.email = 'Email é obrigatório';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Email inválido';
    if (!initialData) {
      const passwordError = validatePassword(formData.senha);
      if (passwordError) newErrors.senha = passwordError;
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
    } catch (error) {
      const message = error.response?.data?.message || 'Erro ao salvar usuário';
      toast({ message, variant: 'danger' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[1100] flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in"
      style={{ background: 'rgba(0,0,0,0.75)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()} 
      role="dialog" 
      aria-modal="true" 
      aria-labelledby="user-form-title"
    >
      <div className="glass w-full max-w-lg rounded-3xl shadow-glass-lg overflow-hidden animate-scale-in border-b-2 border-nexus-500/30">
        {/* Header */}
        <div className="relative overflow-hidden bg-gradient-to-br from-nexus-500/10 via-nexus-500/5 to-transparent border-b border-nexus-500/20">
          <div className="absolute inset-0 bg-nexus-500/5" />
          <div className="relative p-6">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 border-nexus-500/30 bg-nexus-500/10 shadow-[0_0_24px_rgba(212,175,55,0.1)]">
                  <svg className="h-6 w-6 text-nexus-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 21a8 8 0 0 0-16 0m12-14a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-nexus-400">
                    {initialData ? 'Edição' : 'Cadastro'}
                  </p>
                  <h2 id="user-form-title" className="mt-2 text-xl font-bold leading-tight text-white">
                    {initialData ? 'Editar Usuário' : 'Novo Usuário'}
                  </h2>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-nexus-400 transition-colors hover:bg-dark-hover hover:text-white"
                aria-label="Fechar"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6" noValidate>

          <div className="space-y-5">
            <div>
              <label htmlFor="nome" className="label">Nome completo *</label>
              <input
                id="nome"
                name="nome"
                type="text"
                value={formData.nome}
                onChange={handleChange}
                className={`input ${errors.nome ? 'border-red-500 focus:ring-red-500' : ''}`}
                placeholder="Nome do usuário"
                maxLength={100}
                disabled={isSubmitting}
                aria-invalid={!!errors.nome}
                aria-describedby={errors.nome ? 'nome-error' : undefined}
                autoFocus
              />
              {errors.nome && <p id="nome-error" className="mt-1 text-sm text-red-400" role="alert">{errors.nome}</p>}
            </div>

            {!initialData && (
              <div className="relative">
                <label htmlFor="senha-admin" className="label">Senha temporária *</label>
                <input
                  id="senha-admin"
                  name="senha"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.senha}
                  onChange={handleChange}
                  className={`input pr-14 ${errors.senha ? 'border-red-500 focus:ring-red-500' : ''}`}
                  placeholder="6 caracteres, com especial"
                  autoComplete="new-password"
                  disabled={isSubmitting}
                  aria-invalid={!!errors.senha}
                  aria-describedby={errors.senha ? 'senha-error' : undefined}
                />
                <PasswordToggle
                  visible={showPassword}
                  onClick={() => setShowPassword(prev => !prev)}
                />
                {errors.senha && <p id="senha-error" className="mt-1 text-sm text-red-400" role="alert">{errors.senha}</p>}
              </div>
            )}

            <div>
              <label htmlFor="email" className="label">Email *</label>
              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                className={`input ${errors.email ? 'border-red-500 focus:ring-red-500' : ''}`}
                placeholder="usuario@exemplo.com"
                maxLength={150}
                disabled={isSubmitting}
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? 'email-error' : undefined}
              />
              {errors.email && <p id="email-error" className="mt-1 text-sm text-red-400" role="alert">{errors.email}</p>}
            </div>

            {!isCurrentUser && (
              <div>
                <label htmlFor="nivel_acesso" className="label">Nível de acesso *</label>
                <select
                  id="nivel_acesso"
                  name="nivel_acesso"
                  value={formData.nivel_acesso}
                  onChange={handleChange}
                  className="input appearance-none bg-dark-card"
                  disabled={isSubmitting}
                >
                  <option value="cliente">Cliente (solicitar itens)</option>
                  <option value="funcionario">Funcionário (gerenciar itens)</option>
                  <option value="admin">Administrador (acesso total)</option>
                </select>
              </div>
            )}

            {isCurrentUser && (
              <div className="p-4 rounded-xl bg-yellow-600/10 border border-yellow-500/30">
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-yellow-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <p className="text-sm text-yellow-300">
                    Você está editando seu próprio perfil. O nível de acesso não pode ser alterado.
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary w-full gap-2 sm:w-auto px-6 py-3 font-medium"
              disabled={isSubmitting}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn-primary w-full gap-2 sm:w-auto px-6 py-3 font-medium"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Salvando...
                </span>
              ) : (
                initialData ? 'Atualizar' : 'Criar'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function PasswordToggle({ visible, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="absolute right-2 top-1/2 flex min-h-11 min-w-11 -translate-y-1/2 items-center justify-center rounded-lg text-nexus-400 transition-colors hover:bg-dark-hover hover:text-nexus-300"
      aria-label={visible ? 'Ocultar senha' : 'Mostrar senha'}
    >
      <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        {visible ? (
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M3 3l18 18M10.6 10.6a2 2 0 0 0 2.8 2.8M9.9 5.2A10.8 10.8 0 0 1 12 5c5.2 0 8.7 4.4 9.8 7a15.6 15.6 0 0 1-3.1 4.4M6.2 6.2C4.4 7.5 3.2 9.3 2.2 12c1.1 2.6 4.6 7 9.8 7 1 0 2-.2 2.9-.5" />
        ) : (
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M2.2 12C3.3 9.4 6.8 5 12 5s8.7 4.4 9.8 7c-1.1 2.6-4.6 7-9.8 7s-8.7-4.4-9.8-7Z M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
        )}
      </svg>
    </button>
  );
}