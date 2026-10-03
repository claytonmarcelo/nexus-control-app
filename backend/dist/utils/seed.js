import pool from '../config/database.js';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { ROOT_ADMIN_EMAIL, ROOT_ADMIN_NAME } from '../config/access.js';
import { validatePassword } from '../infrastructure/utils/passwordPolicy.js';
dotenv.config();
const isProduction = process.env.NODE_ENV === 'production';
const rootAdminPassword = process.env.ROOT_ADMIN_PASSWORD || (isProduction ? '' : '264810#');
const seedUsers = [
    {
        nome: ROOT_ADMIN_NAME,
        email: ROOT_ADMIN_EMAIL,
        senha: rootAdminPassword,
        nivel_acesso: 'admin'
    },
    ...(!isProduction ? [
        {
            nome: 'Funcionário Teste',
            email: 'funcionario@nexuscontrol.com',
            senha: '123457#',
            nivel_acesso: 'funcionario'
        },
        {
            nome: 'Cliente Teste',
            email: 'cliente@nexuscontrol.com',
            senha: '123456#',
            nivel_acesso: 'cliente'
        }
    ] : [])
];
const seedItems = [
    { nome: 'Servidor Rack Dell PowerEdge R440', descricao: 'Servidor 1U ideal para virtualização, bancos de dados corporativos e aplicações críticas.', categoria: 'Servidores', fabricante: 'Dell', imagem_url: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&q=80', valor_venda: 25999.90, valor_aluguel_mensal: 1299.90, criado_por_email: ROOT_ADMIN_EMAIL },
    { nome: 'Switch Cisco Catalyst 9200L', descricao: 'Switch gerenciável de 48 portas Gigabit, suporte PoE+, e uplinks 10G para redes escaláveis.', categoria: 'Rede', fabricante: 'Cisco', imagem_url: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=800&q=80', valor_venda: 14599.90, valor_aluguel_mensal: 849.90, criado_por_email: ROOT_ADMIN_EMAIL },
    { nome: 'Roteador Wi-Fi 6 Ubiquiti UniFi Dream Machine', descricao: 'Console corporativo All-in-One: roteamento avançado, segurança, e controladora Wi-Fi 6.', categoria: 'Rede', fabricante: 'Ubiquiti', imagem_url: 'https://images.unsplash.com/photo-1605810230434-7631ac76ec81?w=800&q=80', valor_venda: 4899.90, valor_aluguel_mensal: 259.90, criado_por_email: 'funcionario@nexuscontrol.com' },
    { nome: 'Câmera IP Intelbras VIP 9360', descricao: 'Câmera de segurança 4K, lente varifocal, inteligência artificial avançada e IR 60m.', categoria: 'Segurança', fabricante: 'Intelbras', imagem_url: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&q=80', valor_venda: 3299.90, valor_aluguel_mensal: 189.90, criado_por_email: 'funcionario@nexuscontrol.com' },
    { nome: 'Nobreak Senoidal APC Smart-UPS 3000VA', descricao: 'Proteção elétrica pura para racks e data centers. Gestão via rede e altíssima autonomia.', categoria: 'Energia', fabricante: 'APC', imagem_url: 'https://images.unsplash.com/photo-1593344607421-4f24300fa88e?w=800&q=80', valor_venda: 6199.90, valor_aluguel_mensal: 389.90, criado_por_email: ROOT_ADMIN_EMAIL },
    { nome: 'Notebook Dell XPS 15', descricao: 'Laptop premium com display 4K, processador Intel i9, 32GB RAM e SSD de 1TB para profissionais.', categoria: 'Computadores', fabricante: 'Dell', imagem_url: 'https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=800&q=80', valor_venda: 12999.90, valor_aluguel_mensal: 699.90, criado_por_email: ROOT_ADMIN_EMAIL },
    { nome: 'Monitor Dell UltraSharp 32" 4K', descricao: 'Monitor profissional IPS de 32 polegadas com resolução 4K, calibração de cores e portas USB-C.', categoria: 'Periféricos', fabricante: 'Dell', imagem_url: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=800&q=80', valor_venda: 4599.90, valor_aluguel_mensal: 249.90, criado_por_email: ROOT_ADMIN_EMAIL },
    { nome: 'Teclado Mecânico Keychron K2', descricao: 'Teclado mecânico RGB wireless, switches Cherry MX Red e design compacto 75%.', categoria: 'Periféricos', fabricante: 'Keychron', imagem_url: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800&q=80', valor_venda: 699.90, valor_aluguel_mensal: 39.90, criado_por_email: 'funcionario@nexuscontrol.com' },
    { nome: 'Mouse Logitech MX Master 3', descricao: 'Mouse ergonômico wireless com sensor de alta precisão, scroll ultra-rápido e multi-dispositivo.', categoria: 'Periféricos', fabricante: 'Logitech', imagem_url: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=800&q=80', valor_venda: 549.90, valor_aluguel_mensal: 29.90, criado_por_email: 'funcionario@nexuscontrol.com' },
    { nome: 'Headset Sony WH-1000XM5', descricao: 'Fone de ouvido cancelamento de ruído ativo, 30h de bateria e qualidade de áudio premium.', categoria: 'Áudio', fabricante: 'Sony', imagem_url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80', valor_venda: 2499.90, valor_aluguel_mensal: 149.90, criado_por_email: ROOT_ADMIN_EMAIL },
    { nome: 'Storage NAS Synology DS923+', descricao: 'NAS de 4 baias com processador AMD Ryzen, 8GB RAM e suporte a 108TB de armazenamento.', categoria: 'Armazenamento', fabricante: 'Synology', imagem_url: 'https://images.unsplash.com/photo-1593062096033-9a26b09da705?w=800&q=80', valor_venda: 8999.90, valor_aluguel_mensal: 499.90, criado_por_email: ROOT_ADMIN_EMAIL },
    { nome: 'SSD Samsung 990 PRO 2TB', descricao: 'SSD NVMe M.2 de alta performance com velocidades de leitura de 7450MB/s e gravação de 6900MB/s.', categoria: 'Armazenamento', fabricante: 'Samsung', imagem_url: 'https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=800&q=80', valor_venda: 1899.90, valor_aluguel_mensal: 99.90, criado_por_email: 'funcionario@nexuscontrol.com' },
    { nome: 'Firewall Fortinet FortiGate 60F', descricao: 'Firewall NGFW com 10 portas, VPN, IPS/IDS e proteção contra ameaças avançadas.', categoria: 'Segurança', fabricante: 'Fortinet', imagem_url: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=800&q=80', valor_venda: 8999.90, valor_aluguel_mensal: 499.90, criado_por_email: ROOT_ADMIN_EMAIL },
    { nome: 'Access Point Aruba Instant On AP22', descricao: 'Access Point Wi-Fi 6 com 2x2 MIMO, até 1.77Gbps e fácil gerenciamento cloud.', categoria: 'Rede', fabricante: 'Aruba', imagem_url: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=800&q=80', valor_venda: 2499.90, valor_aluguel_mensal: 149.90, criado_por_email: 'funcionario@nexuscontrol.com' },
    { nome: 'Tablet iPad Pro 12.9" M2', descricao: 'Tablet profissional com chip M2, display Liquid Retina XDR e suporte a Apple Pencil.', categoria: 'Computadores', fabricante: 'Apple', imagem_url: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=800&q=80', valor_venda: 8999.90, valor_aluguel_mensal: 499.90, criado_por_email: ROOT_ADMIN_EMAIL },
    { nome: 'Módulo de Suporte Técnico Mensal', descricao: 'Monitoramento 24/7, suporte N1/N2 remoto e SLA de 4 horas para incidentes críticos.', categoria: 'Serviços', fabricante: 'Nexus Control', imagem_url: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&q=80', valor_venda: 0, valor_aluguel_mensal: 1999.90, criado_por_email: ROOT_ADMIN_EMAIL },
    { nome: 'Instalação e Configuração de Redes', descricao: 'Mapeamento, passagem de cabeamento estruturado, configuração de racks e switches.', categoria: 'Serviços', fabricante: 'Nexus Control', imagem_url: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=800&q=80', valor_venda: 2500.00, valor_aluguel_mensal: 0, criado_por_email: ROOT_ADMIN_EMAIL },
    { nome: 'Consultoria em Segurança Digital', descricao: 'Análise de vulnerabilidades, pentest, adequação LGPD e plano de recuperação de desastres.', categoria: 'Serviços', fabricante: 'Nexus Control', imagem_url: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800&q=80', valor_venda: 4500.00, valor_aluguel_mensal: 0, criado_por_email: ROOT_ADMIN_EMAIL },
    { nome: 'Migração para Nuvem AWS', descricao: 'Planejamento e execução de migração de servidores on-premise para infraestrutura AWS.', categoria: 'Serviços', fabricante: 'Nexus Control', imagem_url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&q=80', valor_venda: 8900.00, valor_aluguel_mensal: 0, criado_por_email: ROOT_ADMIN_EMAIL },
    { nome: 'Desenvolvimento de Aplicação Customizada', descricao: 'Desenvolvimento de software sob medida web, mobile e desktop com tecnologias modernas.', categoria: 'Serviços', fabricante: 'Nexus Control', imagem_url: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&q=80', valor_venda: 12500.00, valor_aluguel_mensal: 0, criado_por_email: 'funcionario@nexuscontrol.com' },
    { nome: 'Treinamento de Equipe em TI', descricao: 'Capacitação técnica em DevOps, Cloud Computing, Segurança da Informação e Desenvolvimento.', categoria: 'Serviços', fabricante: 'Nexus Control', imagem_url: 'https://images.unsplash.com/photo-1517048676732-d65bc937f952?w=800&q=80', valor_venda: 6500.00, valor_aluguel_mensal: 0, criado_por_email: 'funcionario@nexuscontrol.com' },
    // === Novos Produtos ===
    { nome: 'Servidor HPE ProLiant DL380 Gen10', descricao: 'Servidor 2U de alta performance para cargas de trabalho pesadas, virtualização enterprise e HPC.', categoria: 'Servidores', fabricante: 'HPE', imagem_url: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&q=80', valor_venda: 34999.90, valor_aluguel_mensal: 1799.90, criado_por_email: ROOT_ADMIN_EMAIL },
    { nome: 'Servidor Rack Supermicro SYS-1029P', descricao: 'Servidor compacto 1U com suporte a dual Xeon Scalable, ideal para cloud privada e hyperconvergência.', categoria: 'Servidores', fabricante: 'Supermicro', imagem_url: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&q=80', valor_venda: 19999.90, valor_aluguel_mensal: 999.90, criado_por_email: ROOT_ADMIN_EMAIL },
    { nome: 'Estabilizador SMS Revolution Speed 3kVA', descricao: 'Estabilizador senoidal com regulação precisa de tensão, proteção contra surtos e filtro de linha.', categoria: 'Energia', fabricante: 'SMS', imagem_url: 'https://images.unsplash.com/photo-1593344607421-4f24300fa88e?w=800&q=80', valor_venda: 2899.90, valor_aluguel_mensal: 159.90, criado_por_email: 'funcionario@nexuscontrol.com' },
    { nome: 'PDU Inteligente APC Rack Mount 32A', descricao: 'Unidade de distribuição de energia gerenciável com monitoramento remoto por tomada e alertas.', categoria: 'Energia', fabricante: 'APC', imagem_url: 'https://images.unsplash.com/photo-1593344607421-4f24300fa88e?w=800&q=80', valor_venda: 3499.90, valor_aluguel_mensal: 199.90, criado_por_email: ROOT_ADMIN_EMAIL },
    { nome: 'Impressora HP LaserJet Pro MFP M428fdw', descricao: 'Multifuncional laser monocromática com impressão duplex, scanner ADF e Wi-Fi integrado.', categoria: 'Impressoras', fabricante: 'HP', imagem_url: 'https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?w=800&q=80', valor_venda: 3199.90, valor_aluguel_mensal: 179.90, criado_por_email: 'funcionario@nexuscontrol.com' },
    { nome: 'Webcam Logitech Brio 4K', descricao: 'Webcam profissional Ultra HD 4K com HDR, Windows Hello e campo de visão ajustável de 90°.', categoria: 'Periféricos', fabricante: 'Logitech', imagem_url: 'https://images.unsplash.com/photo-1587826080692-f439cd0b70da?w=800&q=80', valor_venda: 1299.90, valor_aluguel_mensal: 69.90, criado_por_email: 'funcionario@nexuscontrol.com' },
    { nome: 'Speaker JBL Charge 5 Pro', descricao: 'Caixa de som Bluetooth portátil com som estéreo premium, IP67, powerbank e 20h de bateria.', categoria: 'Áudio', fabricante: 'JBL', imagem_url: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=800&q=80', valor_venda: 899.90, valor_aluguel_mensal: 49.90, criado_por_email: 'funcionario@nexuscontrol.com' },
    { nome: 'Rack de Piso 42U Furukawa', descricao: 'Rack padrão 19" de 42U com ventilação forçada, portas perfuradas e capacidade para 800kg.', categoria: 'Rack & Infraestrutura', fabricante: 'Furukawa', imagem_url: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&q=80', valor_venda: 4999.90, valor_aluguel_mensal: 299.90, criado_por_email: ROOT_ADMIN_EMAIL },
    { nome: 'Telefone IP Grandstream GRP2616', descricao: 'Telefone VoIP empresarial com 6 linhas, tela LCD colorida 4.3", Bluetooth e Wi-Fi dual-band.', categoria: 'Telefonia', fabricante: 'Grandstream', imagem_url: 'https://images.unsplash.com/photo-1596524430615-b46475ddff6e?w=800&q=80', valor_venda: 1599.90, valor_aluguel_mensal: 89.90, criado_por_email: 'funcionario@nexuscontrol.com' },
    // === Novos Serviços ===
    { nome: 'Backup & Disaster Recovery', descricao: 'Implementação de rotinas automatizadas de backup, replicação offsite e plano de recuperação de desastres.', categoria: 'Serviços', fabricante: 'Nexus Control', imagem_url: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=800&q=80', valor_venda: 5500.00, valor_aluguel_mensal: 899.90, criado_por_email: ROOT_ADMIN_EMAIL },
    { nome: 'Monitoramento de Infraestrutura 24/7', descricao: 'Setup e operação de monitoramento proativo com Zabbix/Grafana, alertas inteligentes e dashboards.', categoria: 'Serviços', fabricante: 'Nexus Control', imagem_url: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&q=80', valor_venda: 0, valor_aluguel_mensal: 1499.90, criado_por_email: ROOT_ADMIN_EMAIL },
    { nome: 'Cabeamento Estruturado Certificado', descricao: 'Projeto, instalação e certificação de infraestrutura de cabeamento Cat6/Cat6a e fibra óptica.', categoria: 'Serviços', fabricante: 'Nexus Control', imagem_url: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=800&q=80', valor_venda: 3800.00, valor_aluguel_mensal: 0, criado_por_email: 'funcionario@nexuscontrol.com' },
    { nome: 'Gestão de Licenças & Ativos', descricao: 'Inventário automatizado, controle de licenças Microsoft/Adobe/Oracle e gestão de ciclo de vida de ativos.', categoria: 'Serviços', fabricante: 'Nexus Control', imagem_url: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80', valor_venda: 0, valor_aluguel_mensal: 799.90, criado_por_email: ROOT_ADMIN_EMAIL },
    { nome: 'Service Desk Dedicado', descricao: 'Equipe de suporte N1/N2/N3 exclusiva com atendimento presencial e remoto, SLA customizado e portal de chamados.', categoria: 'Serviços', fabricante: 'Nexus Control', imagem_url: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&q=80', valor_venda: 0, valor_aluguel_mensal: 2499.90, criado_por_email: ROOT_ADMIN_EMAIL },
];
export const seedDatabase = async () => {
    console.log('🌱 Iniciando seed do banco de dados...');
    try {
        const userIds = new Map();
        for (const user of seedUsers) {
            const [existing] = await pool.execute('SELECT id FROM usuarios WHERE email = ?', [user.email]);
            if (existing.length === 0) {
                if (validatePassword(user.senha) !== true) {
                    throw new Error(`A senha inicial configurada para ${user.email} não atende à política global.`);
                }
                const hashedPassword = await bcrypt.hash(user.senha, 12);
                const [result] = await pool.execute('INSERT INTO usuarios (nome, email, senha, nivel_acesso, criado_em) VALUES (?, ?, ?, ?, NOW())', [user.nome, user.email, hashedPassword, user.nivel_acesso]);
                userIds.set(user.email, result.insertId);
                console.log(`✅ Usuário criado: ${user.email} (${user.nivel_acesso})`);
            }
            else {
                userIds.set(user.email, existing[0].id);
                if (user.email === ROOT_ADMIN_EMAIL) {
                    await pool.execute('UPDATE usuarios SET nome = ?, nivel_acesso = ? WHERE id = ?', [user.nome, user.nivel_acesso, existing[0].id]);
                    console.log(`🔒 Administrador raiz garantido sem alterar a senha existente: ${user.email}`);
                }
                console.log(`⏭️ Usuário já existe: ${user.email}`);
            }
        }
        // Garantir que sempre temos um ID de usuário válido para vincular aos itens
        let fallbackUserId = 1;
        const [firstUserRows] = await pool.execute('SELECT id FROM usuarios ORDER BY id ASC LIMIT 1');
        if (firstUserRows.length > 0) {
            fallbackUserId = Number(firstUserRows[0].id);
        }
        for (const item of seedItems) {
            const creatorUserId = userIds.get(item.criado_por_email) || userIds.get(ROOT_ADMIN_EMAIL) || fallbackUserId;
            const [existing] = await pool.execute('SELECT id FROM itens WHERE nome = ? LIMIT 1', [item.nome]);
            if (existing.length === 0) {
                await pool.execute('INSERT INTO itens (nome, descricao, categoria, fabricante, imagem_url, valor_venda, valor_aluguel_mensal, estoque, criado_por, criado_em) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())', [item.nome, item.descricao, item.categoria, item.fabricante, item.imagem_url, item.valor_venda, item.valor_aluguel_mensal, 10, creatorUserId]);
                console.log(`✅ Item criado: ${item.nome}`);
            }
            else {
                await pool.execute('UPDATE itens SET descricao = ?, categoria = ?, fabricante = ?, imagem_url = ?, valor_venda = ?, valor_aluguel_mensal = ?, estoque = GREATEST(estoque, 10) WHERE id = ?', [item.descricao, item.categoria, item.fabricante, item.imagem_url, item.valor_venda, item.valor_aluguel_mensal, existing[0].id]);
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
                    { nome: 'Notebook Dell XPS 15', quantidade: 1, preco_unitario: 12999.90 },
                    { nome: 'Teclado Mecânico Keychron K2', quantidade: 1, preco_unitario: 699.90 }
                ],
                total: 13699.80,
                metodo_pagamento: 'pix',
                status_pagamento: 'confirmado'
            },
            {
                usuario_id: clienteId,
                items: [
                    { nome: 'Mouse Logitech MX Master 3', quantidade: 2, preco_unitario: 549.90 }
                ],
                total: 1099.80,
                metodo_pagamento: 'cartao',
                status_pagamento: 'confirmado'
            }
        ];
        if (!isProduction) {
            for (const order of sampleOrders) {
                const [existing] = await pool.execute('SELECT id FROM pedidos WHERE usuario_id = ? AND total = ? LIMIT 1', [order.usuario_id, order.total]);
                if (existing.length === 0) {
                    await pool.execute('INSERT INTO pedidos (usuario_id, items, total, metodo_pagamento, status_pagamento, criado_em) VALUES (?, ?, ?, ?, ?, NOW())', [order.usuario_id, JSON.stringify(order.items), order.total, order.metodo_pagamento, order.status_pagamento]);
                    console.log(`✅ Pedido de exemplo criado para usuário ${order.usuario_id}`);
                }
            }
        }
        console.log('✅ Seed concluído com sucesso');
    }
    catch (error) {
        console.error('❌ Erro no seed:', error.message);
        throw error;
    }
};
// Executar diretamente apenas quando chamado como script (não quando importado pelo servidor)
const isDirectRun = process.argv[1]?.endsWith('seed.js') || process.argv[1]?.endsWith('seed.ts');
if (isDirectRun) {
    const run = async () => {
        try {
            await seedDatabase();
            process.exit(0);
        }
        catch (error) {
            console.error('❌ Falha no seed:', error);
            process.exit(1);
        }
    };
    run();
}
