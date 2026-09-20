import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const DEFAULT_CURRICULO_DATA = {
  nome: 'CLAYTON MARCELO TAVARES DE LIMA',
  cargo: 'Desenvolvedor Full-Stack Júnior | Estágio em Desenvolvimento de Software',
  email: 'claytonlima10@gmail.com',
  telefone: '(21) 99155-6383',
  github: 'https://github.com/claytonmarcelo',
  linkedin: 'https://linkedin.com/in/clayton-marcelo-dev',
  localizacao: 'Rio de Janeiro/RJ',
  sobre:
    'Estudante de Análise e Desenvolvimento de Sistemas (4º período) com portfólio prático de mais de 10 projetos full-stack e mobile publicados no GitHub, incluindo sistemas SaaS completos (ERP, gestão de equipes de campo) e aplicativos com integração a APIs externas e geolocalização em tempo real. Autodidata, com domínio do ciclo completo de desenvolvimento: modelagem de banco de dados, back-end, front-end, autenticação e deploy em produção. Busco oportunidade de estágio ou posição júnior para aplicar e evoluir essas habilidades em um time de tecnologia.',
  disponibilidade: 'Disponível para Estágio ou Posição Júnior',
  habilidades: {
    linguagens: ['JavaScript', 'TypeScript', 'PHP'],
    frontend: ['React', 'React Native (Expo)', 'Tailwind CSS', 'HTML5', 'CSS3'],
    backend: ['Node.js', 'Express', 'Fastify', 'Laravel', 'APIs REST'],
    dados: ['MySQL', 'MariaDB', 'Firebase Firestore', 'Prisma ORM'],
    devops: ['Git/GitHub', 'Vercel', 'Railway', 'Render', 'JWT'],
    conceitos: ['Arquitetura SaaS/multiempresa', 'Geolocalização em tempo real', 'Integração de APIs externas'],
  },
  formacao: [
    {
      curso: 'Análise e Desenvolvimento de Sistemas',
      instituicao: 'UNISUAM — Centro Universitário Augusto Motta',
      periodo: '4º período em andamento',
      descricao: 'Graduação Tecnológica com foco em desenvolvimento de software, engenharia de sistemas e banco de dados.',
    },
  ],
  projetos: [
    {
      nome: 'Nexus Business Manager',
      descricao: 'ERP SaaS empresarial completo, com suporte a múltiplas empresas na mesma base. Módulos de CRM, Estoque, Financeiro, Agendamento e Dashboard com relatórios gerenciais. Autenticação e controle de acesso via JWT; arquitetura multiempresa (multi-tenant).',
      tecnologias: ['React', 'Node.js', 'Fastify', 'MySQL', 'JWT', 'Multi-tenant'],
      link: 'https://github.com/claytonmarcelo/Nexus-Business-Manager',
      destaque: true,
    },
    {
      nome: 'Nexus Field',
      descricao: 'Plataforma enterprise de gestão de equipes técnicas em campo (Field Service Management). Controle de ordens de serviço, agenda, check-in/out por geolocalização e estoque móvel. Modelagem de dados com Prisma ORM e relatórios financeiros/operacionais integrados.',
      tecnologias: ['React', 'TypeScript', 'Prisma', 'Fastify', 'MariaDB', 'Geolocalização'],
      link: 'https://github.com/claytonmarcelo/Nexus-Field',
      destaque: true,
    },
    {
      nome: 'FleetPulse',
      descricao: 'Aplicativo mobile de monitoramento de frotas em tempo real. Rastreamento de GPS ao vivo, alertas de velocidade e dashboard operacional. Gerenciamento de estado com Zustand e cache de dados com TanStack Query.',
      tecnologias: ['React Native', 'Firebase', 'TypeScript', 'Zustand', 'TanStack Query'],
      link: 'https://github.com/claytonmarcelo/FleetPulse',
      destaque: true,
    },
    {
      nome: 'Music Galaxy',
      descricao: 'App Android de busca musical com foco em precisão de metadados e identificação de versões oficiais. Integração com múltiplas APIs externas de música para consolidar resultados e metadados. Interface com Material Design, modo escuro e experiência de reprodução premium.',
      tecnologias: ['React Native', 'TypeScript', 'APIs Spotify/Deezer/Last.fm', 'Material Design'],
      link: 'https://github.com/claytonmarcelo/Music-Galaxy',
      destaque: true,
    },
  ],
  outrosProjetos: 'Petit-Vet (gestão veterinária com GPS), SwiftFin Pay (SaaS de pagamentos com Mercado Pago/PayPal), TaskFlow (gerenciador de tarefas com Firebase) e demais projetos de disciplina desenvolvidos ao longo do curso, disponíveis no GitHub.',
  experiencias: [],
};

