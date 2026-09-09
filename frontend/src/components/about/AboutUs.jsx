import React, { useState } from 'react';

/**
 * Ícone ChevronDown (substitui lucide-react)
 */
function ChevronDownIcon({ size = 24, className = '' }) {
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

/**
 * Página "Quem Somos" - Apresentação Profissional
 * Apresenta:
 * 1. Visão do Projeto Nexus Control (solução full-stack corporativa)
 * 2. Perfil Profissional de Clayton Marcelo (trajetória + transição de carreira + objetivo)
 * 3. Timeline de evolução profissional
 * 4. Competências técnicas e soft skills
 * 5. Objetivo e visão de futuro
 */

export default function AboutUs() {
  const [expandedSection, setExpandedSection] = useState('projeto');

  const toggleSection = (section) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  return (
    <div className="min-h-screen bg-dark-bg text-white py-8 md:py-16">
      <div className="max-w-6xl mx-auto px-4 md:px-8">
        {/* Header */}
        <div className="mb-12 md:mb-16 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-nexus-400 to-nexus-500 bg-clip-text text-transparent">
            Quem Somos
          </h1>
          <div className="w-16 h-1 bg-gradient-to-r from-nexus-500 to-nexus-400 mx-auto mb-6"></div>
          <p className="text-lg text-nexus-300 max-w-3xl mx-auto leading-relaxed">
            Uma jornada de transformação profissional, inovação tecnológica e compromisso com excelência em engenharia de software.
          </p>
        </div>

        {/* Seção 1: Visão do Projeto */}
        <section className="mb-8 md:mb-12">
          <button
            onClick={() => toggleSection('projeto')}
            className="w-full group"
          >
            <div className="glass rounded-2xl p-6 md:p-8 hover:border-nexus-500/50 transition-all duration-300 border border-dark-border cursor-pointer">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h2 className="text-2xl md:text-3xl font-bold mb-2 flex items-center gap-3">
                    <span className="text-nexus-500">🚀</span>
                    Nexus Control: Solução Full-Stack Corporativa
                  </h2>
                  <p className="text-nexus-300 text-sm md:text-base">
                    Plataforma completa para gestão de infraestrutura de TI, e-commerce corporativo e controle administrativo em tempo real.
                  </p>
                </div>
                <ChevronDownIcon
                  size={24}
                  className={`text-nexus-500 transition-transform duration-300 ${
                    expandedSection === 'projeto' ? 'rotate-180' : ''
                  }`}
                />
              </div>

              {expandedSection === 'projeto' && (
                <div className="mt-6 pt-6 border-t border-dark-border/50 space-y-4 animate-slide-down">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-semibold text-nexus-400 mb-2">Propósito</h4>
                      <p className="text-white/80 text-sm leading-relaxed">
                        Fornecer uma solução profissional para empresas que trabalham com infraestrutura de TI, permitindo gestão de catálogo de produtos/serviços, operações de compra e aluguel, checkout com múltiplas formas de pagamento (Pix e Cartão), e painel administrativo com controle granular de permissões.
                      </p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-nexus-400 mb-2">Usuários</h4>
                      <p className="text-white/80 text-sm leading-relaxed">
                        Três perfis de acesso: <strong>Admin</strong> (controle total), <strong>Funcionário</strong> (gestão de catálogo), <strong>Cliente</strong> (compra e aluguel). Cada perfil com permissões granulares em 7 páginas do sistema.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                    <div className="neumorphic p-4 rounded-xl">
                      <div className="text-nexus-500 text-2xl font-bold mb-1">13</div>
                      <p className="text-white/70 text-xs">Chunks JS<br/>Code-splitting</p>
                    </div>
                    <div className="neumorphic p-4 rounded-xl">
                      <div className="text-nexus-500 text-2xl font-bold mb-1">66%</div>
                      <p className="text-white/70 text-xs">Redução de<br/>Initial Load</p>
                    </div>
                    <div className="neumorphic p-4 rounded-xl">
                      <div className="text-nexus-500 text-2xl font-bold mb-1">14/14</div>
                      <p className="text-white/70 text-xs">Tasks de<br/>Deployment</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </button>
        </section>

        {/* Seção 2: Trajetória Profissional */}
        <section className="mb-8 md:mb-12">
          <button
            onClick={() => toggleSection('trajetoria')}
            className="w-full group"
          >
            <div className="glass rounded-2xl p-6 md:p-8 hover:border-nexus-500/50 transition-all duration-300 border border-dark-border cursor-pointer">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h2 className="text-2xl md:text-3xl font-bold mb-2 flex items-center gap-3">
                    <span className="text-nexus-500">💼</span>
                    Trajetória Profissional: Transição de Carreira
                  </h2>
                  <p className="text-nexus-300 text-sm md:text-base">
                    De 8+ anos em varejo, logística e atendimento para desenvolvimento full-stack corporativo.
                  </p>
                </div>
                <ChevronDown
                  size={24}
                  className={`text-nexus-500 transition-transform duration-300 ${
                    expandedSection === 'trajetoria' ? 'rotate-180' : ''
                  }`}
                />
              </div>

              {expandedSection === 'trajetoria' && (
                <div className="mt-6 pt-6 border-t border-dark-border/50 space-y-6 animate-slide-down">
                  <div className="space-y-4">
                    <div className="relative pl-6 pb-4 border-l-2 border-nexus-500/50 last:border-l-0">
                      <div className="absolute -left-3 top-0 w-4 h-4 bg-nexus-500 rounded-full"></div>
                      <div>
                        <h4 className="font-semibold text-nexus-400 text-sm md:text-base">Varejo & Merchandising (2016-2019)</h4>
                        <p className="text-white/70 text-xs md:text-sm mt-1">
                          Experiência em operações de varejo, visual merchandising e gestão de estoque. Desenvolveu visão estratégica sobre experiência do cliente e otimização de processos.
                        </p>
                        <div className="mt-2 flex gap-2 flex-wrap">
                          <span className="bg-dark-hover text-nexus-300 text-xs px-2 py-1 rounded">Análise de Dados</span>
                          <span className="bg-dark-hover text-nexus-300 text-xs px-2 py-1 rounded">Gestão de Equipe</span>
                          <span className="bg-dark-hover text-nexus-300 text-xs px-2 py-1 rounded">Customer Experience</span>
                        </div>
                      </div>
                    </div>

                    <div className="relative pl-6 pb-4 border-l-2 border-nexus-500/50">
                      <div className="absolute -left-3 top-0 w-4 h-4 bg-nexus-500 rounded-full"></div>
                      <div>
                        <h4 className="font-semibold text-nexus-400 text-sm md:text-base">Prevenção de Perdas (2019-2021)</h4>
                        <p className="text-white/70 text-xs md:text-sm mt-1">
                          Coordenação de segurança patrimonial e análise de vulnerabilidades. Aprendizado em investigação, padrões de comportamento e pensamento crítico sistêmico.
                        </p>
                        <div className="mt-2 flex gap-2 flex-wrap">
                          <span className="bg-dark-hover text-nexus-300 text-xs px-2 py-1 rounded">Análise Forense</span>
                          <span className="bg-dark-hover text-nexus-300 text-xs px-2 py-1 rounded">Problem-Solving</span>
                          <span className="bg-dark-hover text-nexus-300 text-xs px-2 py-1 rounded">Documentação Rigorosa</span>
                        </div>
                      </div>
                    </div>

                    <div className="relative pl-6 pb-4 border-l-2 border-nexus-500/50">
                      <div className="absolute -left-3 top-0 w-4 h-4 bg-nexus-500 rounded-full"></div>
                      <div>
                        <h4 className="font-semibold text-nexus-400 text-sm md:text-base">Logística & Operações (2021-2024)</h4>
                        <p className="text-white/70 text-xs md:text-sm mt-1">
                          Gestão de processos logísticos, otimização de fluxos e coordenação de equipes multidisciplinares. Foco em eficiência operacional, conformidade e escalabilidade.
                        </p>
                        <div className="mt-2 flex gap-2 flex-wrap">
                          <span className="bg-dark-hover text-nexus-300 text-xs px-2 py-1 rounded">Otimização de Processos</span>
                          <span className="bg-dark-hover text-nexus-300 text-xs px-2 py-1 rounded">Metodologia Ágil</span>
                          <span className="bg-dark-hover text-nexus-300 text-xs px-2 py-1 rounded">Escalabilidade</span>
                        </div>
                      </div>
                    </div>

                    <div className="relative pl-6 pb-4 border-l-2 border-nexus-500/50">
                      <div className="absolute -left-3 top-0 w-4 h-4 bg-nexus-500 rounded-full"></div>
                      <div>
                        <h4 className="font-semibold text-nexus-400 text-sm md:text-base">Tecnologia & Inovação (2024-Presente)</h4>
                        <p className="text-white/70 text-xs md:text-sm mt-1">
                          Transição para desenvolvimento de software. Aplicando disciplina, rigor de processo e visão estratégica em soluções full-stack corporativas.
                        </p>
                        <div className="mt-2 flex gap-2 flex-wrap">
                          <span className="bg-dark-hover text-nexus-300 text-xs px-2 py-1 rounded">React 18</span>
                          <span className="bg-dark-hover text-nexus-300 text-xs px-2 py-1 rounded">Node.js</span>
                          <span className="bg-dark-hover text-nexus-300 text-xs px-2 py-1 rounded">Clean Architecture</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-dark-card/50 border border-nexus-500/20 rounded-xl p-4 mt-6">
                    <h5 className="font-semibold text-nexus-400 mb-3 text-sm md:text-base">💡 Bagagem Estratégica Transferida</h5>
                    <ul className="space-y-2 text-sm text-white/70">
                      <li className="flex items-start gap-2">
                        <span className="text-nexus-500 mt-1">✓</span>
                        <span><strong>Visão de negócio:</strong> Entendimento de processos corporativos, necessidades do cliente final e ROI</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-nexus-500 mt-1">✓</span>
                        <span><strong>Disciplina operacional:</strong> Rigor em documentação, processos reperáveis e qualidade consistente</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-nexus-500 mt-1">✓</span>
                        <span><strong>Comunicação clara:</strong> Habilidade de traduzir problemas complexos para linguagem simples</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-nexus-500 mt-1">✓</span>
                        <span><strong>Pensamento sistêmico:</strong> Capacidade de ver o "big picture" e impactos cascata de decisões</span>
                      </li>
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </button>
        </section>

        {/* Seção 3: Formação Acadêmica */}
        <section className="mb-8 md:mb-12">
          <button
            onClick={() => toggleSection('academia')}
            className="w-full group"
          >
            <div className="glass rounded-2xl p-6 md:p-8 hover:border-nexus-500/50 transition-all duration-300 border border-dark-border cursor-pointer">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h2 className="text-2xl md:text-3xl font-bold mb-2 flex items-center gap-3">
                    <span className="text-nexus-500">🎓</span>
                    Formação Acadêmica
                  </h2>
                  <p className="text-nexus-300 text-sm md:text-base">
                    Cursando Análise e Desenvolvimento de Sistemas na UNISUAM (Rio de Janeiro).
                  </p>
                </div>
                <ChevronDown
                  size={24}
                  className={`text-nexus-500 transition-transform duration-300 ${
                    expandedSection === 'academia' ? 'rotate-180' : ''
                  }`}
                />
              </div>

              {expandedSection === 'academia' && (
                <div className="mt-6 pt-6 border-t border-dark-border/50 space-y-4 animate-slide-down">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="neumorphic p-6 rounded-xl">
                      <h4 className="font-semibold text-nexus-400 mb-3 text-base md:text-lg">Curso: Análise e Desenvolvimento de Sistemas</h4>
                      <div className="space-y-2 text-sm text-white/70">
                        <p><strong>Instituição:</strong> UNISUAM - Centro Universitário</p>
                        <p><strong>Localização:</strong> Rio de Janeiro, RJ</p>
                        <p><strong>Foco:</strong> Arquitetura de software, bancos de dados relacionais, desenvolvimento web e mobile</p>
                        <p><strong>Status:</strong> Em progresso (foco prático em projetos reais)</p>
                      </div>
                    </div>

                    <div className="neumorphic p-6 rounded-xl">
                      <h4 className="font-semibold text-nexus-400 mb-3 text-base md:text-lg">Competências em Desenvolvimento</h4>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="text-nexus-500">●</span>
                          <span className="text-sm text-white/80"><strong>Frontend:</strong> React 18, TypeScript, Tailwind CSS</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-nexus-500">●</span>
                          <span className="text-sm text-white/80"><strong>Backend:</strong> Node.js, Express, TypeScript</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-nexus-500">●</span>
                          <span className="text-sm text-white/80"><strong>Banco de Dados:</strong> MySQL 8, Design relacional</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-nexus-500">●</span>
                          <span className="text-sm text-white/80"><strong>Infraestrutura:</strong> AWS, Docker, CI/CD</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-dark-card/50 border border-nexus-500/20 rounded-xl p-4 mt-6">
                    <p className="text-sm text-white/70 leading-relaxed">
                      A formação acadêmica em ADS estrutura o conhecimento teórico adquirido através da prática profissional, fornecendo fundamentos sólidos em ciência da computação, design de software e metodologias de desenvolvimento.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </button>
        </section>

        {/* Seção 4: Objetivo Profissional */}
        <section className="mb-8 md:mb-12">
          <button
            onClick={() => toggleSection('objetivo')}
            className="w-full group"
          >
            <div className="glass rounded-2xl p-6 md:p-8 hover:border-nexus-500/50 transition-all duration-300 border border-dark-border cursor-pointer">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h2 className="text-2xl md:text-3xl font-bold mb-2 flex items-center gap-3">
                    <span className="text-nexus-500">🎯</span>
                    Objetivo Profissional
                  </h2>
                  <p className="text-nexus-300 text-sm md:text-base">
                    Busca por oportunidade no mercado de tecnologia como Desenvolvedor Júnior ou Estagiário.
                  </p>
                </div>
                <ChevronDown
                  size={24}
                  className={`text-nexus-500 transition-transform duration-300 ${
                    expandedSection === 'objetivo' ? 'rotate-180' : ''
                  }`}
                />
              </div>

              {expandedSection === 'objetivo' && (
                <div className="mt-6 pt-6 border-t border-dark-border/50 space-y-4 animate-slide-down">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="neumorphic p-6 rounded-xl">
                      <h4 className="font-semibold text-nexus-400 mb-3">Buscando</h4>
                      <ul className="space-y-2 text-sm text-white/70">
                        <li className="flex items-start gap-2">
                          <span className="text-nexus-500 flex-shrink-0">→</span>
                          <span><strong>Posição:</strong> Desenvolvedor Júnior Full-Stack ou Estagiário</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-nexus-500 flex-shrink-0">→</span>
                          <span><strong>Stack:</strong> React / Node.js / TypeScript preferido</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-nexus-500 flex-shrink-0">→</span>
                          <span><strong>Modelo:</strong> CLT, PJ ou Estágio</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-nexus-500 flex-shrink-0">→</span>
                          <span><strong>Ambiente:</strong> Startups, Tech e SaaS corporativo</span>
                        </li>
                      </ul>
                    </div>

                    <div className="neumorphic p-6 rounded-xl">
                      <h4 className="font-semibold text-nexus-400 mb-3">Diferenciais</h4>
                      <ul className="space-y-2 text-sm text-white/70">
                        <li className="flex items-start gap-2">
                          <span className="text-nexus-500 flex-shrink-0">✓</span>
                          <span><strong>Código limpo:</strong> Padrões enterprise, arquitetura sólida</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-nexus-500 flex-shrink-0">✓</span>
                          <span><strong>Portfólio real:</strong> Nexus Control demonstra full-stack corporativo</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-nexus-500 flex-shrink-0">✓</span>
                          <span><strong>Visão de negócio:</strong> Entendo impacto técnico em ROI</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-nexus-500 flex-shrink-0">✓</span>
                          <span><strong>Comunicação:</strong> Capaz de traduzir entre técnico e negócio</span>
                        </li>
                      </ul>
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-nexus-500/10 to-nexus-400/10 border border-nexus-500/30 rounded-xl p-6 mt-6">
                    <h5 className="font-semibold text-nexus-400 mb-3">📈 Visão de Futuro</h5>
                    <p className="text-sm text-white/80 leading-relaxed mb-4">
                      Evoluir de Desenvolvedor Júnior para Sênior, passando por Mid-level, com forte foco em arquitetura, code review e mentoria. Objetivo final: Lead Architect ou CTO, onde posso aplicar experiência empresarial + rigor técnico para liderar times e tecnologia.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <span className="bg-nexus-500/20 text-nexus-300 text-xs px-3 py-1.5 rounded-lg">1-2 anos: Sênior</span>
                      <span className="bg-nexus-500/20 text-nexus-300 text-xs px-3 py-1.5 rounded-lg">3-5 anos: Tech Lead</span>
                      <span className="bg-nexus-500/20 text-nexus-300 text-xs px-3 py-1.5 rounded-lg">5+ anos: Architect/CTO</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </button>
        </section>

        {/* Seção 5: Contato */}
        <section className="bg-dark-card/50 border border-nexus-500/20 rounded-2xl p-8 text-center">
          <h2 className="text-2xl font-bold mb-4 flex items-center justify-center gap-3">
            <span className="text-nexus-500">📞</span>
            Conecte-se
          </h2>
          <p className="text-nexus-300 mb-6 max-w-2xl mx-auto">
            Aberto a oportunidades, feedback e discussões sobre tecnologia, arquitetura e desenvolvimento corporativo.
          </p>
          <div className="flex flex-col md:flex-row gap-4 justify-center">
            <a
              href="https://github.com/claytonmarcelo"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary bg-nexus-600 hover:bg-nexus-500"
            >
              GitHub
            </a>
            <a
              href="https://www.linkedin.com/in/clayton-marcelo-dev/"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-secondary"
            >
              LinkedIn
            </a>
            <a
              href="mailto:marcelolimadez@gmail.com"
              className="btn btn-secondary"
            >
              Email
            </a>
            <a
              href="https://cmarcelodev.com"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-secondary"
            >
              Portfolio
            </a>
          </div>
        </section>
      </div>
    </div>
  );
}
