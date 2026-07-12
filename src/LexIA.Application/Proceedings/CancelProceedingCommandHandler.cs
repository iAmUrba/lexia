using System.Threading;
using System.Threading.Tasks;
using LexIA.Application.Messaging;
using LexIA.Application.Persistence;
using LexIA.Domain.Proceedings;
using LexIA.Domain.SeedWork;

namespace LexIA.Application.Proceedings;

public sealed class CancelProceedingCommandHandler : ICommandHandler<CancelProceedingCommand>
{
    private readonly IEventStore _eventStore;
    private readonly IProceedingProjectionDispatcher _projectionDispatcher;

    public CancelProceedingCommandHandler(IEventStore eventStore, IProceedingProjectionDispatcher projectionDispatcher)
    {
        _eventStore = eventStore;
        _projectionDispatcher = projectionDispatcher;
    }

    public async Task HandleAsync(CancelProceedingCommand command, CancellationToken cancellationToken = default)
    {
        var caseAggregateId = new AggregateId(command.CaseId);
        var history = await _eventStore.ReadStreamAsync(caseAggregateId, cancellationToken);
        
        if (!history.Any())
            throw new InvalidOperationException($"Expediente {command.CaseId} no encontrado.");

        var aggregate = new LexIA.Domain.Cases.CaseAggregate(command.CaseId);
        aggregate.LoadFromHistory(history);

        aggregate.CancelProceeding(
            command.Id.ToString(),
            command.ProceedingId,
            command.Reason,
            command.CancelledAt);

        var events = aggregate.GetUncommittedEvents();
        
        await _eventStore.AppendToStreamAsync(caseAggregateId, aggregate.Version.Value - events.Count, events, cancellationToken);
        aggregate.ClearUncommittedEvents();

        // Dispatch synchronous projection
        foreach (var uncommitted in events)
        {
            if (uncommitted.Event is ProceedingCancelled e)
            {
                await _projectionDispatcher.DispatchCancelledAsync(e, cancellationToken);
            }
        }
    }
}
