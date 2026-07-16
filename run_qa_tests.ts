import { CaseInspector } from './src/lexia-os/packages/application/glosador/inspector.js';
import * as path from 'path';

async function runTests() {
  const inspector = new CaseInspector();
  const baseDir = path.join(process.cwd(), 'src', 'lexia-os', 'test', 'data');
  const cases = ['QA_Excel_Corrupto', 'QA_Carpeta_Vacia', 'QA_PDFs_Danados'];

  for (const c of cases) {
    console.log(`\n======================================`);
    console.log(`TEST: ${c}`);
    console.log(`======================================`);
    try {
      const result = await inspector.inspect(path.join(baseDir, c));
      console.log(JSON.stringify(result, null, 2));
    } catch (e: any) {
      console.error(`ERROR FATAL: ${e.message}`);
    }
  }
}

runTests();
