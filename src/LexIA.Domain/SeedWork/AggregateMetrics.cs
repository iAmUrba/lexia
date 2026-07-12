using System;

namespace LexIA.Domain.SeedWork;

public record AggregateMetrics
{
    public long CurrentVersion { get; init; }
    public int EventCount { get; init; }
    public TimeSpan ReplayDuration { get; init; }
    public TimeSpan? SnapshotAge { get; init; }
    public long? SnapshotVersion { get; init; }
}
