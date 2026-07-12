using System;

namespace LexIA.Domain.SeedWork;

public sealed record EventMetadata(
    EventId Id,
    AggregateId AggregateId,
    AggregateVersion Version,
    DateTimeOffset OccurredOn,
    int SchemaVersion = 1);
