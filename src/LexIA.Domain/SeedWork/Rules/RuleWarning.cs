namespace LexIA.Domain.SeedWork.Rules;

public sealed record RuleWarning(string Code, string Message, LegalBasis? Basis = null);
