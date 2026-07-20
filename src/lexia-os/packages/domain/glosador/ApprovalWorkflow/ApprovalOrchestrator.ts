import { PropuestaLexIA, DecisionEvent, IDecisionRepository } from './ApprovalContracts.js';
import { ReviewSession } from './ReviewSession.js';

export class ApprovalOrchestrator {
    constructor(
        private readonly repository: IDecisionRepository
    ) {}

    public async openSession(documentId: string, userId: string, propuesta: PropuestaLexIA): Promise<ReviewSession> {
        // En un sistema real, cargaríamos eventos del Event Store para reconstruir el estado actual.
        const pastEvents = await this.repository.getEvents(documentId);
        
        return new ReviewSession(documentId, userId, propuesta, pastEvents);
    }
}
