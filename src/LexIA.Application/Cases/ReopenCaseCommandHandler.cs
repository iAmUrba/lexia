using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using LexIA.Domain.Cases;
using LexIA.Domain.Cases.Policies;
using LexIA.Application.Persistence;
using LexIA.Domain.SeedWork;

namespace LexIA.Application.Cases;

public class ReopenCaseCommandHandler
{
    private readonly IEventStore _eventStore;
    private readonly IReopeningPolicy _reopeningPolicy;

    public ReopenCaseCommandHandler(IEventStore eventStore, IReopeningPolicy reopeningPolicy)
    {
        _eventStore = eventStore;
        _reopeningPolicy = reopeningPolicy;
    }

    public async Task HandleAsync(ReopenCaseCommand command, CancellationToken cancellationToken = default)
    {
        var caseAggregateId = new AggregateId(command.CaseId);
        
        var history = await _eventStore.ReadStreamAsync(caseAggregateId, cancellationToken);
        var aggregate = new CaseAggregate(command.CaseId);
        
        if (history.Any())
        {
            aggregate.LoadFromHistory(history);
        }

        aggregate.Reopen(command.Id.ToString(), command.Reason, _reopeningPolicy);

        var events = aggregate.GetUncommittedEvents();
        
        if (events.Any())
        {
            await _eventStore.AppendToStreamAsync(caseAggregateId, aggregate.Version.Value - events.Count, events, cancellationToken);
            aggregate.ClearUncommittedEvents();
        }
    }
}
