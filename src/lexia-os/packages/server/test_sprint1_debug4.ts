import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function debug() {
  const authPath = path.join(__dirname, '.data', '.auth_state.json');
  const authState = JSON.parse(fs.readFileSync(authPath, 'utf8'));
  const token = authState.accessToken;
  const folderId = '01OVTUMPOX7NQLFEDTNRFY5QI2DEJ3J4OL';
  
  const res = await fetch(`https://graph.microsoft.com/v1.0/me/drive/items/${folderId}/children`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  console.log(await res.json());
}
debug();
