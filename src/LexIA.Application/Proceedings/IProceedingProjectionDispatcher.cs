using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using LexIA.Domain.Proceedings;

namespace LexIA.Application.Proceedings;

public interface IProceedingProjectionDispatcher
{
    Task DispatchRegisteredAsync(ProceedingRegistered @event, CancellationToken cancellationToken = default);
    Task DispatchCancelledAsync(ProceedingCancelled @event, CancellationToken cancellationToken = default);
    Task DispatchCorrectedAsync(ProceedingCorrected @event, CancellationToken cancellationToken = default);
}
