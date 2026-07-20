import { DecisionEvent, HumanDecisionData, PropuestaLexIA } from './ApprovalContracts.js';
import * as crypto from 'crypto';

export class ReviewSession {
    constructor(
        public readonly documentId: string,
        public readonly userId: string,
        public readonly propuesta: PropuestaLexIA,
        public readonly pastEvents: DecisionEvent[] = []
    ) {}

    // Pure functions returning new Events

    public approve(): DecisionEvent {
        this.verifyNotAlreadyApproved();
        
        return this.createEvent({
            expedienteId: this.propuesta.expedienteId,
            consecutivo: this.propuesta.consecutivo,
            accion: 'APROBAR',
            observaciones: ''
        });
    }

    public reject(reason: string): DecisionEvent {
        this.verifyNotAlreadyApproved();
        if (!reason || reason.trim() === '') {
            throw new Error('OBSERVACION_REQUERIDA');
        }

        return this.createEvent({
            expedienteId: this.propuesta.expedienteId,
            consecutivo: this.propuesta.consecutivo,
            accion: 'RECHAZAR',
            observaciones: reason
        });
    }

    public modify(changes: { expedienteId?: string, consecutivo?: number }, reason: string): DecisionEvent {
        this.verifyNotAlreadyApproved();
        if (!reason || reason.trim() === '') {
            throw new Error('OBSERVACION_REQUERIDA');
        }

        return this.createEvent({
            expedienteId: changes.expedienteId || this.propuesta.expedienteId,
            consecutivo: changes.consecutivo || this.propuesta.consecutivo,
            accion: 'MODIFICAR',
            observaciones: reason
        });
    }

    public postpone(): DecisionEvent {
        this.verifyNotAlreadyApproved();
        return this.createEvent({
            expedienteId: this.propuesta.expedienteId,
            consecutivo: this.propuesta.consecutivo,
            accion: 'POSPONER',
            observaciones: ''
        });
    }

    private verifyNotAlreadyApproved() {
        const hasApproval = this.pastEvents.some(e => e.decisionFuncionario.accion === 'APROBAR');
        if (hasApproval) {
            throw new Error('DOCUMENTO_YA_APROBADO');
        }
    }

    private createEvent(decisionData: HumanDecisionData): DecisionEvent {
        const eventId = crypto.randomUUID();
        const timestamp = new Date().toISOString();

        const baseEvent = {
            eventId,
            documentId: this.documentId,
            timestamp,
            userId: this.userId,
            propuestaLexia: this.propuesta,
            decisionFuncionario: decisionData
        };

        const hash = crypto.createHash('sha256').update(JSON.stringify(baseEvent)).digest('hex');

        return {
            ...baseEvent,
            hash
        };
    }
}
