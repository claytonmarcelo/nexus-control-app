import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

function Login() {
  const [currentStep, setCurrentStep] = useState('login'); // 'login', 'register', 'forgot'
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) navigate('/dashboard');
  }, [isAuthenticated, navigate]);

  // Se vir de /register, muda pra step de registro
  useEffect(() => {
    if (searchParams.get('register') === 'true') {
      setCurrentStep('register');
    }
  }, [searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-bg p-4">
      <div className="auth-circle-container">
        {/* Animated 3D Flip Container */}
        <div
          className="auth-flip-wrapper"
          style={{
            transformStyle: 'preserve-3d',
            transform:
              currentStep === 'login'
                ? 'rotateY(0deg)'
                : currentStep === 'register'
                ? 'rotateY(240deg)'
                : 'rotateY(120deg)',
          }}
        >
          {/* Face 1: Login */}
          <div className="auth-flip-face" style={{ backfaceVisibility: 'hidden' }}>
            <LoginForm onNavigate={setCurrentStep} />
          </div>

          {/* Face 2: Forgot Password */}
          <div
            className="auth-flip-face"
            style={{
              backfaceVisibility: 'hidden',
              transform: 'rotateY(120deg)',
            }}
          >
            <ForgotForm onNavigate={setCurrentStep} />
          </div>

          {/* Face 3: Register */}
          <div
            className="auth-flip-face"
            style={{
              backfaceVisibility: 'hidden',
              transform: 'rotateY(240deg)',
            }}
          >
            <RegisterForm onNavigate={setCurrentStep} />
          </div>
        </div>
      </div>
    </div>
  );
}

function LoginForm({ onNavigate }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Erro ao fazer login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fp-content">
      <div className="auth-logo" style={{ marginBottom: '12px' }}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#D4AF37' }}>
          <rect x="5" y="11" width="14" height="10" rx="2" />
          <path d="M8 11V7a4 4 0 0 1 8 0v4" />
          <circle cx="12" cy="16" r="1.2" fill="currentColor" stroke="none" />
        </svg>
      </div>

      <div className="auth-form-header" style={{ marginBottom: '16px' }}>
        <h1 className="auth-form-title">Nexus Control</h1>
        <p className="auth-form-subtitle">Faça login para acessar</p>
      </div>

      <form onSubmit={handleSubmit} noValidate className="fp-form">
        {error && <p className="auth-field-error" role="alert">{error}</p>}

        <div className="auth-field">
          <div className="auth-input-wrap">
            <span className="auth-input-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="4" width="20" height="16" rx="2" />
                <path d="M2 7l10 7 10-7" />
              </svg>
            </span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="auth-input"
              placeholder="seu@email.com"
              autoComplete="email"
              required
              disabled={loading}
            />
          </div>
        </div>

        <div className="auth-field">
          <div className="auth-input-wrap">
            <span className="auth-input-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <rect x="5" y="11" width="14" height="10" rx="2" />
                <path d="M8 11V7a4 4 0 0 1 8 0v4" />
              </svg>
            </span>
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="auth-input auth-input--padded"
              placeholder="••••••••"
              autoComplete="current-password"
              required
              disabled={loading}
            />
            <button
              type="button"
              className="auth-eye-btn"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
            >
              <EyeIcon visible={showPassword} />
            </button>
          </div>
        </div>

        <button type="submit" className="auth-submit-btn" disabled={loading} style={{ marginTop: '12px' }}>
          {loading ? 'Entrando...' : 'ENTRAR'}
        </button>
      </form>



      <button
        type="button"
        onClick={() => onNavigate('forgot')}
        className="auth-link-btn"
        style={{ marginTop: '12px' }}
      >
        Não tem conta? <strong>Criar nova</strong>
      </button>

      <button
        type="button"
        onClick={() => onNavigate('register')}
        className="auth-link-btn"
        style={{ marginTop: '8px' }}
      >
        Esqueci minha <strong>senha</strong>
      </button>
    </div>
  );
}

