using System;
using LexIA.Domain.SeedWork;

namespace LexIA.Domain.Temporal;

public abstract record TemporalEvent(
    Guid EventId,
    string CaseId,
    DateTimeOffset Timestamp
) : ITimelineEvent;

public sealed record NotificationServed(
    Guid EventId,
    string CaseId,
    DateTimeOffset Timestamp,
    Guid ProceedingId
) : TemporalEvent(EventId, CaseId, Timestamp);

public sealed record TermSuspended(
    Guid EventId,
    string CaseId,
    DateTimeOffset Timestamp,
    string Reason
) : TemporalEvent(EventId, CaseId, Timestamp);

public sealed record TermResumed(
    Guid EventId,
    string CaseId,
    DateTimeOffset Timestamp
) : TemporalEvent(EventId, CaseId, Timestamp);
