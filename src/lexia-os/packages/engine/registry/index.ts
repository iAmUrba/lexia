import { CapabilityDescriptor } from '../contracts/index.js';
import { CapabilityId, Requirement } from '../types/index.js';

export class CapabilityRegistry {
  private descriptors: Map<string, CapabilityDescriptor<any, any>> = new Map();

  register<TInput, TOutput>(descriptor: CapabilityDescriptor<TInput, TOutput>): void {
    const idStr = descriptor.id.toString();
    if (this.descriptors.has(idStr)) {
      throw new Error(`Capability ya registrada: ${idStr}`);
    }
    this.descriptors.set(idStr, descriptor);
  }

  get<TInput, TOutput>(id: CapabilityId | string): CapabilityDescriptor<TInput, TOutput> {
    const idStr = typeof id === 'string' ? id : id.toString();
    const descriptor = this.descriptors.get(idStr);
    if (!descriptor) {
      throw new Error(`Capability no encontrada: ${idStr}`);
    }
    return descriptor as CapabilityDescriptor<TInput, TOutput>;
  }

  listCapabilities(): CapabilityId[] {
    return Array.from(this.descriptors.values()).map(d => d.id);
  }

  findByRequirement(req: Requirement): CapabilityDescriptor<any, any>[] {
    return Array.from(this.descriptors.values()).filter(d => 
      d.requirements.includes(req)
    );
  }

  findByPrefix(prefix: string): CapabilityDescriptor<any, any>[] {
    return Array.from(this.descriptors.values()).filter(d => 
      d.id.toString().startsWith(prefix)
    );
  }
}