function RegisterForm({ onNavigate }) {
  const [formData, setFormData] = useState({ nome: '', email: '', senha: '', confirm: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.senha !== formData.confirm) {
      setError('As senhas não coincidem');
      return;
    }

    setLoading(true);

    try {
      await register({
        nome: formData.nome,
        email: formData.email,
        senha: formData.senha,
      });
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Erro ao criar conta');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fp-content">
      <div className="auth-logo" style={{ marginBottom: '12px' }}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#D4AF37' }}>
          <path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      </div>

      <div className="auth-form-header" style={{ marginBottom: '16px' }}>
        <h1 className="auth-form-title">Criar Conta</h1>
        <p className="auth-form-subtitle" style={{ maxWidth: '240px', lineHeight: '1.4' }}>Junte-se ao Nexus Control</p>
      </div>

      <form onSubmit={handleSubmit} noValidate className="fp-form">
        {error && <p className="auth-field-error" role="alert">{error}</p>}

        <div className="auth-field">
          <div className="auth-input-wrap">
            <span className="auth-input-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </span>
            <input
              type="text"
              name="nome"
              value={formData.nome}
              onChange={handleChange}
              className="auth-input"
              placeholder="Seu nome"
              required
              disabled={loading}
            />
          </div>
        </div>

        <div className="auth-field">
          <div className="auth-input-wrap">
            <span className="auth-input-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="4" width="20" height="16" rx="2" />
                <path d="M2 7l10 7 10-7" />
              </svg>
            </span>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="auth-input"
              placeholder="seu@email.com"
              autoComplete="email"
              required
              disabled={loading}
            />
          </div>
        </div>

        <div className="auth-field">
          <div className="auth-input-wrap">
            <span className="auth-input-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <rect x="5" y="11" width="14" height="10" rx="2" />
                <path d="M8 11V7a4 4 0 0 1 8 0v4" />
              </svg>
            </span>
            <input
              type={showPassword ? 'text' : 'password'}
              name="senha"
              value={formData.senha}
              onChange={handleChange}
              className="auth-input auth-input--padded"
              placeholder="••••••••"
              autoComplete="new-password"
              required
              disabled={loading}
            />
            <button
              type="button"
              className="auth-eye-btn"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
            >
              <EyeIcon visible={showPassword} />
            </button>
          </div>
        </div>

        <div className="auth-field">
          <div className="auth-input-wrap">
            <span className="auth-input-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <rect x="5" y="11" width="14" height="10" rx="2" />
                <path d="M8 11V7a4 4 0 0 1 8 0v4" />
                <path d="M9 16l2 2 4-4" />
              </svg>
            </span>
            <input
              type="password"
              name="confirm"
              value={formData.confirm}
              onChange={handleChange}
              className="auth-input"
              placeholder="Confirmar senha"
              autoComplete="new-password"
              required
              disabled={loading}
            />
          </div>
        </div>

        <button type="submit" className="auth-submit-btn" disabled={loading} style={{ marginTop: '12px' }}>
          {loading ? 'Criando...' : 'CRIAR CONTA'}
        </button>
      </form>

      <button
        type="button"
        onClick={() => onNavigate('login')}
        className="auth-link-btn"
        style={{ marginTop: '12px' }}
      >
        Já tem conta? <strong>Fazer login</strong>
      </button>
    </div>
  );
}

function ForgotForm({ onNavigate }) {
  const [step, setStep] = useState('request'); // 'request', 'reset', 'success'
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmacao, setConfirmacao] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const requestReset = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);
    try {
      // TODO: Chamar endpoint
      setMessage('Se este email estiver cadastrado, as instruções foram preparadas.');
      setStep('reset');
    } catch (requestError) {
      setError('Não foi possível iniciar a recuperação agora.');
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (event) => {
    event.preventDefault();
    if (senha !== confirmacao) { 
      setError('As senhas não conferem');
      return;
    }
    setError('');
    setLoading(true);
    try {
      // TODO: Chamar endpoint
      setMessage('Senha redefinida com sucesso. Agora você já pode acessar o Nexus Control.');
      setStep('success');
    } catch (resetError) {
      setError('Não foi possível redefinir a senha.');
    } finally {
      setLoading(false);
    }
  };

  const icons = {
    request: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="8" cy="15" r="3.5" />
        <path d="m10.5 12.5 8-8M15 7l2 2m-5 1 2 2" />
      </svg>
    ),
    reset: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="5" y="11" width="14" height="10" rx="2" />
        <path d="M8 11V7a4 4 0 0 1 8 0v4" />
        <circle cx="12" cy="16" r="1.2" fill="currentColor" stroke="none" />
      </svg>
    ),
    success: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="9" />
        <path d="M8 12l3 3 5-5" />
      </svg>
    ),
  };

  const titles = { request: 'Recupere seu acesso', reset: 'Crie uma nova senha', success: 'Acesso recuperado' };
  const subtitles = {
    request: 'Informe seu email cadastrado para iniciar.',
    reset: 'Defina uma senha segura para voltar.',
    success: message,
  };

  return (
    <div className="fp-content">
      <div className="auth-logo" style={{ marginBottom: '12px', color: '#D4AF37' }}>
        {icons[step]}
      </div>

      <div className="auth-form-header" style={{ marginBottom: '16px' }}>
        <h1 className="auth-form-title">{titles[step]}</h1>
        <p className="auth-form-subtitle" style={{ maxWidth: '240px', lineHeight: '1.4' }}>{subtitles[step]}</p>
      </div>

      {step === 'request' && (
        <form onSubmit={requestReset} noValidate className="fp-form">
          <div className="auth-field">
            <div className="auth-input-wrap">
              <span className="auth-input-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="4" width="20" height="16" rx="2" />
                  <path d="M2 7l10 7 10-7" />
                </svg>
              </span>
              <input
                id="recovery-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="auth-input"
                placeholder="seu@email.com"
                autoComplete="email"
                required
                disabled={loading}
              />
            </div>
          </div>
          {message && <p className="auth-field-error" style={{ color: '#D4AF37' }} role="status">{message}</p>}
          {error && <p className="auth-field-error" role="alert">{error}</p>}
          <button type="submit" className="auth-submit-btn" disabled={loading} style={{ marginTop: '12px' }}>
            {loading ? 'Preparando...' : 'CONTINUAR'}
          </button>
        </form>
      )}

      {step === 'reset' && (
        <form onSubmit={resetPassword} noValidate className="fp-form">
          <div className="auth-field">
            <div className="auth-input-wrap">
              <span className="auth-input-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="5" y="11" width="14" height="10" rx="2" />
                  <path d="M8 11V7a4 4 0 0 1 8 0v4" />
                </svg>
              </span>
              <input
                id="recovery-password"
                type={showPassword ? 'text' : 'password'}
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                className="auth-input auth-input--padded"
                placeholder="Nova senha"
                autoComplete="new-password"
                required
              />
              <button type="button" className="auth-eye-btn" onClick={() => setShowPassword(p => !p)} aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}>
                <EyeIcon visible={showPassword} />
              </button>
            </div>
          </div>
          <div className="auth-field">
            <div className="auth-input-wrap">
              <span className="auth-input-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="5" y="11" width="14" height="10" rx="2" />
                  <path d="M8 11V7a4 4 0 0 1 8 0v4" />
                  <path d="M9 16l2 2 4-4" />
                </svg>
              </span>
              <input
                id="recovery-confirmation"
                type={showConfirmation ? 'text' : 'password'}
                value={confirmacao}
                onChange={(e) => setConfirmacao(e.target.value)}
                className="auth-input auth-input--padded"
                placeholder="Confirmar nova senha"
                autoComplete="new-password"
                required
              />
              <button type="button" className="auth-eye-btn" onClick={() => setShowConfirmation(p => !p)} aria-label={showConfirmation ? 'Ocultar senha' : 'Mostrar senha'}>
                <EyeIcon visible={showConfirmation} />
              </button>
            </div>
          </div>
          {error && <p className="auth-field-error" role="alert">{error}</p>}
          <button type="submit" className="auth-submit-btn" disabled={loading} style={{ marginTop: '12px' }}>
            {loading ? 'Redefinindo...' : 'REDEFINIR SENHA'}
          </button>
        </form>
      )}

      {step === 'success' && (
        <button type="button" className="auth-submit-btn" style={{ width: '80%', marginTop: '16px' }} onClick={() => onNavigate('login')}>
          VOLTAR PARA O LOGIN
        </button>
      )}

      {step !== 'success' && (
        <button
          type="button"
          onClick={() => onNavigate('login')}
          className="auth-link-btn"
          style={{ marginTop: '12px' }}
        >
          Voltar para o login
        </button>
      )}
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

export default Login;
