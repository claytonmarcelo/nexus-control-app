import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useModal } from '../../contexts/ModalContext';
import { useTheme } from '../../contexts/ThemeContext';
import { validatePassword } from '../../utils/password';

export default function Login() {
  const [isFlipped, setIsFlipped] = useState(false);
  const { theme, toggleTheme } = useTheme();
  
  const flipCard = () => setIsFlipped(prev => !prev);

  return (
    <div className="auth-page-wrapper">
      <button
        type="button"
        onClick={toggleTheme}
        className="auth-theme-toggle"
        aria-label={theme === 'dark' ? 'Ativar tema claro' : 'Ativar tema escuro'}
        title={theme === 'dark' ? 'Tema claro' : 'Tema escuro'}
      >
        <span aria-hidden="true" className="text-sm">{theme === 'dark' ? '☼' : '☾'}</span>
        <span className="text-[11px] font-semibold uppercase tracking-wider">{theme === 'dark' ? 'Claro' : 'Escuro'}</span>
      </button>

      <div className="auth-glow-ring auth-glow-ring--outer" />
      <div className="auth-glow-ring auth-glow-ring--inner" />

      <div className={`auth-circle-container ${isFlipped ? 'auth-circle-container--register' : ''}`}>
        <div className={`auth-flip-scene ${isFlipped ? 'auth-flip-scene--register' : ''}`}>
          <div
            className="auth-flip-card"
            style={{ transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)' }}
          >
            <div className="auth-flip-face auth-flip-face--front">
              <LoginForm onFlip={flipCard} />
            </div>
            <div className="auth-flip-face auth-flip-face--back">
              <RegisterForm onFlip={flipCard} />
            </div>
          </div>
        </div>
      </div>

      <div className="auth-footer">
        <p>Desenvolvido por <strong>Clayton Marcelo</strong></p>
        <a
          href="https://github.com/claytonmarcelo"
          target="_blank"
          rel="noopener noreferrer"
          className="auth-footer__link"
        >
          <svg className="auth-footer__icon" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.305-.536-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
          </svg>
          GitHub
        </a>
      </div>
    </div>
  );
}

/* ─────────── Login Form ─────────── */
function LoginForm({ onFlip }) {
  const [formData, setFormData] = useState({ email: '', senha: '' });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  const { login } = useAuth();
  const { toast } = useModal();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.email) newErrors.email = 'Email é obrigatório';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Email inválido';
    if (!formData.senha) newErrors.senha = 'Senha é obrigatória';
    else if (formData.senha.length < 6) newErrors.senha = 'Senha deve ter no mínimo 6 caracteres';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsLoading(true);
    try {
      await login(formData.email, formData.senha);
      toast({ message: 'Login realizado com sucesso!', variant: 'success' });
      navigate('/dashboard');
    } catch (error) {
      const message = error.response?.data?.message || 'Erro ao fazer login';
      toast({ message, variant: 'danger' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-form-content">
      <div className="auth-form-header">
        <NexusLogo />
        <h1 className="auth-form-title">Bem-vindo ao Nexus Control</h1>
        <p className="auth-form-subtitle">Faça login para acessar sua conta</p>
      </div>

      <form onSubmit={handleSubmit} noValidate className="auth-form-body">
        <div className="auth-field">
          <div className={`auth-input-wrap ${errors.email ? 'auth-input-wrap--error' : ''}`}>
            <span className="auth-input-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="4" width="20" height="16" rx="2" />
                <path d="M2 7l10 7 10-7" />
              </svg>
            </span>
            <input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              className="auth-input"
              placeholder="Email"
              autoComplete="email"
              disabled={isLoading}
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? 'login-email-error' : undefined}
            />
          </div>
          {errors.email && <p id="login-email-error" className="auth-field-error" role="alert">{errors.email}</p>}
        </div>

        <div className="auth-field">
          <div className={`auth-input-wrap ${errors.senha ? 'auth-input-wrap--error' : ''}`}>
            <span className="auth-input-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <rect x="5" y="11" width="14" height="10" rx="2" />
                <path d="M8 11V7a4 4 0 0 1 8 0v4" />
              </svg>
            </span>
            <input
              id="senha"
              name="senha"
              type={showLoginPassword ? 'text' : 'password'}
              value={formData.senha}
              onChange={handleChange}
              className="auth-input auth-input--padded"
              placeholder="Senha"
              autoComplete="current-password"
              disabled={isLoading}
              aria-invalid={!!errors.senha}
              aria-describedby={errors.senha ? 'login-senha-error' : undefined}
            />
            <button type="button" className="auth-eye-btn" onClick={() => setShowLoginPassword(p => !p)} aria-label={showLoginPassword ? 'Ocultar senha' : 'Mostrar senha'}>
              <EyeIcon visible={showLoginPassword} />
            </button>
          </div>
          {errors.senha && <p id="login-senha-error" className="auth-field-error" role="alert">{errors.senha}</p>}
        </div>

        <button type="submit" className="auth-submit-btn" disabled={isLoading}>
          {isLoading ? <Spinner label="Entrando..." /> : 'ENTRAR'}
        </button>

        <button
          type="button"
          onClick={() => navigate('/recuperar-senha')}
          className="auth-link-btn"
        >
          Esqueci minha senha
        </button>
      </form>

      <p className="auth-switch-text">
        Não possui conta?{' '}
        <button onClick={onFlip} className="auth-switch-link" aria-label="Ir para cadastro">
          Cadastre-se
        </button>
      </p>
    </div>
  );
}

/* ─────────── Register Form ─────────── */
function RegisterForm({ onFlip }) {
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    senha: '',
    confirmarSenha: ''
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  
  const { register } = useAuth();
  const { toast } = useModal();
  const navigate = useNavigate();

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
    const passwordError = validatePassword(formData.senha);
    if (passwordError) newErrors.senha = passwordError;
    if (formData.senha !== formData.confirmarSenha) newErrors.confirmarSenha = 'As senhas não conferem';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      await register({
        nome: formData.nome.trim(),
        email: formData.email,
        senha: formData.senha
      });
      toast({ message: 'Conta criada com sucesso!', variant: 'success' });
      navigate('/dashboard');
    } catch (error) {
      const message = error.response?.data?.message || 'Erro ao criar conta';
      toast({ message, variant: 'danger' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-form-content">
      <div className="auth-form-header">
        <NexusLogo />
        <h1 className="auth-form-title">Criar Conta</h1>
        <p className="auth-form-subtitle">Preencha os dados para começar</p>
      </div>

      <form onSubmit={handleSubmit} noValidate className="auth-form-body">
        {/* Nome */}
        <div className="auth-field">
          <div className={`auth-input-wrap ${errors.nome ? 'auth-input-wrap--error' : ''}`}>
            <span className="auth-input-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="8" r="4" />
                <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
              </svg>
            </span>
            <input
              id="nome"
              name="nome"
              type="text"
              value={formData.nome}
              onChange={handleChange}
              className="auth-input"
              placeholder="Nome completo"
              autoComplete="name"
              disabled={isLoading}
              aria-invalid={!!errors.nome}
              aria-describedby={errors.nome ? 'reg-nome-error' : undefined}
            />
          </div>
          {errors.nome && <p id="reg-nome-error" className="auth-field-error" role="alert">{errors.nome}</p>}
        </div>

        {/* Email */}
        <div className="auth-field">
          <div className={`auth-input-wrap ${errors.email ? 'auth-input-wrap--error' : ''}`}>
            <span className="auth-input-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="4" width="20" height="16" rx="2" />
                <path d="M2 7l10 7 10-7" />
              </svg>
            </span>
            <input
              id="email-reg"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              className="auth-input"
              placeholder="Email"
              autoComplete="email"
              disabled={isLoading}
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? 'reg-email-error' : undefined}
            />
          </div>
          {errors.email && <p id="reg-email-error" className="auth-field-error" role="alert">{errors.email}</p>}
        </div>

        {/* Senha */}
        <div className="auth-field">
          <div className={`auth-input-wrap ${errors.senha ? 'auth-input-wrap--error' : ''}`}>
            <span className="auth-input-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <rect x="5" y="11" width="14" height="10" rx="2" />
                <path d="M8 11V7a4 4 0 0 1 8 0v4" />
              </svg>
            </span>
            <input
              id="senha-reg"
              name="senha"
              type={showPassword ? 'text' : 'password'}
              value={formData.senha}
              onChange={handleChange}
              className="auth-input auth-input--padded"
              placeholder="Senha"
              autoComplete="new-password"
              disabled={isLoading}
              aria-invalid={!!errors.senha}
              aria-describedby={errors.senha ? 'reg-senha-error' : undefined}
            />
            <button type="button" className="auth-eye-btn" onClick={() => setShowPassword(p => !p)} aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}>
              <EyeIcon visible={showPassword} />
            </button>
          </div>
          {errors.senha && <p id="reg-senha-error" className="auth-field-error" role="alert">{errors.senha}</p>}
        </div>

        {/* Confirmar Senha */}
        <div className="auth-field">
          <div className={`auth-input-wrap ${errors.confirmarSenha ? 'auth-input-wrap--error' : ''}`}>
            <span className="auth-input-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <rect x="5" y="11" width="14" height="10" rx="2" />
                <path d="M8 11V7a4 4 0 0 1 8 0v4" />
                <path d="M9 16l2 2 4-4" />
              </svg>
            </span>
            <input
              id="confirmarSenha"
              name="confirmarSenha"
              type={showConfirmation ? 'text' : 'password'}
              value={formData.confirmarSenha}
              onChange={handleChange}
              className="auth-input auth-input--padded"
              placeholder="Confirmar senha"
              autoComplete="new-password"
              disabled={isLoading}
              aria-invalid={!!errors.confirmarSenha}
              aria-describedby={errors.confirmarSenha ? 'reg-confirmar-error' : undefined}
            />
            <button type="button" className="auth-eye-btn" onClick={() => setShowConfirmation(p => !p)} aria-label={showConfirmation ? 'Ocultar senha' : 'Mostrar senha'}>
              <EyeIcon visible={showConfirmation} />
            </button>
          </div>
          {errors.confirmarSenha && <p id="reg-confirmar-error" className="auth-field-error" role="alert">{errors.confirmarSenha}</p>}
        </div>

        <button type="submit" className="auth-submit-btn" disabled={isLoading}>
          {isLoading ? <Spinner label="Criando conta..." /> : 'CRIAR CONTA'}
        </button>
      </form>

      <p className="auth-switch-text">
        Já possui conta?{' '}
        <button onClick={onFlip} className="auth-switch-link" aria-label="Ir para login">
          Entrar
        </button>
      </p>
    </div>
  );
}

