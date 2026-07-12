using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using LexIA.Application.Persistence;
using LexIA.Domain.SeedWork;

namespace LexIA.Infrastructure.Persistence;

public sealed class InMemoryEventStore : IEventStore
{
    private readonly ConcurrentDictionary<string, List<(IDomainEvent Event, EventMetadata Metadata)>> _streams = new();

    public Task AppendToStreamAsync(AggregateId aggregateId, long expectedVersion, IEnumerable<(IDomainEvent Event, EventMetadata Metadata)> events, CancellationToken cancellationToken = default)
    {
        var stream = _streams.GetOrAdd(aggregateId.Value, _ => new List<(IDomainEvent, EventMetadata)>());
        
        lock (stream)
        {
            if (expectedVersion != -1 && stream.Count > 0 && stream.Count != expectedVersion)
            {
                throw new System.InvalidOperationException($"Concurrency Exception on {aggregateId.Value}");
            }

            stream.AddRange(events);
        }

        return Task.CompletedTask;
    }

    public Task<IReadOnlyList<(IDomainEvent Event, EventMetadata Metadata)>> ReadStreamAsync(AggregateId aggregateId, CancellationToken cancellationToken = default)
    {
        if (_streams.TryGetValue(aggregateId.Value, out var stream))
        {
            lock (stream)
            {
                return Task.FromResult<IReadOnlyList<(IDomainEvent, EventMetadata)>>(stream.ToList());
            }
        }

        return Task.FromResult<IReadOnlyList<(IDomainEvent, EventMetadata)>>(System.Array.Empty<(IDomainEvent, EventMetadata)>());
    }
}
