import { GlosadorSimulator } from './src/lexia-os/packages/application/glosador/simulator.js';
import * as path from 'path';

async function run() {
  const sim = new GlosadorSimulator();
  const baseDir = path.join(process.cwd(), 'src', 'lexia-os', 'test', 'simulator_data');
  
  await sim.buildIndex(path.join(baseDir, 'cases'));
  const results = await sim.simulate(path.join(baseDir, 'inbox'));
  
  console.log(JSON.stringify(results, null, 2));
}

run();
