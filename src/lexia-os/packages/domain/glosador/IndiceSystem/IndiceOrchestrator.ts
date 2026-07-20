import { IndiceLocator } from './IndiceLocator.js';
import { IndiceReader } from './IndiceReader.js';
import { IndiceValidator } from './IndiceValidator.js';
import { ConsecutivoResolver } from './ConsecutivoResolver.js';
import { ConsecutivoProposal } from './contracts.js';

export interface IndiceResult {
    estado: 'EXITO' | 'ERROR_INDICE';
    reason?: string;
    propuesta?: ConsecutivoProposal;
    telemetry: {
        locateMs: number;
        readMs: number;
        validateMs: number;
        resolveMs: number;
        totalMs: number;
    };
}

export class IndiceOrchestrator {
    constructor(
        private locator: IndiceLocator,
        private reader: IndiceReader,
        private validator: IndiceValidator,
        private resolver: ConsecutivoResolver
    ) {}

    public async processExpediente(rutaExpediente: string): Promise<IndiceResult> {
        const startTotal = performance.now();
        let locateMs = 0, readMs = 0, validateMs = 0, resolveMs = 0;

        try {
            // 1. Locate
            const startLocate = performance.now();
            const location = await this.locator.locate(rutaExpediente);
            locateMs = performance.now() - startLocate;

            if (location.error) {
                return this.buildErrorResult(location.error, locateMs, readMs, validateMs, resolveMs, startTotal);
            }

            // 2. Read
            const startRead = performance.now();
            let data;
            try {
                data = await this.reader.read(location.ruta);
            } catch (error: any) {
                readMs = performance.now() - startRead;
                if (error.message.includes('password') || error.message.includes('protect')) {
                     return this.buildErrorResult('INDICE_PROTEGIDO', locateMs, readMs, validateMs, resolveMs, startTotal);
                }
                return this.buildErrorResult('INDICE_CORRUPTO', locateMs, readMs, validateMs, resolveMs, startTotal);
            }
            readMs = performance.now() - startRead;

            if (data.estructura.hasProtection) {
                return this.buildErrorResult('INDICE_PROTEGIDO', locateMs, readMs, validateMs, resolveMs, startTotal);
            }

            // 3. Validate
            const startValidate = performance.now();
            const warnings = this.validator.validate(data);
            validateMs = performance.now() - startValidate;

            // We can decide if any warning is a hard error that stops the process.
            // For now, FORMULA_INVALIDA is a hard error per DoD.
            if (warnings.includes('FORMULA_INVALIDA')) {
                return this.buildErrorResult('FORMULA_INVALIDA', locateMs, readMs, validateMs, resolveMs, startTotal);
            }

            // 4. Resolve
            const startResolve = performance.now();
            const propuesta = this.resolver.resolve(data, warnings);
            resolveMs = performance.now() - startResolve;

            return {
                estado: 'EXITO',
                propuesta,
                telemetry: {
                    locateMs: Math.round(locateMs),
                    readMs: Math.round(readMs),
                    validateMs: Math.round(validateMs),
                    resolveMs: Math.round(resolveMs),
                    totalMs: Math.round(performance.now() - startTotal)
                }
            };
        } catch (e: any) {
            // Recovery fallback
            return this.buildErrorResult('ERROR_INTERNO', locateMs, readMs, validateMs, resolveMs, startTotal);
        }
    }

    private buildErrorResult(reason: string, locateMs: number, readMs: number, validateMs: number, resolveMs: number, startTotal: number): IndiceResult {
        return {
            estado: 'ERROR_INDICE',
            reason,
            telemetry: {
                locateMs: Math.round(locateMs),
                readMs: Math.round(readMs),
                validateMs: Math.round(validateMs),
                resolveMs: Math.round(resolveMs),
                totalMs: Math.round(performance.now() - startTotal)
            }
        };
    }
}
