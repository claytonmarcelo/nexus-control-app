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

const mockCart = [
  {
    id: "76",
    item_id: 76,
    nome: "Monitor Dell UltraSharp 32\" 4K",
    descricao: "Monitor profissional IPS de 32 polegadas com resolução 4K, calibração de cores e portas USB-C.",
    fabricante: "Dell",
    imagem_url: "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=800&q=80",
    preco_unitario: 4599.90,
    quantidade: 1,
    categoria: "Periféricos"
  },
  {
    id: "77",
    item_id: 77,
    nome: "Headset Sony WH-1000XM5",
    descricao: "Fone de ouvido cancelamento de ruído ativo, 30h de bateria e qualidade de áudio premium.",
    fabricante: "Sony",
    imagem_url: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80",
    preco_unitario: 2499.90,
    quantidade: 2,
    categoria: "Áudio"
  }
];

async function capture() {
  console.log('[capture] Iniciando Chrome em http://localhost:5173...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900'],
    defaultViewport: { width: 1440, height: 900, deviceScaleFactor: 2 }
  });

  const page = await browser.newPage();

  // 1. Acessa tela de login
  console.log('[capture] Navegando para tela de login...');
  await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle0' });

  // 2. Preenche formulário de login
  await page.waitForSelector('input[type="email"]', { timeout: 10000 });
  await page.type('input[type="email"]', 'marcelo10@gmail.com');
  await page.type('input[type="password"]', '26481#');
  
  console.log('[capture] Realizando login autenticado...');
  await Promise.all([
    page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 15000 }).catch(() => {}),
    page.click('button[type="submit"]')
  ]);

  await new Promise(r => setTimeout(r, 2000));

  // Injeta itens no carrinho via localStorage
  await page.evaluate((cartData) => {
    localStorage.setItem('nexus-control-cart', JSON.stringify(cartData));
  }, mockCart);

  // 6 telas oficiais do projeto (Currículo Técnico e Quem Somos foram eliminadas conforme solicitado)
  const screens = [
    {
      name: 'dashboard.png',
      url: 'http://localhost:5173/dashboard',
      waitSelector: '.stat-card, h1, .grid',
      label: 'Dashboard'
    },
    {
      name: 'catalogo.png',
      url: 'http://localhost:5173/itens',
      waitSelector: 'article, .grid',
      label: 'Catálogo de Produtos'
    },
    {
      name: 'admin.png',
      url: 'http://localhost:5173/admin',
      waitSelector: 'button, h1, nav',
      label: 'Admin Control Center'
    },
    {
      name: 'usuarios.png',
      url: 'http://localhost:5173/usuarios',
      waitSelector: 'table, .glass, h1',
      label: 'Gestão de Usuários'
    },
    {
      name: 'carrinho.png',
      url: 'http://localhost:5173/carrinho',
      waitSelector: 'button, .glass, h1',
      label: 'Carrinho de Compras'
    },
    {
      name: 'checkout.png',
      url: 'http://localhost:5173/checkout',
      waitSelector: 'button, form, h1',
      label: 'Checkout & Pagamentos'
    }
  ];

  for (const screen of screens) {
    console.log(`[capture] Capturando ${screen.label} (${screen.url})...`);
    await page.goto(screen.url, { waitUntil: 'networkidle0' });
    try {
      await page.waitForSelector(screen.waitSelector, { timeout: 8000 });
    } catch (e) {
      console.warn(`[capture] Timeout aguardando seletor para ${screen.label}`);
    }
    // Aguarda transições e dados renderizarem
    await new Promise(r => setTimeout(r, 2000));

    const outputPath = path.join(OUTPUT_DIR, screen.name);
    await page.screenshot({ path: outputPath, fullPage: false });
    console.log(`[capture] Salvo com sucesso: ${outputPath}`);
  }

  await browser.close();
  console.log('[capture] Todas as capturas oficiais foram salvas com sucesso em docs/screenshots/');
}

capture().catch((err) => {
  console.error('[capture] Falha:', err);
  process.exit(1);
});
