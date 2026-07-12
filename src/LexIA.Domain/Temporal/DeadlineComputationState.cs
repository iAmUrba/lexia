using System;
using System.Collections.Generic;

namespace LexIA.Domain.Temporal;

public sealed record DeadlineComputationState(
    DateTimeOffset Cursor,
    DeadlineProgress Progress,
    Timeline Timeline,
    CalculationPolicy Policy,
    IReadOnlyList<TraceStep> Trace
)
{
    public DeadlineComputationState WithTrace(TraceStep step)
    {
        var newTrace = new List<TraceStep>(Trace) { step };
        return this with { Trace = newTrace.AsReadOnly() };
    }
}
