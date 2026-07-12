using System.Threading;
using System.Threading.Tasks;

namespace LexIA.Application.Persistence;

public interface ISnapshotStore<TSnapshot> where TSnapshot : class
{
    Task SaveSnapshotAsync(string aggregateId, TSnapshot snapshot, CancellationToken cancellationToken = default);
    Task<TSnapshot?> GetLatestSnapshotAsync(string aggregateId, CancellationToken cancellationToken = default);
}
