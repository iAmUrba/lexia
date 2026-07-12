using System.Collections.Generic;

namespace LexIA.Domain.Interpretation;

public interface IEventInterpreter<in TEvent, out TEffect>
    where TEffect : ITemporalEffect
{
    bool CanInterpret(TEvent domainEvent);
    IReadOnlyList<TEffect> Interpret(TEvent domainEvent, InterpreterContext context);
}
