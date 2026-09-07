import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { authService } from '../../services/services';
import { useTheme } from '../../contexts/ThemeContext';
import { validatePassword } from '../../utils/password';

export default function ForgotPassword() {
  const { theme, toggleTheme } = useTheme();
  const [searchParams] = useSearchParams();
  const initialToken = searchParams.get('token') || '';
  const [step, setStep] = useState(initialToken ? 'reset' : 'request');
  const [email, setEmail] = useState('');
  const [token, setToken] = useState(initialToken);
  const [senha, setSenha] = useState('');
  const [confirmacao, setConfirmacao] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const requestReset = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);
    try {
      const response = await authService.forgotPassword(email);
      const resetToken = response.data?.resetToken;
      if (resetToken) {
        setToken(resetToken);
        setStep('reset');
      } else {
        setMessage('Se este email estiver cadastrado, as instruções de recuperação foram preparadas. Verifique sua caixa de entrada.');
      }
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Não foi possível iniciar a recuperação agora.');
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (event) => {
    event.preventDefault();
    const passwordError = validatePassword(senha);
    if (passwordError) { setError(passwordError); return; }
    if (senha !== confirmacao) { setError('As senhas não conferem'); return; }
    setError('');
    setLoading(true);
    try {
      await authService.resetPassword(token, senha);
      setMessage('Senha redefinida com sucesso. Agora você já pode acessar o Nexus Control.');
      setStep('success');
    } catch (resetError) {
      setError(resetError.response?.data?.message || 'Não foi possível redefinir a senha.');
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
    request: 'Informe seu email cadastrado para iniciar a recuperação.',
    reset: 'Defina uma senha segura para voltar ao seu painel.',
    success: message,
  };

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

      <div className="auth-circle-container">
        <div className="fp-content">

          <div className="auth-logo" style={{ marginBottom: '12px' }}>
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
              {error   && <p className="auth-field-error" role="alert">{error}</p>}
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
            <button type="button" className="auth-submit-btn" style={{ width: '80%', marginTop: '16px' }} onClick={() => navigate('/login')}>
              VOLTAR PARA O LOGIN
            </button>
          )}

          {step !== 'success' && (
            <Link to="/login" className="auth-link-btn" style={{ marginTop: '16px' }}>
              Voltar para o login
            </Link>
          )}
        </div>
      </div>

      <div className="auth-footer">
        <p>Desenvolvido por <strong>Clayton Marcelo</strong></p>
        <a href="https://github.com/claytonmarcelo" target="_blank" rel="noopener noreferrer" className="auth-footer__link">
          <svg className="auth-footer__icon" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.305-.536-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
          </svg>
          GitHub
        </a>
      </div>
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