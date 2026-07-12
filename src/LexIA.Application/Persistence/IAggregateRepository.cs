using System.Threading;
using System.Threading.Tasks;
using LexIA.Domain.SeedWork;

namespace LexIA.Application.Persistence;

public interface IAggregateRepository<TAggregate> where TAggregate : AggregateRoot, new()
{
    Task<TAggregate> GetAsync(AggregateId id, CancellationToken cancellationToken = default);
    Task SaveAsync(TAggregate aggregate, CancellationToken cancellationToken = default);
}
