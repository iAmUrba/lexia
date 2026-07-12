using System;

namespace LexIA.Domain.Interpretation;

public interface ITemporalEffect
{
    Guid EffectId { get; }
    string CaseId { get; }
    DateTimeOffset Timestamp { get; }
    string Description { get; }
}

public sealed record StartTermEffect(
    Guid EffectId,
    string CaseId,
    DateTimeOffset Timestamp,
    Guid OriginatingEventId,
    string Description
) : ITemporalEffect;

public sealed record OpenAppealWindowEffect(
    Guid EffectId,
    string CaseId,
    DateTimeOffset Timestamp,
    Guid OriginatingEventId,
    string Description
) : ITemporalEffect;

public sealed record SuspendDeadlineEffect(
    Guid EffectId,
    string CaseId,
    DateTimeOffset Timestamp,
    string Reason,
    string Description
) : ITemporalEffect;

public sealed record ResumeDeadlineEffect(
    Guid EffectId,
    string CaseId,
    DateTimeOffset Timestamp,
    string Description
) : ITemporalEffect;
