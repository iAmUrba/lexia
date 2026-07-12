using System;

namespace LexIA.Domain.Temporal;

public sealed record TraceStep(
    string StepId,
    string StepName,
    string Decision,
    string Reason,
    string? LegalBasis,
    DateTimeOffset AffectedDate
);
