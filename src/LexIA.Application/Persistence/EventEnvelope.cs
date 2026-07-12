using System;

namespace LexIA.Application.Persistence;

public sealed record EventEnvelope(
    Guid EventId,
    string AggregateId,
    long Version,
    string EventType,
    string Payload,
    string Metadata,
    DateTimeOffset OccurredOn
);
