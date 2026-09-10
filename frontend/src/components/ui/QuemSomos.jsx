import { Link } from 'react-router-dom';

export default function QuemSomos() {
  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-4">Quem Somos</h1>
          <p className="text-xl text-nexus-300">Conheça o projeto Nexus Control</p>
        </div>

        {/* Main Content */}
        <div className="glass rounded-3xl p-8 sm:p-12 space-y-8">
          {/* About the Project */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
              <svg className="w-8 h-8 text-nexus-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Sobre o Nexus Control
            </h2>
            <p className="text-nexus-300 leading-relaxed text-lg">
              O <strong className="text-white">Nexus Control</strong> é um sistema de gestão full-stack corporativo desenvolvido com as melhores práticas do mercado. 
              O projeto oferece uma plataforma completa para gestão de catálogos, e-commerce e painel administrativo, com foco em usabilidade, 
              segurança e performance. Implementado com React, Node.js, Express e MySQL, o sistema foi desenhado para ser escalável e pronto para produção.
            </p>
          </section>

          {/* About the Developer */}
          <section className="bg-dark-card/50 rounded-2xl p-6 sm:p-8">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
              <svg className="w-8 h-8 text-nexus-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Sobre o Desenvolvedor
            </h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold text-white mb-2">Clayton Marcelo</h3>
                <p className="text-nexus-400">Desenvolvedor Full Stack em Transição de Carreira</p>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 mt-2 rounded-full bg-nexus-400 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-white">Transição de Carreira</h4>
                    <p className="text-nexus-300 text-sm mt-1">
                      Em busca de novos desafios na área de tecnologia, estou focado em desenvolver habilidades 
                      em desenvolvimento web moderno, arquitetura de software e boas práticas de desenvolvimento.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 mt-2 rounded-full bg-nexus-400 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-white">Vida Acadêmica</h4>
                    <p className="text-nexus-300 text-sm mt-1">
                      Comprometido com o aprendizado contínuo, busco constantemente aprimorar meus conhecimentos 
                      através de estudos, projetos práticos e cursos especializados em desenvolvimento de software.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 mt-2 rounded-full bg-nexus-400 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-white">Desejo Profissional</h4>
                    <p className="text-nexus-300 text-sm mt-1">
                      Meu objetivo é atuar como Desenvolvedor Full Stack Júnior, contribuindo com projetos 
                      inovadores e crescendo profissionalmente em ambientes que valorizem qualidade, 
                      colaboração e aprendizado contínuo.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Social Links */}
          <section className="text-center space-y-4">
            <h3 className="text-lg font-semibold text-white">Conecte-se Comigo</h3>
            <div className="flex justify-center gap-6">
              <a
                href="https://github.com/claytonmarcelo"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-dark-hover hover:bg-dark-border transition-colors text-nexus-300 hover:text-white"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.305-.536-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
                </svg>
                GitHub
              </a>
              <a
                href="https://www.linkedin.com/in/clayton-marcelo-dev/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-dark-hover hover:bg-dark-border transition-colors text-nexus-300 hover:text-white"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
                LinkedIn
              </a>
            </div>
          </section>

          {/* Back to Home */}
          <div className="text-center pt-6 border-t border-dark-border">
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-nexus-600 hover:bg-nexus-500 transition-colors text-white font-medium"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Voltar ao Dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
