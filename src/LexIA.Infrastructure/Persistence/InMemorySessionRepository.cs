using System.Collections.Concurrent;
using System.Threading.Tasks;
using LexIA.Application.Analysis;

namespace LexIA.Infrastructure.Persistence;

public sealed class InMemorySessionRepository : IAnalysisSessionRepository
{
    private readonly ConcurrentDictionary<string, AnalysisSession> _sessions = new();
    private readonly ConcurrentDictionary<string, AnalysisResult> _results = new();

    public Task<AnalysisSession?> GetByIdAsync(string sessionId)
    {
        _sessions.TryGetValue(sessionId, out var session);
        return Task.FromResult(session);
    }

    public Task SaveAsync(AnalysisSession session)
    {
        lock (_sessions)
        {
            if (_sessions.TryGetValue(session.SessionId, out var existing))
            {
                if (existing.Version != session.Version)
                {
                    throw new System.InvalidOperationException("Concurrency conflict");
                }
            }
            session.Version++;
            _sessions[session.SessionId] = session;
        }
        return Task.CompletedTask;
    }

    public Task SaveResultAsync(AnalysisResult result)
    {
        _results[result.AnalysisId] = result;
        return Task.CompletedTask;
    }

    public Task<AnalysisResult?> GetResultAsync(string analysisId)
    {
        _results.TryGetValue(analysisId, out var result);
        return Task.FromResult(result);
    }
}
