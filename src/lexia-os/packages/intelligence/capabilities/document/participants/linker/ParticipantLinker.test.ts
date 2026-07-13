import test from 'node:test';
import assert from 'node:assert';
import { ParticipantLinker } from './ParticipantLinker.js';
import { LinkingStrategy } from './strategies/LinkingStrategy.js';
import { ParticipantCandidate, ParticipantLink } from '@lexia/domain';

// Estrategia exacta mock
class ExactNameStrategy implements LinkingStrategy {
  id = 'exact-name';
  priority = 100;

  link(candidates: ParticipantCandidate[]): ParticipantLink[] {
    const links: ParticipantLink[] = [];
    const grouped = new Map<string, ParticipantCandidate[]>();

    // Agrupar por nombre exacto normalizado
    for (const c of candidates) {
      if (!c.normalizedName) continue;
      const key = c.normalizedName.toLowerCase();
      const list = grouped.get(key) || [];
      list.push(c);
      grouped.set(key, list);
    }

    // Enlazar los que coinciden exactamente (simulado)
    let pId = 1;
    for (const [name, list] of grouped.entries()) {
      if (list.length > 0) {
        const participantId = `P-${pId++}`;
        for (const c of list) {
          // Si el estado ya era CONFLICT, lo ignoramos para la prueba
          if (c.resolutionState === 'CONFLICT') continue;
          
          for (const m of c.mentions) {
            links.push({
              mentionId: m.id,
              participantId,
              confidence: 100,
              strategy: 'EXACT_NAME'
            });
          }
        }
      }
    }
    return links;
  }
}

function createDummyCandidate(id: string, name: string): ParticipantCandidate {
  return {
    id,
    normalizedName: name,
    aliases: [],
    mentions: [
      { id: `m-${id}`, rawText: name, kind: 'PERSON', detectionKind: 'UNKNOWN', evidence: { extractor: 'test', rule: 'test', offset: 0, length: name.length, confidence: { score: 100, confidence: 'high' } } }
    ],
    confidence: { score: 100, confidence: 'high' },
    resolutionState: 'UNRESOLVED'
  };
}

test('ParticipantLinker - Pruebas Positivas y Negativas', () => {
  const linker = new ParticipantLinker([new ExactNameStrategy()]);

  const candidates = [
    createDummyCandidate('c1', 'Juan Pérez'),
    createDummyCandidate('c2', 'Juan Pérez Gómez'), // Apellido distinto, no debe enlazar
    createDummyCandidate('c3', 'Fiscal Pérez'), // No enlaza por nombre exacto
    createDummyCandidate('c4', 'Juan Pérez') // Sí enlaza con c1
  ];

  const links = linker.link(candidates);

  // c1 y c4 se unen en P-1
  const juanPerezLinks = links.filter(l => l.mentionId === 'm-c1' || l.mentionId === 'm-c4');
  assert.strictEqual(juanPerezLinks.length, 2, 'Juan Pérez y Juan Pérez deben enlazarse');
  assert.strictEqual(juanPerezLinks[0].participantId, juanPerezLinks[1].participantId, 'Deben compartir el mismo participantId');

  // c2 (Juan Pérez Gómez) no se une con c1
  const juanPerezGomezLink = links.find(l => l.mentionId === 'm-c2');
  assert.notStrictEqual(juanPerezGomezLink?.participantId, juanPerezLinks[0].participantId, 'Juan Pérez Gómez no debe unirse con Juan Pérez');
  
  // c3 (Fiscal Pérez) no se une con c1
  const fiscalPerezLink = links.find(l => l.mentionId === 'm-c3');
  assert.notStrictEqual(fiscalPerezLink?.participantId, juanPerezLinks[0].participantId, 'Fiscal Pérez no debe unirse con Juan Pérez');
});
