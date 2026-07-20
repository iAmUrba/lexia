import fs from 'fs';
import path from 'path';

async function test() {
  const authFile = path.join(process.cwd(), 'src/lexia-os/packages/server/.data/.auth_state.json');
  if (!fs.existsSync(authFile)) {
    console.log('No auth file');
    return;
  }
  const cookies = JSON.parse(fs.readFileSync(authFile, 'utf-8'));
  
  const headers = {
    'Cookie': `FedAuth=${cookies.fedAuth}; rtFa=${cookies.rtFa}`,
    'Accept': 'application/json'
  };

  console.log('Testing GET /_api/v2.0/me/drive/root');
  const res = await fetch('https://etbcsj-my.sharepoint.com/_api/v2.0/me/drive/root', { headers });
  console.log('Status:', res.status);
  const text = await res.text();
  console.log('Body:', text);
}

test();
