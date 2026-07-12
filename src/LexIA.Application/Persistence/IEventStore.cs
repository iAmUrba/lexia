using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using LexIA.Domain.SeedWork;

namespace LexIA.Application.Persistence;

public interface IEventStore
{
    Task AppendToStreamAsync(AggregateId aggregateId, long expectedVersion, IEnumerable<(IDomainEvent Event, EventMetadata Metadata)> events, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<(IDomainEvent Event, EventMetadata Metadata)>> ReadStreamAsync(AggregateId aggregateId, CancellationToken cancellationToken = default);
}
