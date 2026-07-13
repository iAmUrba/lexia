import { DocumentIntakeService } from '../src/lexia-os/packages/application/services/documentIntake/DocumentIntakeService.js';
import { EventBus } from '../src/lexia-os/packages/foundation/events/index.js';
import { AuditRecord, AuditSink, Actor } from '../src/lexia-os/packages/foundation/contracts/index.js';

class ConsoleAuditSink implements AuditSink {
  async record(audit: AuditRecord): Promise<void> {
    console.log('\n=== AUDIT RECORD CREATED ===');
    console.log(JSON.stringify(audit, null, 2));
    console.log('============================\n');
  }
}

// Suscribirnos al evento para ver que se emite correctamente
EventBus.subscribe('DocumentIngested', async (event) => {
  console.log('\n=== EVENT INGESTED FIRED ===');
  console.log(JSON.stringify(event, null, 2));
  console.log('============================\n');
});

async function main() {
  const auditSink = new ConsoleAuditSink();
  const service = new DocumentIntakeService(auditSink);

  const testActor: Actor = {
    type: 'System',
    identifier: 'CLI_Test_Runner'
  };

  const buffer = Buffer.from('Contenido de prueba para el documento 123');

  console.log('Iniciando Document Intake con Contratos...');
  const result = await service.process({
    buffer,
    mimeType: 'text/plain',
    originalName: 'prueba.txt',
    source: 'CLI',
    actor: testActor
  });

  if (result.ok) {
    console.log('\n=== RECEIPT RETURNED ===');
    console.log(JSON.stringify(result.value, null, 2));
    console.log('========================\n');
  } else {
    console.error('Fallo en el pipeline:', result.error);
  }
}

main().catch(console.error);
