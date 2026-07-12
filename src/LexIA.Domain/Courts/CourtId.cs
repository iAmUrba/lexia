using System;

namespace LexIA.Domain.Courts;

public readonly record struct CourtId(Guid Value)
{
    public static CourtId New() => new(LexIA.Domain.SeedWork.RuntimeEnvironment.IdGenerator.NewGuid());
    public static CourtId Empty => new(Guid.Empty);
}
