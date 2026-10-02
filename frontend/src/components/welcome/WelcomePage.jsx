import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';

/* ─── Animated Particles Background ─── */
function ParticleField() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationId;
    let particles = [];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    class Particle {
      constructor() {
        this.reset();
      }
      reset() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 2 + 0.5;
        this.speedX = (Math.random() - 0.5) * 0.4;
        this.speedY = (Math.random() - 0.5) * 0.4;
        this.opacity = Math.random() * 0.5 + 0.1;
        this.pulseSpeed = Math.random() * 0.02 + 0.005;
        this.pulseOffset = Math.random() * Math.PI * 2;
      }
      update(time) {
        this.x += this.speedX;
        this.y += this.speedY;
        this.opacity = 0.15 + Math.sin(time * this.pulseSpeed + this.pulseOffset) * 0.15;
        if (this.x < -10 || this.x > canvas.width + 10 || this.y < -10 || this.y > canvas.height + 10) {
          this.reset();
        }
      }
      draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(212, 175, 55, ${this.opacity})`;
        ctx.fill();
      }
    }

    const count = Math.min(80, Math.floor((canvas.width * canvas.height) / 15000));
    for (let i = 0; i < count; i++) particles.push(new Particle());

    let time = 0;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      time++;
      particles.forEach(p => { p.update(time); p.draw(); });

      // Draw connections
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(212, 175, 55, ${0.06 * (1 - dist / 120)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }
      animationId = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 0 }}
      aria-hidden="true"
    />
  );
}

/* ─── Animated Counter ─── */
function AnimatedNumber({ target, suffix = '', duration = 2000 }) {
  const [value, setValue] = useState(0);
  const ref = useRef(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;
          const start = performance.now();
          const step = (now) => {
            const progress = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setValue(Math.floor(eased * target));
            if (progress < 1) requestAnimationFrame(step);
          };
          requestAnimationFrame(step);
        }
      },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target, duration]);

  return <span ref={ref}>{value}{suffix}</span>;
}

/* ─── Nexus Logo SVG ─── */
function NexusLogo({ className = 'w-10 h-10' }) {
  return (
    <svg className={className} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Nexus Control">
      <defs>
        <linearGradient id="nexusGradW" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#E5C158" />
          <stop offset="100%" stopColor="#B8962E" />
        </linearGradient>
        <filter id="nexusGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="1.5" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>
      {/* Outer ring */}
      <circle cx="24" cy="24" r="21" stroke="url(#nexusGradW)" strokeWidth="1.5" strokeOpacity="0.4" fill="none" />
      {/* Central hub */}
      <circle cx="24" cy="24" r="4.5" fill="url(#nexusGradW)" filter="url(#nexusGlow)" />
      {/* 6 connection nodes + lines */}
      {/* Top */}
      <line x1="24" y1="19.5" x2="24" y2="8" stroke="url(#nexusGradW)" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="24" cy="7" r="2.5" fill="url(#nexusGradW)" />
      {/* Bottom */}
      <line x1="24" y1="28.5" x2="24" y2="40" stroke="url(#nexusGradW)" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="24" cy="41" r="2.5" fill="url(#nexusGradW)" />
      {/* Top-Right */}
      <line x1="27.9" y1="21.75" x2="36.5" y2="16.8" stroke="url(#nexusGradW)" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="37.9" cy="16" r="2.5" fill="url(#nexusGradW)" />
      {/* Bottom-Left */}
      <line x1="20.1" y1="26.25" x2="11.5" y2="31.2" stroke="url(#nexusGradW)" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="10.1" cy="32" r="2.5" fill="url(#nexusGradW)" />
      {/* Top-Left */}
      <line x1="20.1" y1="21.75" x2="11.5" y2="16.8" stroke="url(#nexusGradW)" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="10.1" cy="16" r="2.5" fill="url(#nexusGradW)" />
      {/* Bottom-Right */}
      <line x1="27.9" y1="26.25" x2="36.5" y2="31.2" stroke="url(#nexusGradW)" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="37.9" cy="32" r="2.5" fill="url(#nexusGradW)" />
    </svg>
  );
}

/* ─── Feature Cards Data ─── */
const FEATURES = [
  {
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      </svg>
    ),
    title: 'Catálogo Inteligente',
    desc: 'Gestão completa de produtos e serviços de TI com categorias, busca avançada e controle de estoque em tempo real.',
  },
  {
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    title: 'Segurança Corporativa',
    desc: 'Autenticação multifator com controle granular de acessos por perfil e proteções avançadas contra acessos não autorizados.',
  },
  {
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-1.2 2.4A1 1 0 006.7 17H17m0 0a2 2 0 100 4 2 2 0 000-4Zm-10 0a2 2 0 100 4 2 2 0 000-4Z" />
      </svg>
    ),
    title: 'Checkout & Aluguel',
    desc: 'Sistema completo de e-commerce com aluguel por dias, pagamento via Pix e Cartão, e recibos automáticos.',
  },
  {
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 15a4 4 0 004 4h9a5 5 0 001-9.9M15 13a3 3 0 00-3-3h-1.5A4.5 4.5 0 006 14.5" />
      </svg>
    ),
    title: 'Infraestrutura Cloud',
    desc: 'Plataforma em nuvem com alta disponibilidade, escalabilidade automática e monitoramento contínuo para garantir operação ininterrupta.',
  },
];

/* ─── Stats Data ─── */
const STATS = [
  { value: 99, suffix: '%', label: 'Disponibilidade garantida' },
  { value: 24, suffix: '/7', label: 'Suporte contínuo' },
  { value: 100, suffix: '%', label: 'Segurança dos dados' },
  { value: 3, suffix: 's', label: 'Tempo médio de resposta' },
];

/* ═══════════════════════════════════════════════════════════
   WELCOME PAGE COMPONENT
   ═══════════════════════════════════════════════════════════ */
export default function WelcomePage() {
  const { theme, toggleTheme } = useTheme();
  const [scrollY, setScrollY] = useState(0);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setLoaded(true);
    const onScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="welcome-page" data-loaded={loaded}>
      <ParticleField />

      {/* ── Navbar ── */}
      <nav
        className="welcome-navbar"
        style={{
          backdropFilter: scrollY > 50 ? 'blur(16px) saturate(180%)' : 'none',
          background: scrollY > 50 ? 'var(--bg-card)' : 'transparent',
          borderBottom: scrollY > 50 ? '1px solid var(--border-color)' : '1px solid transparent',
        }}
      >
        <div className="welcome-navbar-inner">
          <div className="welcome-brand">
            <NexusLogo className="w-9 h-9" />
            <div>
              <span className="welcome-brand-name">Nexus Control</span>
              <span className="welcome-brand-tag">Enterprise Platform</span>
            </div>
          </div>
          <div className="welcome-nav-actions">
            <button
              type="button"
              onClick={toggleTheme}
              className="welcome-theme-btn"
              aria-label={theme === 'dark' ? 'Ativar tema claro' : 'Ativar tema escuro'}
            >
              {theme === 'dark' ? '☼' : '☾'}
            </button>
            <Link to="/login" className="welcome-access-btn" id="welcome-access-btn">
              <span>Acessar</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero Section ── */}
      <section className="welcome-hero">
        <div className="welcome-hero-inner">
          {/* Decorative orbs */}
          <div className="welcome-orb welcome-orb-1" aria-hidden="true" />
          <div className="welcome-orb welcome-orb-2" aria-hidden="true" />

          <div
            className="welcome-hero-content"
            style={{ transform: `translateY(${scrollY * 0.15}px)`, opacity: Math.max(0, 1 - scrollY / 600) }}
          >
            <span className="welcome-badge">
              <span className="welcome-badge-dot" />
              Plataforma Corporativa de TI
            </span>

            <h1 className="welcome-title">
              <span className="welcome-title-line">Controle Total dos</span>
              <span className="welcome-title-line welcome-title-accent">seus Ativos de TI</span>
            </h1>

            <p className="welcome-subtitle">
              Gerencie seu catálogo de hardware, serviços e locações com uma plataforma corporativa segura, escalável e projetada para máximo controle operacional.
            </p>

            <div className="welcome-cta-group">
              <Link to="/login" className="welcome-cta-primary" id="welcome-cta-start">
                <span>Começar Agora</span>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
              <Link to="/register" className="welcome-cta-secondary" id="welcome-cta-register">
                Criar Conta Gratuita
              </Link>
            </div>
          </div>

          {/* Scroll indicator */}
          <div className="welcome-scroll-indicator" style={{ opacity: Math.max(0, 1 - scrollY / 200) }}>
            <div className="welcome-scroll-mouse">
              <div className="welcome-scroll-wheel" />
            </div>
            <span>Role para explorar</span>
          </div>
        </div>
      </section>

      {/* ── Stats Bar ── */}
      <section className="welcome-stats">
        <div className="welcome-stats-inner">
          {STATS.map((stat, i) => (
            <div key={i} className="welcome-stat-item">
              <span className="welcome-stat-value">
                <AnimatedNumber target={stat.value} suffix={stat.suffix} />
              </span>
              <span className="welcome-stat-label">{stat.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features Section ── */}
      <section className="welcome-features">
        <div className="welcome-features-inner">
          <span className="welcome-section-tag">Funcionalidades</span>
          <h2 className="welcome-section-title">
            Tudo que você precisa em<br />
            <span className="welcome-section-accent">uma única plataforma</span>
          </h2>

          <div className="welcome-features-grid">
            {FEATURES.map((feature, i) => (
              <article
                key={i}
                className="welcome-feature-card"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <div className="welcome-feature-icon">
                  {feature.icon}
                </div>
                <h3 className="welcome-feature-title">{feature.title}</h3>
                <p className="welcome-feature-desc">{feature.desc}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── Guarantees Section ── */}
      <section className="welcome-tech">
        <div className="welcome-tech-inner">
          <span className="welcome-section-tag">Por que escolher o Nexus?</span>
          <h2 className="welcome-section-title">
            Infraestrutura de TI com<br />
            <span className="welcome-section-accent">qualidade enterprise</span>
          </h2>
          <div className="welcome-tech-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginTop: '2rem' }}>
            {[
              { icon: '🛡️', title: 'Segurança de ponta a ponta', desc: 'Autenticação robusta com controle de acessos por perfil e proteção total dos seus dados.' },
              { icon: '⚡', title: 'Alta performance', desc: 'Respostas em milissegundos, operação fluida e painel sempre atualizado em tempo real.' },
              { icon: '📊', title: 'Visibilidade total', desc: 'Dashboard com indicadores de desempenho, histórico de pedidos e relatórios gerenciais.' },
              { icon: '🔧', title: 'Suporte especializado', desc: 'Equipe disponível para garantir operação contínua da sua infraestrutura sem interrupções.' },
            ].map((item, i) => (
              <div
                key={i}
                className="welcome-tech-pill"
                style={{
                  animationDelay: `${i * 80}ms`,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  gap: '0.5rem',
                  padding: '1.25rem 1.375rem',
                  borderRadius: '1rem',
                  textAlign: 'left',
                  height: 'auto',
                  minHeight: '120px',
                }}
              >
                <span style={{ fontSize: '1.5rem', lineHeight: 1 }}>{item.icon}</span>
                <span style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-primary)', lineHeight: 1.3 }}>{item.title}</span>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>{item.desc}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Final ── */}
      <section className="welcome-final-cta">
        <div className="welcome-final-cta-inner">
          <div className="welcome-orb welcome-orb-3" aria-hidden="true" />
          <h2 className="welcome-final-title">
            Pronto para assumir o controle?
          </h2>
          <p className="welcome-final-desc">
            Cadastre-se gratuitamente e comece a gerenciar seus ativos de TI com a plataforma Nexus Control.
          </p>
          <div className="welcome-cta-group" style={{ justifyContent: 'center' }}>
            <Link to="/register" className="welcome-cta-primary" id="welcome-final-register">
              <span>Criar Conta Gratuita</span>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
            <Link to="/login" className="welcome-cta-secondary">
              Já tenho conta
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="welcome-footer">
        <div className="welcome-footer-inner">
          <div className="welcome-brand" style={{ opacity: 0.7 }}>
            <NexusLogo className="w-6 h-6" />
            <span className="welcome-brand-name" style={{ fontSize: '0.875rem' }}>Nexus Control</span>
          </div>
          <span className="welcome-footer-copy">
            Desenvolvido por <strong style={{ color: 'var(--accent-gold)' }}>Clayton Marcelo</strong>
          </span>
        </div>
      </footer>
    </div>
  );
}
