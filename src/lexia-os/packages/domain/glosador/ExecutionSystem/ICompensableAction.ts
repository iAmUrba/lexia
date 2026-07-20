import { ExecutionOperation } from './Contracts/ExecutionContracts.js';

export interface ICompensableAction<T extends ExecutionOperation> {
    execute(op: T): Promise<void>;
    compensate(op: T): Promise<void>;
}
