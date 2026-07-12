using System.Collections.Concurrent;
using System.Threading;
using System.Threading.Tasks;

namespace LexIA.Application.Persistence;

public class InMemorySnapshotStore<TSnapshot> : ISnapshotStore<TSnapshot> where TSnapshot : class
{
    private readonly ConcurrentDictionary<string, TSnapshot> _snapshots = new();

    public Task SaveSnapshotAsync(string aggregateId, TSnapshot snapshot, CancellationToken cancellationToken = default)
    {
        _snapshots[aggregateId] = snapshot;
        return Task.CompletedTask;
    }

    public Task<TSnapshot?> GetLatestSnapshotAsync(string aggregateId, CancellationToken cancellationToken = default)
    {
        _snapshots.TryGetValue(aggregateId, out var snapshot);
        return Task.FromResult(snapshot);
    }
}
