import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

async function test() {
  const authFile = path.join(process.cwd(), 'src/lexia-os/packages/server/.data/.auth_state.json');
  const cookies = JSON.parse(fs.readFileSync(authFile, 'utf-8'));

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  
  // Inject cookies
  await context.addCookies([
    {
      name: 'FedAuth',
      value: cookies.fedAuth,
      domain: 'etbcsj-my.sharepoint.com',
      path: '/',
      secure: true,
      httpOnly: true
    },
    {
      name: 'rtFa',
      value: cookies.rtFa,
      domain: 'etbcsj-my.sharepoint.com',
      path: '/',
      secure: true,
      httpOnly: true
    }
  ]);

  const page = await context.newPage();
  
  const foundTokens = new Set<string>();

  page.on('request', req => {
    const auth = req.headers()['authorization'];
    if (auth && auth.toLowerCase().startsWith('bearer ')) {
      const token = auth.substring(7);
      const url = req.url();
      console.log(`Found Bearer token for URL: ${url}`);
      foundTokens.add(token);
    }
  });

  console.log('Navigating to SharePoint...');
  await page.goto('https://etbcsj-my.sharepoint.com/');
  
  console.log('Waiting 10 seconds for SP to load and make Graph requests...');
  await page.waitForTimeout(10000);
  
  console.log(`Extracted ${foundTokens.size} distinct Bearer tokens.`);
  
  if (foundTokens.size > 0) {
    // Just test the first token with Graph API
    const token = Array.from(foundTokens)[0];
    console.log('Testing token with Graph API...');
    const res = await fetch('https://graph.microsoft.com/v1.0/me/drive/root', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    console.log('Graph API Status:', res.status);
    if (res.ok) {
      console.log('SUCCESS! We can use this token for Graph API!');
    } else {
      console.log('Failed:', await res.text());
    }
  }

  await browser.close();
}

test();
