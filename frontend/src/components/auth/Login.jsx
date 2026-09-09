import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

function Login() {
  const [activeTab, setActiveTab] = useState('login'); // 'login', 'register', 'forgot'
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) navigate('/dashboard');
  }, [isAuthenticated, navigate]);

  // Se vir de /register, muda pra aba de registro
  useEffect(() => {
    if (searchParams.get('register') === 'true') {
      setActiveTab('register');
    }
  }, [searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-bg p-4">
      <div className="w-full max-w-md">
        <div className="glass rounded-3xl border border-dark-border overflow-hidden">
          {/* Tab Buttons */}
          <div className="flex border-b border-dark-border">
            <button
              onClick={() => setActiveTab('login')}
              className={`flex-1 py-3 px-4 font-semibold transition-colors ${
                activeTab === 'login'
                  ? 'bg-nexus-500/20 text-nexus-400 border-b-2 border-nexus-500'
                  : 'text-nexus-300 hover:text-white'
              }`}
            >
              Login
            </button>
            <button
              onClick={() => setActiveTab('register')}
              className={`flex-1 py-3 px-4 font-semibold transition-colors ${
                activeTab === 'register'
                  ? 'bg-nexus-500/20 text-nexus-400 border-b-2 border-nexus-500'
                  : 'text-nexus-300 hover:text-white'
              }`}
            >
              Cadastro
            </button>
            <button
              onClick={() => setActiveTab('forgot')}
              className={`flex-1 py-3 px-4 font-semibold transition-colors text-sm ${
                activeTab === 'forgot'
                  ? 'bg-nexus-500/20 text-nexus-400 border-b-2 border-nexus-500'
                  : 'text-nexus-300 hover:text-white'
              }`}
            >
              Recuperar
            </button>
          </div>

          {/* Content */}
          <div className="p-8">
            {activeTab === 'login' && <LoginForm />}
            {activeTab === 'register' && <RegisterForm />}
            {activeTab === 'forgot' && <ForgotForm />}
          </div>
        </div>
      </div>
    </div>
  );
}

function LoginForm() {
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

  const handleDemoLogin = async (demoType) => {
    setError('');
    setLoading(true);

    const demos = {
      admin: { email: 'marcelo10@gmail.com', password: '26481#' },
      funcionario: { email: 'funcionario@nexuscontrol.com', password: 'func123' },
      cliente: { email: 'cliente@nexuscontrol.com', password: 'cliente123' },
    };

    const demoUser = demos[demoType];

    try {
      await login(demoUser.email, demoUser.password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Erro ao fazer demo login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-white mb-2">Nexus Control</h1>
        <p className="text-nexus-400">Faça login para acessar</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
            {error}
          </div>
        )}

        <div>
          <label className="label">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="seu@email.com"
            className="input"
            disabled={loading}
            required
          />
        </div>

        <div>
          <label className="label">Senha</label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="input"
              disabled={loading}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-nexus-400 hover:text-nexus-300"
              disabled={loading}
            >
              <EyeIcon visible={showPassword} />
            </button>
          </div>
        </div>

        <button type="submit" className="btn btn-primary w-full" disabled={loading}>
          {loading ? 'Entrando...' : 'Entrar'}
        </button>
      </form>

      {/* Demo Buttons */}
      <div className="pt-4 border-t border-dark-border">
        <p className="text-center text-xs text-nexus-400 font-medium mb-3">ACESSO DEMO</p>
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => handleDemoLogin('admin')}
            disabled={loading}
            className="w-full btn btn-secondary text-sm bg-nexus-600/20 hover:bg-nexus-600/30 border border-nexus-500/50"
          >
            👑 Demo Admin
          </button>
          <button
            type="button"
            onClick={() => handleDemoLogin('funcionario')}
            disabled={loading}
            className="w-full btn btn-secondary text-sm bg-nexus-600/20 hover:bg-nexus-600/30 border border-nexus-500/50"
          >
            👔 Demo Funcionário
          </button>
          <button
            type="button"
            onClick={() => handleDemoLogin('cliente')}
            disabled={loading}
            className="w-full btn btn-secondary text-sm bg-nexus-600/20 hover:bg-nexus-600/30 border border-nexus-500/50"
          >
            🛍️ Demo Cliente
          </button>
        </div>
      </div>
    </div>
  );
}

