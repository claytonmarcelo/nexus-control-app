import pool from '../../infrastructure/config/database.js';
import { sendSuccess, sendError } from '../../infrastructure/utils/response.js';

// Dados padrão de fallback caso a tabela ainda não exista ou esteja vazia
const DEFAULT_CURRICULO = {
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

/**
 * GET /api/curriculo — Público, sem autenticação
 * Retorna os dados do currículo armazenados no banco
 */
export const getCurriculo = async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT dados, updated_at FROM curriculo WHERE id = 1');

    if (rows.length === 0) {
      // Retorna dados padrão se não existir no banco
      return sendSuccess(res, { curriculo: DEFAULT_CURRICULO, updated_at: null }, 'Currículo padrão');
    }

    const dados = typeof rows[0].dados === 'string' ? JSON.parse(rows[0].dados) : rows[0].dados;

    sendSuccess(res, { curriculo: dados, updated_at: rows[0].updated_at }, 'Currículo carregado com sucesso');
  } catch (error) {
    console.error('[curriculoController] Erro ao buscar currículo:', error);
    // Em caso de erro (ex: tabela não existe), retorna dados padrão
    sendSuccess(res, { curriculo: DEFAULT_CURRICULO, updated_at: null }, 'Currículo padrão (fallback)');
  }
};

/**
 * PUT /api/curriculo — Requer autenticação + role admin
 * Atualiza os dados do currículo no banco
 */
export const updateCurriculo = async (req, res) => {
  try {
    const { curriculo } = req.body;

    if (!curriculo || typeof curriculo !== 'object') {
      return sendError(res, 'O campo "curriculo" é obrigatório e deve ser um objeto JSON válido', 400);
    }

    // Validações básicas
    if (!curriculo.nome || typeof curriculo.nome !== 'string') {
      return sendError(res, 'O campo "nome" é obrigatório', 400);
    }

    const updatedBy = req.user?.email || 'admin';

    // Upsert: atualiza se existir, insere se não existir
    const [existingRows] = await pool.execute('SELECT id FROM curriculo WHERE id = 1');

    if (existingRows.length === 0) {
      await pool.execute('INSERT INTO curriculo (id, dados, updated_by) VALUES (1, ?, ?)', [
        JSON.stringify(curriculo),
        updatedBy,
      ]);
    } else {
      await pool.execute('UPDATE curriculo SET dados = ?, updated_by = ? WHERE id = 1', [
        JSON.stringify(curriculo),
        updatedBy,
      ]);
    }

    const [updatedRows] = await pool.execute('SELECT dados, updated_at FROM curriculo WHERE id = 1');
    const updatedData =
      typeof updatedRows[0].dados === 'string' ? JSON.parse(updatedRows[0].dados) : updatedRows[0].dados;

    sendSuccess(
      res,
      { curriculo: updatedData, updated_at: updatedRows[0].updated_at },
      'Currículo atualizado com sucesso'
    );
  } catch (error) {
    console.error('[curriculoController] Erro ao atualizar currículo:', error);
    sendError(res, 'Erro ao atualizar o currículo. Tente novamente.', 500);
  }
};
