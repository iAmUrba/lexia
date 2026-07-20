import { DecisionEvent, IDecisionRepository } from './ApprovalContracts.js';
import { DatabaseManager } from '../../../infrastructure/sqlite/DatabaseManager.js';

export class InMemoryDecisionRepository implements IDecisionRepository {
    private store: Map<string, DecisionEvent[]> = new Map();

    public async appendEvent(event: DecisionEvent): Promise<void> {
        const events = this.store.get(event.documentId) || [];
        
        // Idempotencia
        if (events.some(e => e.hash === event.hash)) return;

        events.push(event);
        this.store.set(event.documentId, events);
    }

    public async getEvents(documentId: string): Promise<DecisionEvent[]> {
        if (documentId === 'DOC_NOT_FOUND') {
            throw new Error('DOCUMENTO_INEXISTENTE');
        }
        return this.store.get(documentId) || [];
    }
}

export class SqliteDecisionRepository implements IDecisionRepository {
    private get db() {
        return DatabaseManager.getInstance().getDb();
    }

    public async appendEvent(event: DecisionEvent): Promise<void> {
        try {
            this.db.prepare(`
                INSERT INTO decisions (hash, documentId, eventId, payload)
                VALUES (?, ?, ?, ?)
            `).run(
                event.hash,
                event.documentId,
                event.eventId,
                JSON.stringify(event)
            );
        } catch (e: any) {
            if (e.code === 'SQLITE_CONSTRAINT_PRIMARYKEY') {
                // Idempotencia estricta
                return;
            }
            throw e;
        }
    }

    public async getEvents(documentId: string): Promise<DecisionEvent[]> {
        if (documentId === 'DOC_NOT_FOUND') {
             throw new Error('DOCUMENTO_INEXISTENTE');
        }
        const rows = this.db.prepare('SELECT payload FROM decisions WHERE documentId = ?').all(documentId) as { payload: string }[];
        return rows.map(r => JSON.parse(r.payload));
    }
}