function SkillBadge({ label }) {
  return (
    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border border-nexus-500/30 bg-nexus-500/10 text-nexus-300 hover:bg-nexus-500/20 hover:text-nexus-200 transition-colors print:border-gray-300 print:bg-gray-100 print:text-gray-800">
      {label}
    </span>
  );
}

function SectionTitle({ icon, children }) {
  return (
    <div className="flex items-center gap-3 mb-6">
      <div className="w-9 h-9 rounded-xl bg-nexus-500/20 border border-nexus-500/30 flex items-center justify-center text-nexus-400 flex-shrink-0 print:bg-gray-100 print:border-gray-300 print:text-gray-800">
        {icon}
      </div>
      <h2 className="text-xl font-bold text-white print:text-gray-900">{children}</h2>
      <div className="flex-1 h-px bg-gradient-to-r from-nexus-500/30 to-transparent print:bg-gray-200" />
    </div>
  );
}

function ProjectCard({ nome, descricao, tecnologias, link, destaque }) {
  return (
    <div className={`card p-5 hover:border-nexus-500/50 transition-all duration-300 ${destaque ? 'border-nexus-500/40 bg-nexus-500/5' : ''} print:shadow-none print:border-gray-200`}>
      <div className="flex items-start justify-between gap-2 mb-2">
        <h3 className="font-bold text-white text-base print:text-gray-900">{nome}</h3>
        {destaque && (
          <span className="text-[10px] font-bold text-nexus-300 bg-nexus-500/20 px-2 py-0.5 rounded-full border border-nexus-500/30 whitespace-nowrap print:hidden">
            ⭐ Destaque
          </span>
        )}
      </div>
      <p className="text-nexus-300 text-xs leading-relaxed mb-3 print:text-gray-700">{descricao}</p>
      {tecnologias && tecnologias.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {tecnologias.map((tech) => (
            <span key={tech} className="text-[11px] font-medium px-2 py-0.5 rounded bg-dark-hover text-nexus-300 border border-dark-border print:bg-gray-100 print:text-gray-800">
              {tech}
            </span>
          ))}
        </div>
      )}
      {link && (
        <a
          href={link}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-nexus-400 hover:text-nexus-300 text-xs font-semibold transition-colors print:text-gray-600"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
          {link.replace(/^https?:\/\//, '')}
        </a>
      )}
    </div>
  );
}

export default function CurriculoPage() {
  const [curriculo, setCurriculo] = useState(DEFAULT_CURRICULO_DATA);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCurriculo = async () => {
      try {
        const response = await axios.get(`${API_URL}/curriculo`);
        const data = response?.data?.data?.curriculo || response?.data?.curriculo;
        if (data && data.nome) {
          setCurriculo(data);
        }
      } catch (err) {
        console.warn('[CurriculoPage] Usando dados locais de currículo:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCurriculo();
  }, []);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 rounded-full border-4 border-nexus-500/20 border-t-nexus-500 animate-spin mx-auto" />
          <p className="text-nexus-400 text-sm">Carregando currículo...</p>
        </div>
      </div>
    );
  }

  const habilidades = curriculo.habilidades || {};

  return (
    <>
      <div className="min-h-screen py-8 md:py-12 animate-fade-in print:py-0 print:bg-white text-nexus-100">
        {/* Controles no topo (escondido na impressão) */}
        <div className="max-w-4xl mx-auto px-4 mb-6 flex items-center justify-between print:hidden">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-nexus-400 hover:text-nexus-300 text-sm transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Voltar ao Início
          </Link>

          <div className="flex items-center gap-3">
            {curriculo.linkedin && (
              <a
                href={curriculo.linkedin.startsWith('http') ? curriculo.linkedin : `https://${curriculo.linkedin}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-secondary text-xs px-3.5 py-2"
              >
                LinkedIn
              </a>
            )}
            {curriculo.github && (
              <a
                href={curriculo.github.startsWith('http') ? curriculo.github : `https://${curriculo.github}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-secondary text-xs px-3.5 py-2"
              >
                GitHub
              </a>
            )}
            <button
              onClick={handlePrint}
              className="btn btn-primary text-xs px-4 py-2 flex items-center gap-1.5"
              title="Salvar em PDF ou Imprimir"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Salvar PDF
            </button>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 print:px-0 space-y-6">

          {/* === HERO / CABEÇALHO === */}
          <div className="glass rounded-3xl p-8 md:p-10 border border-nexus-500/20 relative overflow-hidden print:rounded-none print:border-0 print:shadow-none print:p-4">
            <div className="pointer-events-none absolute top-0 right-0 w-64 h-64 rounded-full bg-nexus-500/10 blur-3xl print:hidden" />
            <div className="pointer-events-none absolute bottom-0 left-0 w-48 h-48 rounded-full bg-nexus-700/10 blur-2xl print:hidden" />

            <div className="relative flex flex-col md:flex-row items-center md:items-start gap-6">
              {/* Avatar com Iniciais */}
              <div className="w-24 h-24 md:w-28 md:h-28 rounded-2xl bg-gradient-to-br from-nexus-500 to-nexus-700 flex items-center justify-center text-3xl font-extrabold text-dark-bg shadow-gold flex-shrink-0 print:w-20 print:h-20 print:rounded-lg">
                CM
              </div>

              <div className="flex-1 text-center md:text-left">
                {curriculo.disponibilidade && (
                  <div className="inline-flex items-center gap-2 rounded-full border border-nexus-500/30 bg-nexus-500/10 px-3 py-1 text-xs font-semibold text-nexus-300 mb-3 print:hidden">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    {curriculo.disponibilidade}
                  </div>
                )}

                <h1 className="text-2xl md:text-3xl font-extrabold mb-2 bg-gradient-to-r from-white via-nexus-200 to-nexus-400 bg-clip-text text-transparent print:text-gray-900 print:text-2xl">
                  {curriculo.nome}
                </h1>
                <p className="text-nexus-400 font-medium text-sm md:text-base mb-4 print:text-gray-700">
                  {curriculo.cargo}
                </p>

                {/* Informações de Contato */}
                <div className="flex flex-wrap justify-center md:justify-start gap-y-2 gap-x-4 text-xs">
                  {curriculo.email && (
                    <a href={`mailto:${curriculo.email}`} className="flex items-center gap-1.5 text-nexus-300 hover:text-nexus-200 transition-colors print:text-gray-700">
                      <svg className="w-4 h-4 text-nexus-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      {curriculo.email}
                    </a>
                  )}
                  {curriculo.telefone && (
                    <a href={`tel:${curriculo.telefone.replace(/\D/g, '')}`} className="flex items-center gap-1.5 text-nexus-300 hover:text-nexus-200 transition-colors print:text-gray-700">
                      <svg className="w-4 h-4 text-nexus-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      {curriculo.telefone}
                    </a>
                  )}
                  {curriculo.localizacao && (
                    <span className="flex items-center gap-1.5 text-nexus-300 print:text-gray-700">
                      <svg className="w-4 h-4 text-nexus-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {curriculo.localizacao}
                    </span>
                  )}
                  {curriculo.github && (
                    <a href={curriculo.github.startsWith('http') ? curriculo.github : `https://${curriculo.github}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-nexus-300 hover:text-nexus-200 transition-colors print:text-gray-700">
                      <svg className="w-4 h-4 text-nexus-400" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.305-.536-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
                      </svg>
                      {curriculo.github.replace(/^https?:\/\//, '')}
                    </a>
                  )}
                  {curriculo.linkedin && (
                    <a href={curriculo.linkedin.startsWith('http') ? curriculo.linkedin : `https://${curriculo.linkedin}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-nexus-300 hover:text-nexus-200 transition-colors print:text-gray-700">
                      <svg className="w-4 h-4 text-nexus-400" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                      </svg>
                      {curriculo.linkedin.replace(/^https?:\/\//, '')}
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* === RESUMO PROFISSIONAL === */}
          {curriculo.sobre && (
            <div className="glass rounded-2xl p-6 border border-nexus-500/20 print:rounded-lg print:shadow-none print:border-gray-200 print:p-4">
              <SectionTitle icon={
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              }>Resumo</SectionTitle>
              <p className="text-nexus-300 text-sm md:text-base leading-relaxed print:text-gray-800">{curriculo.sobre}</p>
            </div>
          )}

          {/* === GRID DE 2 COLUNAS: FORMAÇÃO & COMPETÊNCIAS === */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* FORMAÇÃO ACADÊMICA */}
            {curriculo.formacao && curriculo.formacao.length > 0 && (
              <div className="glass rounded-2xl p-6 border border-nexus-500/20 print:rounded-lg print:shadow-none print:border-gray-200 print:p-4">
                <SectionTitle icon={
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                  </svg>
                }>Formação Acadêmica</SectionTitle>
                <div className="space-y-4">
                  {curriculo.formacao.map((f, i) => (
                    <div key={i} className="card p-4 print:shadow-none print:border-gray-200">
                      <h3 className="font-bold text-white text-base print:text-gray-900">{f.curso}</h3>
                      <p className="text-nexus-300 text-sm mt-0.5 print:text-gray-700">{f.instituicao}</p>
                      <span className="inline-block mt-1 text-xs font-medium text-nexus-400 bg-nexus-500/10 px-2 py-0.5 rounded border border-nexus-500/20 print:bg-gray-100 print:text-gray-600">
                        {f.periodo}
                      </span>
                      {f.descricao && <p className="text-nexus-400 text-xs mt-2 leading-relaxed print:text-gray-600">{f.descricao}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* HABILIDADES TÉCNICAS */}
            <div className="glass rounded-2xl p-6 border border-nexus-500/20 print:rounded-lg print:shadow-none print:border-gray-200 print:p-4">
              <SectionTitle icon={
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              }>Habilidades Técnicas</SectionTitle>

              <div className="space-y-4">
                {habilidades.linguagens?.length > 0 && (
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-nexus-400 mb-1.5 print:text-gray-500">Linguagens</p>
                    <div className="flex flex-wrap gap-1.5">
                      {habilidades.linguagens.map(s => <SkillBadge key={s} label={s} />)}
                    </div>
                  </div>
                )}
                {habilidades.frontend?.length > 0 && (
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-nexus-400 mb-1.5 print:text-gray-500">Front-end</p>
                    <div className="flex flex-wrap gap-1.5">
                      {habilidades.frontend.map(s => <SkillBadge key={s} label={s} />)}
                    </div>
                  </div>
                )}
                {habilidades.backend?.length > 0 && (
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-nexus-400 mb-1.5 print:text-gray-500">Back-end</p>
                    <div className="flex flex-wrap gap-1.5">
                      {habilidades.backend.map(s => <SkillBadge key={s} label={s} />)}
                    </div>
                  </div>
                )}
                {habilidades.dados?.length > 0 && (
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-nexus-400 mb-1.5 print:text-gray-500">Banco de Dados</p>
                    <div className="flex flex-wrap gap-1.5">
                      {habilidades.dados.map(s => <SkillBadge key={s} label={s} />)}
                    </div>
                  </div>
                )}
                {habilidades.devops?.length > 0 && (
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-nexus-400 mb-1.5 print:text-gray-500">Ferramentas & Deploy</p>
                    <div className="flex flex-wrap gap-1.5">
                      {habilidades.devops.map(s => <SkillBadge key={s} label={s} />)}
                    </div>
                  </div>
                )}
                {habilidades.conceitos?.length > 0 && (
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-nexus-400 mb-1.5 print:text-gray-500">Conceitos & Arquitetura</p>
                    <div className="flex flex-wrap gap-1.5">
                      {habilidades.conceitos.map(s => <SkillBadge key={s} label={s} />)}
                    </div>
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* === PROJETOS EM DESTAQUE === */}
          {curriculo.projetos && curriculo.projetos.length > 0 && (
            <div className="glass rounded-2xl p-6 md:p-8 border border-nexus-500/20 print:rounded-lg print:shadow-none print:border-gray-200 print:p-4">
              <SectionTitle icon={
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
              }>Projetos em Destaque</SectionTitle>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {curriculo.projetos.map((proj, i) => (
                  <ProjectCard key={i} {...proj} />
                ))}
              </div>
            </div>
          )}

          {/* === OUTROS PROJETOS ACADÊMICOS === */}
          {curriculo.outrosProjetos && (
            <div className="glass rounded-2xl p-6 border border-nexus-500/20 print:rounded-lg print:shadow-none print:border-gray-200 print:p-4">
              <SectionTitle icon={
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              }>Outros Projetos Acadêmicos</SectionTitle>
              <p className="text-nexus-300 text-sm leading-relaxed print:text-gray-800">{curriculo.outrosProjetos}</p>
            </div>
          )}

          {/* === BANNER DE CONTATO / CTA (escondido na impressão) === */}
          <div className="glass rounded-2xl p-6 md:p-8 border border-nexus-500/30 bg-gradient-to-r from-nexus-600/15 via-nexus-500/10 to-transparent print:hidden flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-white text-lg mb-1">Vamos conversar sobre oportunidades?</h3>
              <p className="text-nexus-300 text-xs sm:text-sm">Disponível para posições júnior, estágio em desenvolvimento de software e projetos corporativos.</p>
            </div>
            <div className="flex flex-wrap gap-2.5 flex-shrink-0">
              {curriculo.email && (
                <a href={`mailto:${curriculo.email}`} className="btn btn-primary text-xs px-5 py-2.5 shadow-gold">
                  Enviar E-mail
                </a>
              )}
              {curriculo.telefone && (
                <a href={`https://wa.me/55${curriculo.telefone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="btn btn-secondary text-xs px-4 py-2.5">
                  WhatsApp
                </a>
              )}
            </div>
          </div>

          {/* Footer discreto */}
          <div className="text-center py-4 text-nexus-500 text-xs print:text-gray-500">
            {curriculo.nome} — Currículo Técnico Integrado ao Nexus Control App
          </div>
        </div>
      </div>
    </>
  );
}
