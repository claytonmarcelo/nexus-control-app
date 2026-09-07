import pool from '../config/database.js';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import type { ResultSetHeader, RowDataPacket } from 'mysql2';
import { ROOT_ADMIN_EMAIL, ROOT_ADMIN_NAME } from '../config/access.js';

dotenv.config();

const seedUsers = [
  {
    nome: ROOT_ADMIN_NAME,
    email: ROOT_ADMIN_EMAIL,
    senha: process.env.ROOT_ADMIN_PASSWORD || '26481#',
    nivel_acesso: 'admin'
  },
  {
    nome: 'Funcionário Teste',
    email: 'funcionario@nexuscontrol.com',
    senha: 'func123',
    nivel_acesso: 'funcionario'
  },
  {
    nome: 'Cliente Teste',
    email: 'cliente@nexuscontrol.com',
    senha: 'cliente123',
    nivel_acesso: 'cliente'
  }
];

const seedItems = [
  { nome: 'Servidor Rack Dell PowerEdge R440', descricao: 'Servidor 1U ideal para virtualização, bancos de dados corporativos e aplicações críticas.', categoria: 'Servidores', fabricante: 'Dell', imagem_url: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&q=80', valor_venda: 25999.90, valor_aluguel_mensal: 1299.90, criado_por_email: ROOT_ADMIN_EMAIL },
  { nome: 'Switch Cisco Catalyst 9200L', descricao: 'Switch gerenciável de 48 portas Gigabit, suporte PoE+, e uplinks 10G para redes escaláveis.', categoria: 'Rede', fabricante: 'Cisco', imagem_url: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=800&q=80', valor_venda: 14599.90, valor_aluguel_mensal: 849.90, criado_por_email: ROOT_ADMIN_EMAIL },
  { nome: 'Roteador Wi-Fi 6 Ubiquiti UniFi Dream Machine', descricao: 'Console corporativo All-in-One: roteamento avançado, segurança, e controladora Wi-Fi 6.', categoria: 'Rede', fabricante: 'Ubiquiti', imagem_url: 'https://images.unsplash.com/photo-1605810230434-7631ac76ec81?w=800&q=80', valor_venda: 4899.90, valor_aluguel_mensal: 259.90, criado_por_email: 'funcionario@nexuscontrol.com' },
  { nome: 'Câmera IP Intelbras VIP 9360', descricao: 'Câmera de segurança 4K, lente varifocal, inteligência artificial avançada e IR 60m.', categoria: 'Segurança', fabricante: 'Intelbras', imagem_url: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&q=80', valor_venda: 3299.90, valor_aluguel_mensal: 189.90, criado_por_email: 'funcionario@nexuscontrol.com' },
  { nome: 'Nobreak Senoidal APC Smart-UPS 3000VA', descricao: 'Proteção elétrica pura para racks e data centers. Gestão via rede e altíssima autonomia.', categoria: 'Energia', fabricante: 'APC', imagem_url: 'https://images.unsplash.com/photo-1593344607421-4f24300fa88e?w=800&q=80', valor_venda: 6199.90, valor_aluguel_mensal: 389.90, criado_por_email: ROOT_ADMIN_EMAIL },
  { nome: 'Módulo de Suporte Técnico Mensal', descricao: 'Monitoramento 24/7, suporte N1/N2 remoto e SLA de 4 horas para incidentes críticos.', categoria: 'Serviços', fabricante: 'Nexus Control', imagem_url: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&q=80', valor_venda: 0, valor_aluguel_mensal: 1999.90, criado_por_email: ROOT_ADMIN_EMAIL },
  { nome: 'Instalação e Configuração de Redes', descricao: 'Mapeamento, passagem de cabeamento estruturado, configuração de racks e switches.', categoria: 'Serviços', fabricante: 'Nexus Control', imagem_url: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=800&q=80', valor_venda: 2500.00, valor_aluguel_mensal: 0, criado_por_email: ROOT_ADMIN_EMAIL },
  { nome: 'Consultoria em Segurança Digital', descricao: 'Análise de vulnerabilidades, pentest, adequação LGPD e plano de recuperação de desastres.', categoria: 'Serviços', fabricante: 'Nexus Control', imagem_url: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800&q=80', valor_venda: 4500.00, valor_aluguel_mensal: 0, criado_por_email: ROOT_ADMIN_EMAIL },
  { nome: 'Migração para Nuvem AWS', descricao: 'Planejamento e execução de migração de servidores on-premise para infraestrutura AWS.', categoria: 'Serviços', fabricante: 'Nexus Control', imagem_url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&q=80', valor_venda: 8900.00, valor_aluguel_mensal: 0, criado_por_email: ROOT_ADMIN_EMAIL }
];

export const seedDatabase = async () => {
  console.log('🌱 Iniciando seed do banco de dados...');

  try {
    const userIds = new Map();

    for (const user of seedUsers) {
      const [existing] = await pool.execute<RowDataPacket[]>('SELECT id FROM usuarios WHERE email = ?', [user.email]);
      const hashedPassword = await bcrypt.hash(user.senha, 12);
      
      if (existing.length === 0) {
        const [result] = await pool.execute<ResultSetHeader>(
          'INSERT INTO usuarios (nome, email, senha, nivel_acesso, criado_em) VALUES (?, ?, ?, ?, NOW())',
          [user.nome, user.email, hashedPassword, user.nivel_acesso]
        );
        userIds.set(user.email, result.insertId);
        console.log(`✅ Usuário criado: ${user.email} (${user.nivel_acesso})`);
      } else {
        userIds.set(user.email, existing[0].id);
        if (user.email === ROOT_ADMIN_EMAIL) {
          await pool.execute(
            'UPDATE usuarios SET nome = ?, senha = ?, nivel_acesso = ? WHERE id = ?',
            [user.nome, hashedPassword, user.nivel_acesso, existing[0].id]
          );
          console.log(`🔒 Administrador raiz garantido: ${user.email}`);
        }
        console.log(`⏭️ Usuário já existe: ${user.email}`);
      }
    }

    for (const item of seedItems) {
      const userId = userIds.get(item.criado_por_email);
      const [existing] = await pool.execute<RowDataPacket[]>('SELECT id FROM itens WHERE nome = ? AND criado_por = ?', [item.nome, userId]);
      
      if (existing.length === 0) {
        await pool.execute(
          'INSERT INTO itens (nome, descricao, categoria, fabricante, imagem_url, valor_venda, valor_aluguel_mensal, estoque, criado_por, criado_em) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())',
          [item.nome, item.descricao, item.categoria, item.fabricante, item.imagem_url, item.valor_venda, item.valor_aluguel_mensal, 10, userId]
        );
        console.log(`✅ Item criado: ${item.nome}`);
      } else {
        await pool.execute(
          'UPDATE itens SET descricao = ?, categoria = ?, fabricante = ?, imagem_url = ?, valor_venda = ?, valor_aluguel_mensal = ?, estoque = GREATEST(estoque, 10) WHERE id = ?',
          [item.descricao, item.categoria, item.fabricante, item.imagem_url, item.valor_venda, item.valor_aluguel_mensal, existing[0].id]
        );
        console.log(`⏭️ Item já existe: ${item.nome}`);
      }
    }

    // Criar pedidos de exemplo para demonstração
    const clienteId = userIds.get('cliente@nexuscontrol.com');
    const adminId = userIds.get(ROOT_ADMIN_EMAIL);

    const sampleOrders = [
      {
        usuario_id: clienteId,
        items: [
          { id: 1, nome: 'Notebook Dell XPS 15', quantidade: 1, preco_unitario: 8999.90 },
          { id: 3, nome: 'Teclado Mecânico Keychron K2', quantidade: 1, preco_unitario: 699.90 }
        ],
        total: 9699.80,
        metodo_pagamento: 'pix',
        status_pagamento: 'confirmado'
      },
      {
        usuario_id: clienteId,
        items: [
          { id: 4, nome: 'Mouse Logitech MX Master 3', quantidade: 2, preco_unitario: 549.90 }
        ],
        total: 1099.80,
        metodo_pagamento: 'cartao',
        status_pagamento: 'confirmado'
      }
    ];

    for (const order of sampleOrders) {
      const [existing] = await pool.execute<RowDataPacket[]>(
        'SELECT id FROM pedidos WHERE usuario_id = ? AND total = ? LIMIT 1',
        [order.usuario_id, order.total]
      );

      if (existing.length === 0) {
        await pool.execute(
          'INSERT INTO pedidos (usuario_id, items, total, metodo_pagamento, status_pagamento, criado_em) VALUES (?, ?, ?, ?, ?, NOW())',
          [order.usuario_id, JSON.stringify(order.items), order.total, order.metodo_pagamento, order.status_pagamento]
        );
        console.log(`✅ Pedido de exemplo criado para usuário ${order.usuario_id}`);
      }
    }

    console.log('✅ Seed concluído com sucesso');
  } catch (error) {
    console.error('❌ Erro no seed:', error.message);
    throw error;
  }
};

const run = async () => {
  try {
    await seedDatabase();
    process.exit(0);
  } catch (error) {
    console.error('❌ Falha no seed:', error);
    process.exit(1);
  }
};

run();