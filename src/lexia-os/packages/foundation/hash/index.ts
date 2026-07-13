import { createHash } from 'crypto';
import { Clock } from '../clock/index.js';
import { FileFingerprint } from '../contracts/index.js';

export const Hash = {
  /**
   * Genera el fingerprint SHA-256 de un buffer.
   */
  sha256(buffer: Buffer): FileFingerprint {
    const digest = createHash('sha256').update(buffer).digest('hex');
    
    return Object.freeze({
      algorithm: 'sha256',
      value: digest,
      createdAt: Clock.timestamp()
    });
  }
};
