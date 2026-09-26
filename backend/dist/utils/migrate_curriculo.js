import pool from '../config/database.js';
async function migrateCurriculo() {
    const connection = await pool.getConnection();
    try {
        console.log('[migrate_curriculo] Iniciando migração da tabela curriculo...');
        await connection.execute(`
      CREATE TABLE IF NOT EXISTS curriculo (
        id INT PRIMARY KEY DEFAULT 1,
        dados JSON NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        updated_by VARCHAR(100) DEFAULT NULL,
        CHECK (id = 1)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
        console.log('[migrate_curriculo] Tabela curriculo criada/verificada com sucesso.');
        // Seed inicial com dados reais do Clayton Marcelo
        const seedData = {
            nome: 'CLAYTON MARCELO TAVARES DE LIMA',
            cargo: 'Desenvolvedor Full-Stack Júnior | Estágio em Desenvolvimento de Software',
            email: 'claytonlima10@gmail.com',
            telefone: '(21) 99155-6383',
            github: 'https://github.com/claytonmarcelo',
            linkedin: 'https://linkedin.com/in/clayton-marcelo-dev',
            localizacao: 'Rio de Janeiro/RJ',
            sobre: 'Estudante de Análise e Desenvolvimento de Sistemas (4º período) com portfólio prático de mais de 10 projetos full-stack e mobile publicados no GitHub, incluindo sistemas SaaS completos (ERP, gestão de equipes de campo) e aplicativos com integração a APIs externas e geolocalização em tempo real. Autodidata, com domínio do ciclo completo de desenvolvimento: modelagem de banco de dados, back-end, front-end, autenticação e deploy em produção. Busco oportunidade de estágio ou posição júnior para aplicar e evoluir essas habilidades em um time de tecnologia.',
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
        // Upsert: insere se não existir, ignora se já existir
        const [rows] = await connection.execute('SELECT id FROM curriculo WHERE id = 1');
        if (rows.length === 0) {
            await connection.execute('INSERT INTO curriculo (id, dados, updated_by) VALUES (1, ?, ?)', [
                JSON.stringify(seedData),
                'seed',
            ]);
            console.log('[migrate_curriculo] Seed inicial do currículo inserido com sucesso.');
        }
        else {
            console.log('[migrate_curriculo] Currículo já existente — seed ignorado.');
        }
        console.log('[migrate_curriculo] Migração concluída com sucesso.');
    }
    catch (error) {
        console.error('[migrate_curriculo] Erro na migração:', error);
        throw error;
    }
    finally {
        connection.release();
    }
}
migrateCurriculo()
    .then(() => {
    console.log('[migrate_curriculo] Processo finalizado.');
    process.exit(0);
})
    .catch((err) => {
    console.error('[migrate_curriculo] Falha fatal:', err);
    process.exit(1);
});