/* ─────────── Shared helpers ─────────── */
function NexusLogo() {
  return (
    <div className="auth-logo">
      <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="16" cy="16" r="14" stroke="currentColor" strokeWidth="2" />
        <path d="M16 8V24M8 16H24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <circle cx="16" cy="16" r="6" stroke="currentColor" strokeWidth="1.5" opacity="0.5" />
      </svg>
    </div>
  );
}

function EyeIcon({ visible }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {visible ? (
        <>
          <path d="M3 3l18 18M10.6 10.6a2 2 0 0 0 2.8 2.8M9.9 5.2A10.8 10.8 0 0 1 12 5c5.2 0 8.7 4.4 9.8 7a15.6 15.6 0 0 1-3.1 4.4M6.2 6.2C4.4 7.5 3.2 9.3 2.2 12c1.1 2.6 4.6 7 9.8 7 1 0 2-.2 2.9-.5" />
        </>
      ) : (
        <path d="M2.2 12C3.3 9.4 6.8 5 12 5s8.7 4.4 9.8 7c-1.1 2.6-4.6 7-9.8 7s-8.7-4.4-9.8-7Z M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
      )}
    </svg>
  );
}

function Spinner({ label }) {
  return (
    <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
      <svg style={{ width: '20px', height: '20px', animation: 'spin 1s linear infinite' }} fill="none" viewBox="0 0 24 24">
        <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
      </svg>
      {label}
    </span>
  );
}