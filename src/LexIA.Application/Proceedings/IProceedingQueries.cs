using System;
using System.Threading;
using System.Threading.Tasks;

namespace LexIA.Application.Proceedings;

public interface IProceedingQueries
{
    Task<ProceedingView?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
}
