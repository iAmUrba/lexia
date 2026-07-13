import { ConfidenceScore } from '../../../../../../domain/document/index.js';

export interface RuleDefinition {
  readonly id: string;
  readonly description: string;
  readonly regex: RegExp;
  readonly confidence: ConfidenceScore;
}

export interface RuleMatch {
  readonly rule: RuleDefinition;
  readonly value: string;
  readonly offset: number;
  readonly length: number;
  readonly groups?: Record<string, string>;
}

export const executeRule = (text: string, rule: RuleDefinition): RuleMatch[] => {
  const matches: RuleMatch[] = [];
  const regex = new RegExp(rule.regex, rule.regex.flags.includes('g') ? rule.regex.flags : rule.regex.flags + 'g');
  
  let match: RegExpExecArray | null;
  while ((match = regex.exec(text)) !== null) {
    matches.push({
      rule,
      value: match[0],
      offset: match.index,
      length: match[0].length,
      groups: match.groups
    });
  }
  
  return matches;
};
