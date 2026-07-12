namespace LexIA.Domain.Temporal;

public sealed record DeadlineEvaluation(
    Deadline Deadline,
    TemporalTrace Trace,
    string Reasoning
);
