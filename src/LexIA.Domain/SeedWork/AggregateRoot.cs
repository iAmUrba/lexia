using System;
using System.Collections.Generic;

namespace LexIA.Domain.SeedWork;

public abstract class AggregateRoot
{
    private readonly List<(IDomainEvent Event, EventMetadata Metadata)> _uncommittedEvents = new();
    
    public AggregateId Id { get; protected set; }
    public AggregateVersion Version { get; protected set; } = AggregateVersion.Initial;

    public IReadOnlyList<(IDomainEvent Event, EventMetadata Metadata)> GetUncommittedEvents() => _uncommittedEvents.AsReadOnly();
    
    public void ClearUncommittedEvents() => _uncommittedEvents.Clear();

    public AggregateMetrics LoadFromHistory(IEnumerable<(IDomainEvent Event, EventMetadata Metadata)> history)
    {
        var stopWatch = System.Diagnostics.Stopwatch.StartNew();
        int count = 0;
        foreach (var (domainEvent, metadata) in history)
        {
            Apply(domainEvent);
            Version = metadata.Version;
            count++;
        }
        stopWatch.Stop();
        
        return new AggregateMetrics
        {
            CurrentVersion = Version.Value,
            EventCount = count,
            ReplayDuration = stopWatch.Elapsed,
            SnapshotAge = null, // Will be set if rehydrated from snapshot
            SnapshotVersion = null
        };
    }

    protected void ApplyChange(IDomainEvent @event)
    {
        Apply(@event);
        Version = Version.Next();
        var metadata = new EventMetadata(EventId.New(), Id, Version, LexIA.Domain.SeedWork.RuntimeEnvironment.Clock.UtcNow);
        _uncommittedEvents.Add((@event, metadata));
    }

    protected abstract void Apply(IDomainEvent @event);
}
