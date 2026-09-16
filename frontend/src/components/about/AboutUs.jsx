import React, { useState } from 'react';
import { Link } from 'react-router-dom';

function ChevronDownIcon({ size = 20, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <polyline points="6 9 12 15 18 9"></polyline>
    </svg>
  );
}

function CodeIcon({ className = 'w-5 h-5' }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
    </svg>
  );
}

function ServerIcon({ className = 'w-5 h-5' }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
    </svg>
  );
}

function DatabaseIcon({ className = 'w-5 h-5' }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
    </svg>
  );
}

function CloudIcon({ className = 'w-5 h-5' }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 001-9.9M15 13a3 3 0 00-3-3h-1.5A4.5 4.5 0 006 14.5" />
    </svg>
  );
}

function ShieldIcon({ className = 'w-5 h-5' }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  );
}

function UserIcon({ className = 'w-5 h-5' }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  );
}

export default function AboutUs() {
  const [activeTab, setActiveTab] = useState('arquitetura');
  const [expandedSection, setExpandedSection] = useState('fullstack');

  const toggleSection = (section) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  return (
    <div className="min-h-screen py-8 md:py-16 animate-fade-in">
      <div className="max-w-6xl mx-auto px-4 md:px-8">
        {/* Main Header */}
        <div className="mb-10 text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-nexus-500/30 bg-nexus-500/10 px-4 py-1.5 text-xs font-semibold text-nexus-300 backdrop-blur-md mb-4">
            <ShieldIcon className="w-4 h-4 text-nexus-400" />
            Documentação Técnica & Arquitetura de Software
          </span>
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4 bg-gradient-to-r from-white via-nexus-200 to-nexus-400 bg-clip-text text-transparent">
            Quem Somos — Nexus Control App
          </h1>
          <p className="text-base md:text-lg text-nexus-300 max-w-3xl mx-auto leading-relaxed">
            Plataforma corporativa full-stack para gestão de ativos de TI, catálogo e-commerce e controle administrativo em tempo real.
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap justify-center gap-2 mb-10 border-b border-dark-border/80 pb-4">
          <button
            onClick={() => setActiveTab('arquitetura')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              activeTab === 'arquitetura'
                ? 'bg-nexus-500 text-dark-bg shadow-gold'
                : 'bg-dark-hover text-nexus-300 hover:text-white border border-dark-border'
            }`}
          >
            <CodeIcon className="w-4 h-4" />
            Arquitetura & Stack
          </button>
          <button
            onClick={() => setActiveTab('seguranca')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              activeTab === 'seguranca'
                ? 'bg-nexus-500 text-dark-bg shadow-gold'
                : 'bg-dark-hover text-nexus-300 hover:text-white border border-dark-border'
            }`}
          >
            <ShieldIcon className="w-4 h-4" />
            Segurança & RBAC
          </button>
          <button
            onClick={() => setActiveTab('database')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              activeTab === 'database'
                ? 'bg-nexus-500 text-dark-bg shadow-gold'
                : 'bg-dark-hover text-nexus-300 hover:text-white border border-dark-border'
            }`}
          >
            <DatabaseIcon className="w-4 h-4" />
            Banco de Dados & Modelo
          </button>
          <button
            onClick={() => setActiveTab('cloud')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              activeTab === 'cloud'
                ? 'bg-nexus-500 text-dark-bg shadow-gold'
                : 'bg-dark-hover text-nexus-300 hover:text-white border border-dark-border'
            }`}
          >
            <CloudIcon className="w-4 h-4" />
            Infraestrutura AWS Cloud
          </button>
          <button
            onClick={() => setActiveTab('desenvolvedor')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              activeTab === 'desenvolvedor'
                ? 'bg-nexus-500 text-dark-bg shadow-gold'
                : 'bg-dark-hover text-nexus-300 hover:text-white border border-dark-border'
            }`}
          >
            <UserIcon className="w-4 h-4" />
            Desenvolvedor & Trajetória
          </button>
        </div>

        {/* Tab 1: Arquitetura & Stack */}
        {activeTab === 'arquitetura' && (
          <div className="space-y-6 animate-fade-in">
            <div className="glass rounded-3xl p-6 md:p-8 border border-nexus-500/20">
              <h2 className="text-2xl font-bold text-white mb-3 flex items-center gap-3">
                <CodeIcon className="w-7 h-7 text-nexus-400" />
                Arquitetura de Software Monorepo (Clean Architecture)
              </h2>
              <p className="text-nexus-300 text-sm md:text-base leading-relaxed mb-6">
                O Nexus Control foi projetado sob os princípios da <strong>Clean Architecture</strong> e separação de responsabilidades em camadas desacopladas.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="card p-6 border-l-4 border-l-nexus-500">
                  <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                    <CodeIcon className="w-5 h-5 text-nexus-400" />
                    Frontend (React 18 SPA)
                  </h3>
                  <ul className="space-y-2 text-xs md:text-sm text-nexus-300">
                    <li>● <strong>Framework:</strong> React 18 + Vite (Build rápido & Hot Reload)</li>
                    <li>● <strong>Estilização:</strong> Vanilla CSS + Tailwind CSS (Design System Gourmet)</li>
                    <li>● <strong>Gerenciamento de Estado:</strong> Context API (`AuthContext`, `CartContext`, `ModalContext`, `ThemeProvider`)</li>
                    <li>● <strong>Otimização:</strong> Code-Splitting com `lazy()` e `Suspense` (13 Lazy Chunks, inicial bundle 405KB)</li>
                    <li>● <strong>Testes de Componentes:</strong> Vitest + React Testing Library (23 casos de teste automatizados)</li>
                  </ul>
                </div>

                <div className="card p-6 border-l-4 border-l-emerald-500">
                  <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                    <ServerIcon className="w-5 h-5 text-emerald-400" />
                    Backend API (Node.js & TypeScript)
                  </h3>
                  <ul className="space-y-2 text-xs md:text-sm text-nexus-300">
                    <li>● <strong>Runtime & Linguagem:</strong> Node.js ES Modules + TypeScript 5</li>
                    <li>● <strong>Framework Web:</strong> Express.js 4 (Controllers, Middleware, Presentation Routes)</li>
                    <li>● <strong>Camadas Decopladas:</strong> Domain (Regras de negócio), Application, Infrastructure (Queries SQL), Presentation</li>
                    <li>● <strong>Testes de Integração E2E:</strong> Jest + Supertest (49 suítes de teste de integração backend)</li>
                    <li>● <strong>Logging & Telemetria:</strong> Morgan logger + Express Validator</li>
                  </ul>
                </div>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
                <div className="bg-dark-bg/80 border border-dark-border p-4 rounded-2xl text-center">
                  <div className="text-nexus-400 text-2xl font-bold">100%</div>
                  <div className="text-nexus-500 text-xs mt-1">Pass nos Testes (72/72)</div>
                </div>
                <div className="bg-dark-bg/80 border border-dark-border p-4 rounded-2xl text-center">
                  <div className="text-emerald-400 text-2xl font-bold">13</div>
                  <div className="text-nexus-500 text-xs mt-1">Chunks Code-Splitting</div>
                </div>
                <div className="bg-dark-bg/80 border border-dark-border p-4 rounded-2xl text-center">
                  <div className="text-sky-400 text-2xl font-bold">3.5s</div>
                  <div className="text-nexus-500 text-xs mt-1">Tempo Total de Build</div>
                </div>
                <div className="bg-dark-bg/80 border border-dark-border p-4 rounded-2xl text-center">
                  <div className="text-purple-400 text-2xl font-bold">7 Rotas</div>
                  <div className="text-nexus-500 text-xs mt-1">Matriz RBAC por Perfil</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Segurança & RBAC */}
        {activeTab === 'seguranca' && (
          <div className="space-y-6 animate-fade-in">
            <div className="glass rounded-3xl p-6 md:p-8 border border-nexus-500/20">
              <h2 className="text-2xl font-bold text-white mb-3 flex items-center gap-3">
                <ShieldIcon className="w-7 h-7 text-nexus-400" />
                Segurança, Autenticação JWT e Controle de Acesso (RBAC)
              </h2>
              <p className="text-nexus-300 text-sm md:text-base leading-relaxed mb-6">
                A segurança do Nexus Control é construída em múltiplas camadas de proteção no cliente e no servidor.
              </p>

              <div className="space-y-4">
                <div className="card p-5 border-l-4 border-l-amber-500">
                  <h3 className="font-bold text-white text-base mb-2">1. Autenticação Dupla por Tokens (JWT + Auto-Refresh)</h3>
                  <p className="text-xs md:text-sm text-nexus-300 leading-relaxed">
                    O login gera um <strong>Access Token (validez de 24h)</strong> e um <strong>Refresh Token (validez de 7 dias)</strong>. Na expiração transparente do token de acesso, o interceptor do frontend enfileira requisições pendentes, renova os tokens e reexecuta as chamadas sem desconectar o usuário.
                  </p>
                </div>

                <div className="card p-5 border-l-4 border-l-sky-500">
                  <h3 className="font-bold text-white text-base mb-2">2. Controle de Acesso Baseado em Funções (RBAC - 3 Perfis)</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
                    <div className="bg-dark-bg p-3 rounded-xl border border-sky-400/20">
                      <span className="text-sky-300 font-bold text-xs">CLIENTE</span>
                      <p className="text-[11px] text-nexus-400 mt-1">Acesso ao catálogo, adição ao carrinho e checkout automático (Pix e Cartão).</p>
                    </div>
                    <div className="bg-dark-bg p-3 rounded-xl border border-emerald-400/20">
                      <span className="text-emerald-300 font-bold text-xs">FUNCIONÁRIO</span>
                      <p className="text-[11px] text-nexus-400 mt-1">Operação de catálogo, criação e edição de produtos/serviços.</p>
                    </div>
                    <div className="bg-dark-bg p-3 rounded-xl border border-nexus-400/20">
                      <span className="text-nexus-300 font-bold text-xs">ADMINISTRADOR</span>
                      <p className="text-[11px] text-nexus-400 mt-1">Controle total, alteração de permissões por página, gestão de usuários e métricas.</p>
                    </div>
                  </div>
                </div>

                <div className="card p-5 border-l-4 border-l-red-500">
                  <h3 className="font-bold text-white text-base mb-2">3. Proteção Contra Ataques & Validações</h3>
                  <ul className="space-y-1.5 text-xs md:text-sm text-nexus-300">
                    <li>● <strong>Rate Limiting:</strong> `express-rate-limit` restringe até 50 tentativas de login por IP em janela de 15 min.</li>
                    <li>● <strong>Helmet Security Headers:</strong> Content Security Policy (CSP) explícita, HSTS ativado e mitigação XSS.</li>
                    <li>● <strong>Politica de Senhas Estrita:</strong> Exigência exata de formato corporativo (ex: dígitos, caracteres especiais).</li>
                    <li>● <strong>Proteção do Administrador Raiz:</strong> Imutabilidade de permissões e prevenção contra auto-exclusão.</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Banco de Dados & Modelo */}
        {activeTab === 'database' && (
          <div className="space-y-6 animate-fade-in">
            <div className="glass rounded-3xl p-6 md:p-8 border border-nexus-500/20">
              <h2 className="text-2xl font-bold text-white mb-3 flex items-center gap-3">
                <DatabaseIcon className="w-7 h-7 text-nexus-400" />
                Modelagem Relacional de Banco de Dados (MySQL 8.4 InnoDB)
              </h2>
              <p className="text-nexus-300 text-sm md:text-base leading-relaxed mb-6">
                Estrutura relacional normalizada para garantir integridade referencial, transações ACID e consultas de alta performance.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="card p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-white text-sm font-mono">tabela: usuarios</span>
                    <span className="text-xs bg-nexus-500/10 text-nexus-300 px-2 py-0.5 rounded">6 colunas</span>
                  </div>
                  <p className="text-xs text-nexus-400">Armazena credenciais hash salteadas (Bcrypt), papel (`admin`, `funcionario`, `cliente`) e status ativo.</p>
                </div>

                <div className="card p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-white text-sm font-mono">tabela: itens</span>
                    <span className="text-xs bg-nexus-500/10 text-nexus-300 px-2 py-0.5 rounded">10 colunas</span>
                  </div>
                  <p className="text-xs text-nexus-400">Produtos e serviços com preço de venda, mensalidade de aluguel, fabricante e controle de estoque.</p>
                </div>

                <div className="card p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-white text-sm font-mono">tabela: pedidos</span>
                    <span className="text-xs bg-nexus-500/10 text-nexus-300 px-2 py-0.5 rounded">7 colunas</span>
                  </div>
                  <p className="text-xs text-nexus-400">Pedidos de checkout com vínculo ao usuário, valor total recauchutado no servidor e status de pagamento.</p>
                </div>

                <div className="card p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-white text-sm font-mono">tabela: pedido_itens</span>
                    <span className="text-xs bg-nexus-500/10 text-nexus-300 px-2 py-0.5 rounded">5 colunas</span>
                  </div>
                  <p className="text-xs text-nexus-400">Itens congelados do pedido com quantidade e preço histórico praticado no instante da compra.</p>
                </div>

                <div className="card p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-white text-sm font-mono">tabela: permissoes</span>
                    <span className="text-xs bg-nexus-500/10 text-nexus-300 px-2 py-0.5 rounded">8 colunas</span>
                  </div>
                  <p className="text-xs text-nexus-400">Mapeamento booleano granular de páginas autorizadas por usuário individual no painel administrativo.</p>
                </div>

                <div className="card p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-white text-sm font-mono">tabela: simulacoes</span>
                    <span className="text-xs bg-nexus-500/10 text-nexus-300 px-2 py-0.5 rounded">6 colunas</span>
                  </div>
                  <p className="text-xs text-nexus-400">Registro histórico de cotações e simulações efetuadas por clientes e funcionários.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Infraestrutura AWS Cloud */}
        {activeTab === 'cloud' && (
          <div className="space-y-6 animate-fade-in">
            <div className="glass rounded-3xl p-6 md:p-8 border border-nexus-500/20">
              <h2 className="text-2xl font-bold text-white mb-3 flex items-center gap-3">
                <CloudIcon className="w-7 h-7 text-nexus-400" />
                Infraestrutura Cloud & Implantação AWS Academy
              </h2>
              <p className="text-nexus-300 text-sm md:text-base leading-relaxed mb-6">
                Arquitetura de nuvem desenvolvida para suportar alta disponibilidade e segurança na Amazon Web Services (AWS).
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="card p-5 border-l-4 border-l-amber-500">
                  <h3 className="font-bold text-white text-base mb-2">1. Instância AWS EC2 (Compute)</h3>
                  <p className="text-xs md:text-sm text-nexus-300 leading-relaxed">
                    Ubuntu Server 24.04 LTS rodando o Node.js runtime gerenciado pelo <strong>PM2 Process Manager</strong> com reinício automático e monitoramento de memória.
                  </p>
                </div>

                <div className="card p-5 border-l-4 border-l-blue-500">
                  <h3 className="font-bold text-white text-base mb-2">2. Banco Gerenciado AWS RDS</h3>
                  <p className="text-xs md:text-sm text-nexus-300 leading-relaxed">
                    Instância de banco de dados MySQL 8.4 isolada em VPC privada com Security Groups permitindo apenas o tráfego originado da EC2.
                  </p>
                </div>

                <div className="card p-5 border-l-4 border-l-green-500">
                  <h3 className="font-bold text-white text-base mb-2">3. Nginx Reverse Proxy & SSL</h3>
                  <p className="text-xs md:text-sm text-nexus-300 leading-relaxed">
                    Servidor Nginx como Proxy Reverso com terminação TLS/SSL gratuita Let's Encrypt (Certbot), HTTP/2 e compressão Gzip ativada.
                  </p>
                </div>

                <div className="card p-5 border-l-4 border-l-purple-500">
                  <h3 className="font-bold text-white text-base mb-2">4. AWS CloudWatch & Health Check</h3>
                  <p className="text-xs md:text-sm text-nexus-300 leading-relaxed">
                    Endpoint sem limitação de taxa (`GET /health`) dedicado a sondas de integridade automatizadas da AWS.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 5: Desenvolvedor & Trajetória */}
        {activeTab === 'desenvolvedor' && (
          <div className="space-y-6 animate-fade-in">
            <div className="glass rounded-3xl p-6 md:p-8 border border-nexus-500/20">
              <div className="flex flex-col md:flex-row items-center gap-6 mb-8 pb-6 border-b border-dark-border">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-nexus-500 to-nexus-700 flex items-center justify-center text-3xl font-bold text-dark-bg shrink-0 shadow-gold">
                  CM
                </div>
                <div>
                  <h2 className="text-2xl md:text-3xl font-bold text-white">Clayton Marcelo</h2>
                  <p className="text-nexus-400 font-medium text-sm md:text-base mt-0.5">
                    Desenvolvedor Full-Stack | Graduando em ADS na UNISUAM (Rio de Janeiro)
                  </p>
                  <p className="text-nexus-300 text-xs md:text-sm mt-2 leading-relaxed">
                    Em transição estratégica de carreira após 8+ anos de experiência sólida em gestão de varejo, prevenção de perdas e operações logísticas.
                  </p>
                </div>
              </div>

              {/* Accordion List */}
              <div className="space-y-4">
                {/* Accordion Item 1 */}
                <div className="card overflow-hidden">
                  <button
                    onClick={() => toggleSection('fullstack')}
                    className="w-full flex items-center justify-between p-5 text-left font-bold text-white hover:text-nexus-300 transition-colors"
                  >
                    <span className="flex items-center gap-3">
                      <CodeIcon className="w-5 h-5 text-nexus-400" />
                      1. Visão de Engenharia de Software
                    </span>
                    <ChevronDownIcon className={`transition-transform duration-300 ${expandedSection === 'fullstack' ? 'rotate-180' : ''}`} />
                  </button>
                  {expandedSection === 'fullstack' && (
                    <div className="px-5 pb-5 text-xs md:text-sm text-nexus-300 leading-relaxed space-y-2 border-t border-dark-border/60 pt-4">
                      <p>
                        Construo aplicações completas com código limpo, arquitetura desacoplada e foco na experiência do usuário final. O projeto <strong>Nexus Control</strong> é a demonstração prática de competências em React, Node.js, TypeScript, MySQL, segurança JWT e nuvem AWS.
                      </p>
                    </div>
                  )}
                </div>

                {/* Accordion Item 2 */}
                <div className="card overflow-hidden">
                  <button
                    onClick={() => toggleSection('trajetoria')}
                    className="w-full flex items-center justify-between p-5 text-left font-bold text-white hover:text-nexus-300 transition-colors"
                  >
                    <span className="flex items-center gap-3">
                      <ShieldIcon className="w-5 h-5 text-nexus-400" />
                      2. Trajetória Profissional & Bagagem Estratégica (2016 - Presente)
                    </span>
                    <ChevronDownIcon className={`transition-transform duration-300 ${expandedSection === 'trajetoria' ? 'rotate-180' : ''}`} />
                  </button>
                  {expandedSection === 'trajetoria' && (
                    <div className="px-5 pb-5 text-xs md:text-sm text-nexus-300 leading-relaxed space-y-3 border-t border-dark-border/60 pt-4">
                      <div>
                        <strong className="text-white">● Varejo & Merchandising (2016-2019):</strong> Visão de experiência do cliente, controle de estoque e operações comerciais.
                      </div>
                      <div>
                        <strong className="text-white">● Prevenção de Perdas (2019-2021):</strong> Análise de vulnerabilidades, rigor investigativo e gestão de riscos.
                      </div>
                      <div>
                        <strong className="text-white">● Logística & Operações (2021-2024):</strong> Otimização de fluxos operacionais, disciplina em processos e pensamento sistêmico.
                      </div>
                      <div>
                        <strong className="text-white">● Engenharia de Software (2024-Presente):</strong> Aplicação de rigor analítico no desenvolvimento de soluções corporativas escaláveis.
                      </div>
                    </div>
                  )}
                </div>

                {/* Accordion Item 3 */}
                <div className="card overflow-hidden">
                  <button
                    onClick={() => toggleSection('objetivo')}
                    className="w-full flex items-center justify-between p-5 text-left font-bold text-white hover:text-nexus-300 transition-colors"
                  >
                    <span className="flex items-center gap-3">
                      <UserIcon className="w-5 h-5 text-nexus-400" />
                      3. Objetivo Profissional & Visão de Carreira
                    </span>
                    <ChevronDownIcon className={`transition-transform duration-300 ${expandedSection === 'objetivo' ? 'rotate-180' : ''}`} />
                  </button>
                  {expandedSection === 'objetivo' && (
                    <div className="px-5 pb-5 text-xs md:text-sm text-nexus-300 leading-relaxed space-y-2 border-t border-dark-border/60 pt-4">
                      <p>
                        Busco colocação no mercado de tecnologia como <strong>Desenvolvedor Full-Stack Júnior ou Estagiário</strong> (CLT / PJ). Objetivo de evolução contínua: Júnior → Pleno → Sênior → Tech Lead / Arquito de Soluções.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Contact Banner */}
              <div className="mt-8 rounded-2xl bg-gradient-to-r from-nexus-600/20 via-nexus-500/10 to-transparent border border-nexus-500/30 p-6 text-center">
                <h3 className="text-lg font-bold text-white mb-2">Conecte-se com o Desenvolvedor</h3>
                <p className="text-xs md:text-sm text-nexus-300 max-w-xl mx-auto mb-5">
                  Disponível para oportunidades profissionais, novos projetos e trocas técnicas sobre arquitetura e desenvolvimento.
                </p>
                <div className="flex flex-wrap justify-center gap-3">
                  <a
                    href="https://github.com/claytonmarcelo"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-primary bg-nexus-600 hover:bg-nexus-500 text-xs px-5 py-2.5"
                  >
                    GitHub Project
                  </a>
                  <a
                    href="https://www.linkedin.com/in/clayton-marcelo-dev/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-secondary text-xs px-5 py-2.5"
                  >
                    LinkedIn Profile
                  </a>
                  <a
                    href="mailto:marcelolimadez@gmail.com"
                    className="btn btn-secondary text-xs px-5 py-2.5"
                  >
                    Enviar E-mail
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer Navigation Back Button */}
        <div className="mt-10 text-center">
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-nexus-600 hover:bg-nexus-500 transition-colors text-white font-medium shadow-gold text-sm"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Voltar ao Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
