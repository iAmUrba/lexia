namespace LexIA.Domain.SeedWork.Rules;

public sealed record RuleEvaluation(
    string RuleId,
    string RuleName,
    RuleOutcome Outcome,
    LegalBasis? Basis = null,
    string? Explanation = null,
    LexIA.Domain.SeedWork.IEvidence? Evidence = null
);
