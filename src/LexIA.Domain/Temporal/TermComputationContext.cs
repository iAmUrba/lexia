namespace LexIA.Domain.Temporal;

public sealed record TermComputationContext(
    Timeline Timeline,
    ProceduralTerm Term,
    ILegalClock Clock,
    CalculationPolicy Policy
);
