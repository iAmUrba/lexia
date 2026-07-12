using System;
using System.Collections.Generic;
using LexIA.Domain.Proceedings;
using LexIA.Domain.Proceedings.Kinds;

namespace LexIA.Domain.Interpretation;

public sealed class NotificationInterpreter : IEventInterpreter<ProceedingRegistered, ITemporalEffect>
{
    public bool CanInterpret(ProceedingRegistered domainEvent)
    {
        return ProceedingKind.FromCode(domainEvent.Type).IsNotification();
    }

    public IReadOnlyList<ITemporalEffect> Interpret(ProceedingRegistered domainEvent, InterpreterContext context)
    {
        if (!CanInterpret(domainEvent))
            return Array.Empty<ITemporalEffect>();

        var effects = new List<ITemporalEffect>
        {
            new StartTermEffect(
                LexIA.Domain.SeedWork.RuntimeEnvironment.IdGenerator.NewGuid(),
                context.CaseId,
                context.CurrentTime,
                domainEvent.ProceedingId,
                "Notification starts standard procedural term."
            ),
            new OpenAppealWindowEffect(
                LexIA.Domain.SeedWork.RuntimeEnvironment.IdGenerator.NewGuid(),
                context.CaseId,
                context.CurrentTime,
                domainEvent.ProceedingId,
                "Notification opens window for appeals."
            )
        };

        return effects;
    }
}
