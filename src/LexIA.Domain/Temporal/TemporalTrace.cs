using System;
using System.Collections.Generic;

namespace LexIA.Domain.Temporal;

public sealed record TemporalTrace(
    IReadOnlyList<TraceStep> Steps
) : LexIA.Domain.SeedWork.IEvidence
{
    public string Code => "TEMP.TRACE";
    public string Description => "Trace of temporal evaluation steps.";
    public IReadOnlyList<LexIA.Domain.SeedWork.IEvidence> SupportingEvidence => System.Array.Empty<LexIA.Domain.SeedWork.IEvidence>();
}
