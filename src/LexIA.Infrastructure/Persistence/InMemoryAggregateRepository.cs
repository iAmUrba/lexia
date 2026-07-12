using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using LexIA.Application.Persistence;
using LexIA.Domain.SeedWork;

namespace LexIA.Infrastructure.Persistence;

public sealed class InMemoryAggregateRepository<T> : IAggregateRepository<T> where T : AggregateRoot, new()
{
    private readonly IEventStore _eventStore;

    public InMemoryAggregateRepository(IEventStore eventStore)
    {
        _eventStore = eventStore;
    }

    public async Task<T> GetAsync(AggregateId id, CancellationToken cancellationToken = default)
    {
        var events = await _eventStore.ReadStreamAsync(id, cancellationToken);
        if (events.Count == 0) return null!;

        var aggregate = new T();
        aggregate.LoadFromHistory(events);
        return aggregate;
    }

    public async Task SaveAsync(T aggregate, CancellationToken cancellationToken = default)
    {
        var changes = aggregate.GetUncommittedEvents().ToList();
        if (changes.Count == 0) return;

        var baseVersion = aggregate.Version.Value - changes.Count;
        
        await _eventStore.AppendToStreamAsync(aggregate.Id, baseVersion == 0 ? -1 : baseVersion, changes, cancellationToken);
        aggregate.ClearUncommittedEvents();
    }
}
