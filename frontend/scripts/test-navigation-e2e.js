import puppeteer from 'puppeteer-core';
import fs from 'fs';

const CHROME_PATH = process.env.CHROME_PATH || 
  (fs.existsSync('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe') 
    ? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe' 
    : 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe');


async function testNavigation() {
  console.log('🚀 Iniciando teste automatizado de navegação e componentes no Chrome...\n');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1280,800'],
    defaultViewport: { width: 1280, height: 800 }
  });

  const page = await browser.newPage();
  let errors = [];

  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(`Console error on ${page.url()}: ${msg.text()}`);
    }
  });

  page.on('pageerror', err => {
    errors.push(`Page exception on ${page.url()}: ${err.message}`);
    console.error(`💥 PAGE EXCEPTION: ${err.message}`);
  });

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      throw new Error(`Falha no teste: ${message}`);
    }
  }

  try {
    // -------------------------------------------------------------
    // ETAPA 1: Login & Toggle de Senha no Login
    // -------------------------------------------------------------
    console.log('📍 1. Testando página de Login e alternância de visibilidade da senha...');
    await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle0' });

    await page.waitForSelector('#email');
    await page.type('#email', 'cliente@nexuscontrol.com');
    await page.type('#senha', '123456#');

    // Verificar tipo de input antes do toggle
    let senhaType = await page.$eval('#senha', el => el.getAttribute('type'));
    assert(senhaType === 'password', 'Input de senha inicia como tipo password');

    // Clicar no botão do olho
    await page.click('.auth-eye-btn');
    senhaType = await page.$eval('#senha', el => el.getAttribute('type'));
    assert(senhaType === 'text', 'Input de senha alternou para text (visível)');

    // Clicar no botão do olho novamente
    await page.click('.auth-eye-btn');
    senhaType = await page.$eval('#senha', el => el.getAttribute('type'));
    assert(senhaType === 'password', 'Input de senha alternou de volta para password (oculto)');

    // -------------------------------------------------------------
    // ETAPA 2: Toggle de Senha no Cadastro (Register)
    // -------------------------------------------------------------
    console.log('\n📍 2. Testando alternância de visibilidade no formulário de Cadastro...');
    const registerLink = await page.waitForSelector('button[aria-label="Ir para cadastro"]');
    await registerLink.click();
    await new Promise(r => setTimeout(r, 600)); // aguardar rotação 3D

    await page.waitForSelector('#register-senha');
    await page.waitForSelector('#register-confirm');

    await page.type('#register-senha', '123456#');
    await page.type('#register-confirm', '123456#');

    // Senha principal do cadastro
    let regSenhaType = await page.$eval('#register-senha', el => el.getAttribute('type'));
    assert(regSenhaType === 'password', 'Senha do cadastro inicia como password');

    // Confirmar senha do cadastro
    let regConfType = await page.$eval('#register-confirm', el => el.getAttribute('type'));
    assert(regConfType === 'password', 'Confirmação de senha inicia como password');

    // Clicar no olho da confirmação de senha
    const eyeBtns = await page.$$('.auth-eye-btn');
    // eyeBtns[2] é o botão do campo de confirmação
    if (eyeBtns.length >= 3) {
      await eyeBtns[2].click();
      regConfType = await page.$eval('#register-confirm', el => el.getAttribute('type'));
      assert(regConfType === 'text', 'Confirmação de senha alternou para text (visível)');

      await eyeBtns[2].click();
      regConfType = await page.$eval('#register-confirm', el => el.getAttribute('type'));
      assert(regConfType === 'password', 'Confirmação de senha alternou para password (oculto)');
    }

    // Voltar para o Login
    const loginLink = await page.waitForSelector('button[aria-label="Ir para login"]');
    await loginLink.click();
    await new Promise(r => setTimeout(r, 600));

    // -------------------------------------------------------------
    // ETAPA 3: Fazer login e navegar para o Dashboard
    // -------------------------------------------------------------
    console.log('\n📍 3. Realizando login e acessando o Dashboard...');
    await page.evaluate(() => {
      const emailInput = document.querySelector('#email');
      const senhaInput = document.querySelector('#senha');
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;

      setter.call(emailInput, 'cliente@nexuscontrol.com');
      emailInput.dispatchEvent(new Event('input', { bubbles: true }));
      emailInput.dispatchEvent(new Event('change', { bubbles: true }));

      setter.call(senhaInput, '123456#');
      senhaInput.dispatchEvent(new Event('input', { bubbles: true }));
      senhaInput.dispatchEvent(new Event('change', { bubbles: true }));
    });

    await page.$eval('.auth-submit-btn', el => el.click());

    await page.waitForFunction(() => window.location.pathname.includes('/dashboard'), { timeout: 15000 });
    assert(page.url().includes('/dashboard'), `Redirecionado com sucesso para ${page.url()}`);

    await page.waitForSelector('h1', { timeout: 10000 });
    const dashboardTitle = await page.$eval('h1', el => el.textContent.trim());
    assert(dashboardTitle.length > 0, `Dashboard carregado (Título: "${dashboardTitle}")`);

    // -------------------------------------------------------------
    // ETAPA 4: Navegar para o Catálogo (/itens)
    // -------------------------------------------------------------
    console.log('\n📍 4. Navegando para o Catálogo (/itens)...');
    await page.$eval('nav a[href="/itens"]', el => el.click());
    await page.waitForFunction(() => window.location.pathname === '/itens', { timeout: 10000 });
    assert(page.url().includes('/itens'), `Navegou para o Catálogo: ${page.url()}`);
    await new Promise(r => setTimeout(r, 1000));

    // -------------------------------------------------------------
    // ETAPA 5: Navegar para o Carrinho (/carrinho)
    // -------------------------------------------------------------
    console.log('\n📍 5. Navegando para o Carrinho (/carrinho)...');
    await page.waitForSelector('nav a[href="/carrinho"]', { timeout: 10000 });
    const navLinks = await page.$$eval('nav a', els => els.map(e => ({ href: e.getAttribute('href'), text: e.textContent.trim() })));
    console.log('  Nav links detectados:', JSON.stringify(navLinks));
    await page.$eval('nav a[href="/carrinho"]', el => el.click());
    await page.waitForFunction(() => window.location.pathname === '/carrinho', { timeout: 10000 });
    assert(page.url().includes('/carrinho'), `Navegou para o Carrinho: ${page.url()}`);
    await new Promise(r => setTimeout(r, 1000));

    // -------------------------------------------------------------
    // ETAPA 6: Navegar para o Perfil (/perfil)
    // -------------------------------------------------------------
    console.log('\n📍 6. Navegando para o Perfil (/perfil)...');
    await page.$eval('button[aria-label="Meu perfil"]', el => el.click());
    await page.waitForFunction(() => window.location.pathname === '/perfil', { timeout: 10000 });
    assert(page.url().includes('/perfil'), `Navegou para Meu Perfil: ${page.url()}`);

    // Verificar abas do perfil
    await page.waitForSelector('nav[aria-label="Abas do perfil"] button', { timeout: 10000 });
    const tabs = await page.$$eval('nav[aria-label="Abas do perfil"] button', buttons =>
      buttons.map(b => b.textContent.trim())
    );
    assert(
      tabs.some(t => t.includes('Dados') || t.includes('Informações')) &&
      tabs.some(t => t.includes('Segurança')) &&
      tabs.some(t => t.includes('Histórico')),
      `Todas as 3 abas estão presentes: [${tabs.join(', ')}]`
    );

    // -------------------------------------------------------------
    // ETAPA 7: Testar Aba Segurança e os 3 Toggles de Senha
    // -------------------------------------------------------------
    console.log('\n📍 7. Testando Aba Segurança e os 3 campos de senha com toggle...');
    // Clicar na aba Segurança
    await page.evaluate(() => {
      const btns = document.querySelectorAll('nav[aria-label="Abas do perfil"] button');
      if (btns[1]) btns[1].click();
    });
    await new Promise(r => setTimeout(r, 500));

    // Verificar inputs
    await page.waitForSelector('#senha_atual');
    await page.waitForSelector('#nova_senha');
    await page.waitForSelector('#confirmar_nova_senha');

    await page.type('#senha_atual', '123456#');
    await page.type('#nova_senha', '98765@');
    await page.type('#confirmar_nova_senha', '98765@');

    // Verificar estado inicial dos 3 inputs (todos password)
    let t1 = await page.$eval('#senha_atual', el => el.getAttribute('type'));
    let t2 = await page.$eval('#nova_senha', el => el.getAttribute('type'));
    let t3 = await page.$eval('#confirmar_nova_senha', el => el.getAttribute('type'));
    assert(t1 === 'password' && t2 === 'password' && t3 === 'password', 'Todos os 3 campos iniciam como tipo password');

    // Testar toggle 1: Senha atual
    await page.$eval('button[aria-label="Mostrar senha atual"]', el => el.click());
    await page.waitForFunction(() => document.querySelector('#senha_atual')?.getAttribute('type') === 'text', { timeout: 3000 });
    t1 = await page.$eval('#senha_atual', el => el.getAttribute('type'));
    assert(t1 === 'text', 'Senha atual alternou para text (visível)');
    await page.$eval('button[aria-label="Ocultar senha atual"]', el => el.click());
    await page.waitForFunction(() => document.querySelector('#senha_atual')?.getAttribute('type') === 'password', { timeout: 3000 });
    t1 = await page.$eval('#senha_atual', el => el.getAttribute('type'));
    assert(t1 === 'password', 'Senha atual alternou para password (oculto)');

    // Testar toggle 2: Nova senha
    await page.$eval('button[aria-label="Mostrar nova senha"]', el => el.click());
    await page.waitForFunction(() => document.querySelector('#nova_senha')?.getAttribute('type') === 'text', { timeout: 3000 });
    t2 = await page.$eval('#nova_senha', el => el.getAttribute('type'));
    assert(t2 === 'text', 'Nova senha alternou para text (visível)');
    await page.$eval('button[aria-label="Ocultar nova senha"]', el => el.click());
    await page.waitForFunction(() => document.querySelector('#nova_senha')?.getAttribute('type') === 'password', { timeout: 3000 });
    t2 = await page.$eval('#nova_senha', el => el.getAttribute('type'));
    assert(t2 === 'password', 'Nova senha alternou para password (oculto)');

    // Testar toggle 3: Confirmar nova senha
    await page.$eval('button[aria-label="Mostrar confirmação de senha"]', el => el.click());
    await page.waitForFunction(() => document.querySelector('#confirmar_nova_senha')?.getAttribute('type') === 'text', { timeout: 3000 });
    t3 = await page.$eval('#confirmar_nova_senha', el => el.getAttribute('type'));
    assert(t3 === 'text', 'Confirmar nova senha alternou para text (visível)');
    await page.$eval('button[aria-label="Ocultar confirmação de senha"]', el => el.click());
    await page.waitForFunction(() => document.querySelector('#confirmar_nova_senha')?.getAttribute('type') === 'password', { timeout: 3000 });
    t3 = await page.$eval('#confirmar_nova_senha', el => el.getAttribute('type'));
    assert(t3 === 'password', 'Confirmar nova senha alternou para password (oculto)');

    // -------------------------------------------------------------
    // ETAPA 8: Testar Aba Histórico de Compras
    // -------------------------------------------------------------
    console.log('\n📍 8. Testando Aba Histórico de Compras...');
    await page.evaluate(() => {
      const btns = document.querySelectorAll('nav[aria-label="Abas do perfil"] button');
      if (btns[2]) btns[2].click();
    });
    await new Promise(r => setTimeout(r, 800));

    // -------------------------------------------------------------
    // ETAPA 9: Testar Acesso Administrativo (/usuarios e /admin)
    // -------------------------------------------------------------
    console.log('\n📍 9. Realizando logout e logando como Administrador...');
    await page.$eval('button[aria-label="Sair do sistema"]', el => el.click());
    await new Promise(r => setTimeout(r, 500));

    // Confirmar saída no modal
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const confirmBtn = buttons.find(b => b.textContent.includes('Sim, sair'));
      if (confirmBtn) confirmBtn.click();
    });

    await page.waitForFunction(() => window.location.pathname === '/' || window.location.pathname === '/login', { timeout: 10000 });
    assert(page.url().includes('/') || page.url().includes('/login'), 'Logout realizado com sucesso');

    await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle0' });
    await page.waitForSelector('#email');

    const adminPwd = process.env.ROOT_ADMIN_PASSWORD || '26481#';
    await page.evaluate((pwd) => {
      const emailInput = document.querySelector('#email');
      const senhaInput = document.querySelector('#senha');
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;

      setter.call(emailInput, 'marcelo10@gmail.com');
      emailInput.dispatchEvent(new Event('input', { bubbles: true }));
      emailInput.dispatchEvent(new Event('change', { bubbles: true }));

      setter.call(senhaInput, pwd);
      senhaInput.dispatchEvent(new Event('input', { bubbles: true }));
      senhaInput.dispatchEvent(new Event('change', { bubbles: true }));
    }, adminPwd);

    const typedEmail = await page.$eval('#email', el => el.value);
    const typedSenha = await page.$eval('#senha', el => el.value);
    console.log(`  Submetendo admin: "${typedEmail}" com senha len ${typedSenha.length}`);

    await page.$eval('.auth-submit-btn', el => el.click());
    try {
      await page.waitForFunction(() => window.location.pathname.includes('/dashboard'), { timeout: 15000 });
    } catch (e) {
      const formErrors = await page.$$eval('.auth-error, [role="alert"]', els => els.map(el => el.textContent.trim()));
      console.error('  Erros exibidos na tela de login:', formErrors);
      throw e;
    }
    assert(page.url().includes('/dashboard'), 'Admin logado com sucesso no Dashboard');

    console.log('📍 10. Navegando para Gestão de Usuários (/usuarios)...');
    await page.waitForSelector('nav a[href="/usuarios"]', { timeout: 10000 });
    await page.$eval('nav a[href="/usuarios"]', el => el.click());
    await page.waitForFunction(() => window.location.pathname === '/usuarios', { timeout: 10000 });
    assert(page.url().includes('/usuarios'), 'Navegou para /usuarios com sucesso');

    console.log('📍 11. Navegando para Central de Controle (/admin)...');
    await page.waitForSelector('nav a[href="/admin"]', { timeout: 10000 });
    await page.$eval('nav a[href="/admin"]', el => el.click());
    await page.waitForFunction(() => window.location.pathname === '/admin', { timeout: 10000 });
    assert(page.url().includes('/admin'), 'Navegou para /admin com sucesso');

    // Verificar abas da Central de Controle Admin
    await page.waitForSelector('nav button', { timeout: 10000 });
    const adminTabs = await page.$$eval('nav button', btns => btns.map(b => b.textContent.trim()).filter(Boolean));
    console.log('  Abas do Admin encontradas:', adminTabs.join(', '));
    assert(!adminTabs.includes('Currículo') && !adminTabs.includes('Quem Somos'), 'Currículo e Quem Somos não constam no Admin');

    console.log('\n🎉 TODOS OS TESTES DE NAVEGAÇÃO (CLIENTE E ADMIN) FORAM CONCLUÍDOS COM SUCESSO!');
    await browser.close();
    process.exit(0);
  } catch (err) {
    console.error('\n❌ Erro durante o teste de navegação:', err);
    if (errors.length > 0) {
      console.error('Erros de console/página coletados:', errors);
    }
    await browser.close();
    process.exit(1);
  }
}

testNavigation();
