import puppeteer from 'puppeteer-core';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

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

async function verifyAll() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox']
  });

  const page = await browser.newPage();
  let errors = [];

  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(`Console error on ${page.url()}: ${msg.text()}`);
    }
  });

  page.on('pageerror', err => {
    errors.push(`Page error on ${page.url()}: ${err.message}`);
  });

  // Setup auth
  await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle0' });
  await page.evaluate((u) => {
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const payload = btoa(JSON.stringify({ id: u.id, email: u.email, nivel_acesso: u.nivel_acesso, exp: Math.floor(Date.now()/1000) + 86400 }));
    const token = `${header}.${payload}.signature`;
    localStorage.setItem('accessToken', token);
    localStorage.setItem('refreshToken', 'mock-refresh-token');
  }, mockUser);

  const routes = [
    '/login',
    '/curriculo',
    '/dashboard',
    '/itens',
    '/carrinho',
    '/usuarios',
    '/admin',
    '/sobre',
    '/perfil',
  ];

  for (const route of routes) {
    await page.goto(`http://localhost:5173${route}`, { waitUntil: 'domcontentloaded' });
    await new Promise(r => setTimeout(r, 600));
    const title = await page.title();
    console.log(`✓ Rota ${route} carregou OK! URL: ${page.url()}`);
  }

  await browser.close();

  if (errors.length > 0) {
    console.error('Erros encontrados:', errors);
    process.exit(1);
  } else {
    console.log('\n🎉 TODAS AS ROTAS CARREGARAM 100% SEM NENHUM ERRO!');
  }
}

verifyAll().catch(err => {
  console.error(err);
  process.exit(1);
});
