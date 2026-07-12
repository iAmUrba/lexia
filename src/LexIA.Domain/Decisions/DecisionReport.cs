namespace LexIA.Domain.Decisions;

public sealed record DecisionReport(
    DecisionOutcome Outcome,
    DecisionNarrative Narrative
);
