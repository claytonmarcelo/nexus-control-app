import puppeteer from 'puppeteer-core';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function test() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox']
  });

  const page = await browser.newPage();

  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('BROWSER CONSOLE ERROR:', msg.text());
    }
  });

  page.on('pageerror', err => {
    console.log('BROWSER PAGE ERROR:', err.message, err.stack);
  });

  console.log('Testando /dashboard sem auth:');
  await page.goto('http://localhost:5173/dashboard', { waitUntil: 'networkidle0' });
  console.log('URL final:', page.url());

  console.log('Testando /curriculo:');
  await page.goto('http://localhost:5173/curriculo', { waitUntil: 'networkidle0' });
  console.log('URL final:', page.url());

  await browser.close();
}

test().catch(console.error);
