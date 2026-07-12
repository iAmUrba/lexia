using System;

namespace LexIA.Domain.SeedWork;

public readonly record struct EventId(Guid Value)
{
    public static EventId New() => new(LexIA.Domain.SeedWork.RuntimeEnvironment.IdGenerator.NewGuid());
}
