using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using LexIA.Domain.Cases;
using LexIA.Application.Persistence;
using LexIA.Domain.SeedWork;

namespace LexIA.Application.Cases;

public class OpenCaseCommandHandler
{
    private readonly IEventStore _eventStore;

    public OpenCaseCommandHandler(IEventStore eventStore)
    {
        _eventStore = eventStore;
    }

    public async Task HandleAsync(OpenCaseCommand command, CancellationToken cancellationToken = default)
    {
        var caseAggregateId = new AggregateId(command.CaseId);
        
        var history = await _eventStore.ReadStreamAsync(caseAggregateId, cancellationToken);
        var aggregate = new CaseAggregate(command.CaseId);
        
        if (history.Any())
        {
            aggregate.LoadFromHistory(history);
        }

        aggregate.Open(command.Id.ToString(), command.CaseId);

        var events = aggregate.GetUncommittedEvents();
        
        if (events.Any())
        {
            await _eventStore.AppendToStreamAsync(caseAggregateId, aggregate.Version.Value - events.Count, events, cancellationToken);
            aggregate.ClearUncommittedEvents();
        }
    }
}
