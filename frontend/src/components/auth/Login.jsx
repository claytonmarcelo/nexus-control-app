import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

function Login() {
  const [isFlipped, setIsFlipped] = useState(false);
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) navigate('/dashboard');
  }, [isAuthenticated, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-bg p-4">
      <div className="w-full max-w-md perspective">
        <div
          className={`relative w-full transition-transform duration-700 transform-gpu ${
            isFlipped ? 'rotateY-180' : ''
          }`}
          style={{
            transformStyle: 'preserve-3d',
            transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
          }}
        >
          {!isFlipped ? (
            <LoginForm onFlip={() => setIsFlipped(true)} />
          ) : (
            <RegisterForm onFlip={() => setIsFlipped(false)} />
          )}
        </div>
      </div>
    </div>
  );
}

function LoginForm({ onFlip }) {
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
    <div
      className="glass rounded-3xl p-8 border border-dark-border"
      style={{ backfaceVisibility: 'hidden' }}
    >
      <div className="flex items-center justify-center mb-8">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-nexus-500 to-nexus-700 flex items-center justify-center">
          <span className="text-3xl">🛡️</span>
        </div>
      </div>

      <h1 className="text-3xl font-bold text-center text-white mb-2">Nexus Control</h1>
      <p className="text-center text-nexus-400 mb-8">Faça login para acessar</p>

      <form onSubmit={handleSubmit} className="space-y-4 mb-6">
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

      {/* Demo Login Section */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <div className="flex-1 h-px bg-dark-border"></div>
          <span className="text-xs text-nexus-400 font-medium">ACESSO DEMO</span>
          <div className="flex-1 h-px bg-dark-border"></div>
        </div>

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

      <button
        type="button"
        onClick={onFlip}
        className="w-full text-center text-sm text-nexus-400 hover:text-nexus-300 transition-colors"
      >
        Não tem conta? <strong>Criar nova</strong>
      </button>
    </div>
  );
}

function RegisterForm({ onFlip }) {
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
    <div
      className="glass rounded-3xl p-8 border border-dark-border"
      style={{ backfaceVisibility: 'hidden' }}
    >
      <div className="flex items-center justify-center mb-8">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-nexus-500 to-nexus-700 flex items-center justify-center">
          <span className="text-3xl">✨</span>
        </div>
      </div>

      <h1 className="text-3xl font-bold text-center text-white mb-2">Criar Conta</h1>
      <p className="text-center text-nexus-400 mb-8">Junte-se ao Nexus Control</p>

      <form onSubmit={handleSubmit} className="space-y-4 mb-6">
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
          />
        </div>

        <button type="submit" className="btn btn-primary w-full" disabled={loading}>
          {loading ? 'Criando...' : 'Criar Conta'}
        </button>
      </form>

      <button
        type="button"
        onClick={onFlip}
        className="w-full text-center text-sm text-nexus-400 hover:text-nexus-300 transition-colors"
      >
        Já tem conta? <strong>Fazer login</strong>
      </button>
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
