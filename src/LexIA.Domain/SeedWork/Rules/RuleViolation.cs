namespace LexIA.Domain.SeedWork.Rules;

public sealed record RuleViolation(string Code, string Message, LegalBasis? Basis = null);
