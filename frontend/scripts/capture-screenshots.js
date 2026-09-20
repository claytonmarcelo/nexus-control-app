import puppeteer from 'puppeteer-core';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const OUTPUT_DIR = path.resolve(__dirname, '../../docs/screenshots');

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Payload de usuário admin mockado
const mockUser = {
  id: 1,
  nome: 'Clayton Marcelo',
  email: 'admin@nexuscontrol.com',
  nivel_acesso: 'admin',
  ativo: 1,
  permissions: {
    dashboard: true,
    itens: true,
    carrinho: true,
    checkout: true,
    pedidos: true,
    usuarios: true,
    admin: true,
    perfil: true,
    sobre: true,
  }
};

// Produtos mockados para catálogo e dashboard
const mockItems = [
  { id: 1, nome: 'Servidor Dell PowerEdge R750', categoria: 'Servidores', preco_venda: '28900.00', preco_aluguel: '1450.00', estoque: 12, imagem: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=500&auto=format&fit=crop', fabricante: 'Dell', modelo: 'PowerEdge R750' },
  { id: 2, nome: 'Switch Cisco Catalyst 9300 48P', categoria: 'Redes', preco_venda: '16500.00', preco_aluguel: '820.00', estoque: 8, imagem: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=500&auto=format&fit=crop', fabricante: 'Cisco', modelo: 'Catalyst 9300' },
  { id: 3, nome: 'Firewall Fortinet FortiGate 60F', categoria: 'Segurança', preco_venda: '7800.00', preco_aluguel: '390.00', estoque: 15, imagem: 'https://images.unsplash.com/photo-1563770660941-20978e870e26?w=500&auto=format&fit=crop', fabricante: 'Fortinet', modelo: 'FG-60F' },
  { id: 4, nome: 'Access Point Ubiquiti UniFi U6 Pro', categoria: 'Wireless', preco_venda: '1450.00', preco_aluguel: '95.00', estoque: 34, imagem: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=500&auto=format&fit=crop', fabricante: 'Ubiquiti', modelo: 'U6-Pro' },
  { id: 5, nome: 'Nobreak APC Smart-UPS 3000VA', categoria: 'Energia', preco_venda: '8900.00', preco_aluguel: '450.00', estoque: 6, imagem: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=500&auto=format&fit=crop', fabricante: 'APC', modelo: 'SMT3000' },
  { id: 6, nome: 'Storage NAS QNAP 8 Baias', categoria: 'Armazenamento', preco_venda: '12400.00', preco_aluguel: '620.00', estoque: 5, imagem: 'https://images.unsplash.com/photo-1597852074816-d933c4d2b988?w=500&auto=format&fit=crop', fabricante: 'QNAP', modelo: 'TS-873A' },
];

const mockUsers = [
  { id: 1, nome: 'Clayton Marcelo', email: 'admin@nexuscontrol.com', nivel_acesso: 'admin', ativo: 1 },
  { id: 2, nome: 'Mariana Silva', email: 'mariana.silva@techcorp.com.br', nivel_acesso: 'funcionario', ativo: 1 },
  { id: 3, nome: 'Carlos Eduardo Santos', email: 'carlos.santos@enterprise.io', nivel_acesso: 'cliente', ativo: 1 },
  { id: 4, nome: 'Fernanda Lima Oliveira', email: 'fernanda@nexuscontrol.com', nivel_acesso: 'funcionario', ativo: 1 },
  { id: 5, nome: 'Rafael Costa Albuquerque', email: 'r.costa@solutions.com', nivel_acesso: 'cliente', ativo: 1 },
];

const mockOrders = [
  { id: 1042, total: 36700.00, status_pagamento: 'confirmado', status_pedido: 'processando', data_criacao: '2026-09-18T14:20:00Z', usuario_nome: 'Carlos Eduardo Santos' },
  { id: 1041, total: 16500.00, status_pagamento: 'confirmado', status_pedido: 'concluido', data_criacao: '2026-09-17T11:05:00Z', usuario_nome: 'Rafael Costa' },
  { id: 1040, total: 8900.00, status_pagamento: 'pendente', status_pedido: 'novo', data_criacao: '2026-09-16T16:45:00Z', usuario_nome: 'TechCorp Brasil' },
  { id: 1039, total: 28900.00, status_pagamento: 'confirmado', status_pedido: 'concluido', data_criacao: '2026-09-15T09:12:00Z', usuario_nome: 'InovaTech Solutions' },
];

async function capture() {
  console.log('[capture] Iniciando Chrome headless...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900'],
    defaultViewport: { width: 1440, height: 900, deviceScaleFactor: 2 }
  });

  const page = await browser.newPage();

  // Intercepta e responde às APIs com dados ricos
  await page.setRequestInterception(true);
  page.on('request', (req) => {
    const url = req.url();
    if (url.includes('/api/auth/me')) {
      req.respond({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: { user: mockUser } })
      });
    } else if (url.includes('/api/itens')) {
      req.respond({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: { items: mockItems, total: mockItems.length } })
      });
    } else if (url.includes('/api/usuarios')) {
      req.respond({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: { users: mockUsers, total: mockUsers.length } })
      });
    } else if (url.includes('/api/pedidos')) {
      req.respond({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: { orders: mockOrders, total: mockOrders.length } })
      });
    } else if (url.includes('/api/health') || url.includes('/api/status')) {
      req.respond({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: { status: 'healthy', users: 5, items: 6 } })
      });
    } else if (url.includes('/api/curriculo')) {
      req.continue();
    } else {
      req.continue();
    }
  });

  // Função para injetar autenticação no localStorage
  const setupAuth = async () => {
    await page.evaluate((u) => {
      // Cria JWT mock válido
      const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
      const payload = btoa(JSON.stringify({ id: u.id, email: u.email, nivel_acesso: u.nivel_acesso, exp: Math.floor(Date.now()/1000) + 86400 }));
      const token = `${header}.${payload}.signature`;
      localStorage.setItem('accessToken', token);
      localStorage.setItem('refreshToken', 'mock-refresh-token');
      localStorage.setItem('cart', JSON.stringify([
        { id: 1, item: { id: 1, nome: 'Servidor Dell PowerEdge R750', preco_venda: '28900.00', preco_aluguel: '1450.00', imagem: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=500&auto=format&fit=crop' }, tipo: 'venda', quantidade: 1 },
        { id: 2, item: { id: 2, nome: 'Switch Cisco Catalyst 9300 48P', preco_venda: '16500.00', preco_aluguel: '820.00', imagem: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=500&auto=format&fit=crop' }, tipo: 'aluguel', quantidade: 2 }
      ]));
    }, mockUser);
  };

  const screens = [
    { name: 'dashboard.png', url: 'http://localhost:4173/dashboard', waitSelector: '.card', label: 'Dashboard' },
    { name: 'catalogo.png', url: 'http://localhost:4173/itens', waitSelector: '.grid', label: 'Catálogo de Produtos' },
    { name: 'admin.png', url: 'http://localhost:4173/admin', waitSelector: 'nav[role="tablist"]', label: 'Admin Control Center' },
    { name: 'curriculo.png', url: 'http://localhost:4173/curriculo', waitSelector: 'h1', label: 'Currículo Técnico' },
    { name: 'usuarios.png', url: 'http://localhost:4173/usuarios', waitSelector: 'table, .card', label: 'Gestão de Usuários' },
    { name: 'carrinho.png', url: 'http://localhost:4173/carrinho', waitSelector: '.card, button', label: 'Carrinho de Compras' },
    { name: 'checkout.png', url: 'http://localhost:4173/checkout', waitSelector: 'form, .card', label: 'Checkout & Pagamentos' },
    { name: 'sobre.png', url: 'http://localhost:4173/sobre', waitSelector: 'h1, h2', label: 'Quem Somos' },
  ];

  for (const screen of screens) {
    console.log(`[capture] Capturando ${screen.label}...`);
    await page.goto('http://localhost:4173/', { waitUntil: 'networkidle0' });
    await setupAuth();
    await page.goto(screen.url, { waitUntil: 'networkidle0' });
    try {
      await page.waitForSelector(screen.waitSelector, { timeout: 4000 });
    } catch {
      // continua mesmo se demorar
    }
    // Aguarda animações CSS terminarem
    await new Promise(r => setTimeout(r, 1200));

    const outputPath = path.join(OUTPUT_DIR, screen.name);
    await page.screenshot({ path: outputPath, fullPage: false });
    console.log(`[capture] Salvo: ${outputPath}`);
  }

  await browser.close();
  console.log('[capture] Todas as capturas foram salvas com sucesso em docs/screenshots/');
}

capture().catch((err) => {
  console.error('[capture] Falha:', err);
  process.exit(1);
});
