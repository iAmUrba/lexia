using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using LexIA.Application.Messaging;
using LexIA.Application.Persistence;
using LexIA.Domain.Proceedings;
using LexIA.Domain.Proceedings.Kinds;
using LexIA.Domain.SeedWork;
using LexIA.Domain.LegalRules;
using LexIA.Domain.LegalRules.Contexts;

namespace LexIA.Application.Proceedings;

public sealed class RegisterProceedingCommandHandler : ICommandHandler<RegisterProceedingCommand>
{
    private readonly IEventStore _eventStore;
    private readonly IProceedingProjectionDispatcher _projectionDispatcher;
    private readonly LexIA.Application.Proceedings.RuleSets.IRuleSetProvider<ProceedingRegistrationContext> _ruleSetProvider;

    public RegisterProceedingCommandHandler(
        IEventStore eventStore, 
        IProceedingProjectionDispatcher projectionDispatcher,
        LexIA.Application.Proceedings.RuleSets.IRuleSetProvider<ProceedingRegistrationContext> ruleSetProvider)
    {
        _eventStore = eventStore;
        _projectionDispatcher = projectionDispatcher;
        _ruleSetProvider = ruleSetProvider;
    }

    public async Task HandleAsync(RegisterProceedingCommand command, CancellationToken cancellationToken = default)
    {
        var caseOpening = new LexIA.Domain.Proceedings.ValueObjects.CaseOpeningDate(command.CaseOpenedAt);
        var proceedingDate = new LexIA.Domain.Proceedings.ValueObjects.ProceedingDate(command.Date, caseOpening);
        var caseAggregateId = new AggregateId(command.CaseId);
        
        var history = await _eventStore.ReadStreamAsync(caseAggregateId, cancellationToken);
        var aggregate = new LexIA.Domain.Cases.CaseAggregate(command.CaseId);
        
        if (history.Any())
        {
            aggregate.LoadFromHistory(history);
        }

        var kind = ProceedingKind.FromCode(command.Type);
        var context = new ProceedingRegistrationContext(
            aggregate.CreateSnapshot().State,
            command.ProceedingId,
            kind,
            proceedingDate.Value
        );

        var rules = _ruleSetProvider.Resolve(aggregate.ProcedureType);
        var ruleEngine = new RuleEngine<ProceedingRegistrationContext>(rules);
        var ruleResult = ruleEngine.Evaluate(context);

        if (!ruleResult.IsValid)
        {
            // Abortar si hay fallas legales funcionales
            var violation = ruleResult.Violations.First();
            throw new InvalidOperationException($"Legal Rule Validation Failed: {violation.Message}");
        }

        aggregate.RegisterProceeding(
            command.Id.ToString(), // CommandId as RequestId
            command.ProceedingId,
            command.Type,
            proceedingDate);

        var events = aggregate.GetUncommittedEvents();
        
        await _eventStore.AppendToStreamAsync(caseAggregateId, aggregate.Version.Value - events.Count, events, cancellationToken);
        aggregate.ClearUncommittedEvents();

        // Dispatch synchronous projection
        foreach (var uncommitted in events)
        {
            if (uncommitted.Event is LexIA.Domain.Proceedings.ProceedingRegistered e)
            {
                await _projectionDispatcher.DispatchRegisteredAsync(e, cancellationToken);
            }
        }
    }
}
