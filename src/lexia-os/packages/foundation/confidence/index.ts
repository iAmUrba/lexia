import { ConfidenceScore, ConfidenceOrigin } from '../contracts/index.js';

export const Confidence = {
  create(score: number, origin: ConfidenceOrigin, explanation?: string): ConfidenceScore {
    if (score < 0 || score > 100) {
      throw new Error("Confidence score must be between 0 and 100");
    }
    return Object.freeze({
      score,
      origin,
      explanation
    });
  },

  exactMatch(explanation?: string): ConfidenceScore {
    return this.create(100, 'Regex', explanation);
  },
  
  deterministic(explanation?: string): ConfidenceScore {
    return this.create(100, 'Deterministic', explanation);
  },

  humanValidated(explanation?: string): ConfidenceScore {
    return this.create(100, 'Human', explanation);
  }
};