function RegisterForm() {
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
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-white mb-2">Criar Conta</h1>
        <p className="text-nexus-400">Junte-se ao Nexus Control</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
            {error}
          </div>
        )}

        <div>
          <label className="label">Nome Completo</label>
          <input
            type="text"
            name="nome"
            value={formData.nome}
            onChange={handleChange}
            placeholder="Seu nome"
            className="input"
            disabled={loading}
            required
          />
        </div>

        <div>
          <label className="label">Email</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="seu@email.com"
            className="input"
            disabled={loading}
            required
          />
        </div>

        <div>
          <label className="label">Senha</label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              name="senha"
              value={formData.senha}
              onChange={handleChange}
              placeholder="••••••••"
              className="input"
              disabled={loading}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-nexus-400 hover:text-nexus-300"
              disabled={loading}
            >
              <EyeIcon visible={showPassword} />
            </button>
          </div>
        </div>

        <div>
          <label className="label">Confirmar Senha</label>
          <input
            type="password"
            name="confirm"
            value={formData.confirm}
            onChange={handleChange}
            placeholder="••••••••"
            className="input"
            disabled={loading}
            required
          />
        </div>

        <button type="submit" className="btn btn-primary w-full" disabled={loading}>
          {loading ? 'Criando...' : 'Criar Conta'}
        </button>
      </form>
    </div>
  );
}

function ForgotForm() {
  const [step, setStep] = useState('request'); // 'request', 'reset', 'success'
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [senha, setSenha] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const handleRequest = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      // TODO: Chamar endpoint de recuperação
      // const response = await authService.forgotPassword(email);
      setMessage('Se este email estiver cadastrado, as instruções foram enviadas.');
      setStep('reset');
    } catch (err) {
      setError('Erro ao processar solicitação');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e) => {
    e.preventDefault();
    setError('');

    if (senha !== confirm) {
      setError('As senhas não coincidem');
      return;
    }

    setLoading(true);

    try {
      // TODO: Chamar endpoint de reset
      // await authService.resetPassword(token, senha);
      setMessage('Senha redefinida com sucesso!');
      setStep('success');
    } catch (err) {
      setError('Erro ao redefinir senha');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-white mb-2">
          {step === 'request' ? 'Recuperar Acesso' : step === 'reset' ? 'Nova Senha' : 'Sucesso!'}
        </h1>
        <p className="text-nexus-400 text-sm">
          {step === 'request' && 'Informe seu email para recuperar sua senha'}
          {step === 'reset' && 'Crie uma nova senha segura'}
          {step === 'success' && 'Sua senha foi redefinida com sucesso'}
        </p>
      </div>

      {step === 'request' && (
        <form onSubmit={handleRequest} className="space-y-4">
          {error && <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">{error}</div>}
          {message && <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg text-green-400 text-sm">{message}</div>}

          <div>
            <label className="label">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              className="input"
              disabled={loading}
              required
            />
          </div>

          <button type="submit" className="btn btn-primary w-full" disabled={loading}>
            {loading ? 'Processando...' : 'Continuar'}
          </button>
        </form>
      )}

      {step === 'reset' && (
        <form onSubmit={handleReset} className="space-y-4">
          {error && <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">{error}</div>}

          <div>
            <label className="label">Nova Senha</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                placeholder="••••••••"
                className="input"
                disabled={loading}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-nexus-400 hover:text-nexus-300"
              >
                <EyeIcon visible={showPassword} />
              </button>
            </div>
          </div>

          <div>
            <label className="label">Confirmar Senha</label>
            <div className="relative">
              <input
                type={showConfirm ? 'text' : 'password'}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="••••••••"
                className="input"
                disabled={loading}
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-nexus-400 hover:text-nexus-300"
              >
                <EyeIcon visible={showConfirm} />
              </button>
            </div>
          </div>

          <button type="submit" className="btn btn-primary w-full" disabled={loading}>
            {loading ? 'Redefinindo...' : 'Redefinir Senha'}
          </button>
        </form>
      )}

      {step === 'success' && (
        <div className="text-center space-y-4">
          <p className="text-nexus-400">Sua senha foi alterada com sucesso.</p>
          <button
            onClick={() => { setStep('request'); setEmail(''); setSenha(''); setConfirm(''); }}
            className="btn btn-primary w-full"
          >
            Voltar para Login
          </button>
        </div>
      )}
    </div>
  );
}

function EyeIcon({ visible }) {
  return visible ? (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  ) : (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-4.803m5.596-3.856a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

export default Login;
