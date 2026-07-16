import express from 'express';
import cors from 'cors';
import path from 'path';
import { exec } from 'child_process';
import { CaseInspector } from '../../packages/application/glosador/inspector.js';
import { GlosadorSimulator } from '../../packages/application/glosador/simulator.js';
import * as fs from 'fs';

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(process.cwd(), 'src/lexia-os/apps/launcher/public')));

// Endpoint para abrir el selector de carpetas
app.get('/api/select-folder', (req, res) => {
  const psScript = `
    Add-Type -AssemblyName System.Windows.Forms
    $f = New-Object System.Windows.Forms.FolderBrowserDialog
    $f.Description = 'Selecciona la carpeta para analizar con LexIA'
    $f.ShowNewFolderButton = $false
    if($f.ShowDialog() -eq 'OK') { Write-Host $f.SelectedPath }
  `;

  exec(`powershell -command "${psScript}"`, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error opening folder picker: ${error}`);
      return res.status(500).json({ error: 'Failed to open folder picker' });
    }
    const selectedPath = stdout.trim();
    res.json({ path: selectedPath });
  });
});

// Endpoint para inspeccionar expediente
app.post('/api/inspect-case', async (req, res) => {
  const { folderPath } = req.body;
  if (!folderPath) {
    return res.status(400).json({ error: 'Falta folderPath' });
  }

  try {
    const inspector = new CaseInspector();
    const result = await inspector.inspect(folderPath);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Endpoint para inspeccionar bandeja
app.post('/api/inspect-inbox', async (req, res) => {
  const { folderPath } = req.body;
  if (!folderPath) {
    return res.status(400).json({ error: 'Falta folderPath' });
  }

  try {
    let total = 0, fiscalia = 0, defensa = 0, despachos = 0, desconocidos = 0;

    const walk = (dir: string) => {
      const items = fs.readdirSync(dir);
      for (const item of items) {
        const fullPath = path.join(dir, item);
        if (fs.statSync(fullPath).isDirectory()) {
          walk(fullPath);
        } else if (item.toLowerCase().endsWith('.pdf')) {
          total++;
          const name = item.toLowerCase();
          if (name.includes('fiscal') || name.includes('acusacion') || name.includes('fgn')) fiscalia++;
          else if (name.includes('defens') || name.includes('poder') || name.includes('abogado')) defensa++;
          else if (name.includes('juzgado') || name.includes('despacho') || name.includes('auto')) despachos++;
          else desconocidos++;
        }
      }
    };
    walk(folderPath);

    res.json({
      total,
      fiscalia,
      defensa,
      despachos,
      desconocidos
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Endpoint para el Simulador de Glosado
app.post('/api/simulate', async (req, res) => {
  const { inboxPath, casesRootPath } = req.body;
  if (!inboxPath || !casesRootPath) {
    return res.status(400).json({ error: 'Falta inboxPath o casesRootPath' });
  }

  try {
    const simulator = new GlosadorSimulator();
    // 1. Construir índice en memoria
    await simulator.buildIndex(casesRootPath);
    // 2. Simular bandeja
    const results = await simulator.simulate(inboxPath);
    res.json(results);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Endpoint para guardar auditoría
app.post('/api/audit-decision', (req, res) => {
  const { pdfName, decision, match, alternatives } = req.body;
  const auditPath = path.join(process.cwd(), 'auditoria_lexia.json');
  
  let auditData = [];
  if (fs.existsSync(auditPath)) {
    try {
      auditData = JSON.parse(fs.readFileSync(auditPath, 'utf8'));
    } catch(e) {}
  }
  
  auditData.push({
    timestamp: new Date().toISOString(),
    pdfName,
    decision,
    match,
    alternatives
  });
  
  fs.writeFileSync(auditPath, JSON.stringify(auditData, null, 2));
  res.json({ success: true });
});

app.listen(PORT, () => {
  console.log(`[LexIA] Servidor de UI iniciado en http://localhost:${PORT}`);
});
