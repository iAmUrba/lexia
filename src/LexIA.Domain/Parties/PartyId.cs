using System;

namespace LexIA.Domain.Parties;

public readonly record struct PartyId(Guid Value)
{
    public static PartyId New() => new(LexIA.Domain.SeedWork.RuntimeEnvironment.IdGenerator.NewGuid());
    public static PartyId Empty => new(Guid.Empty);
}
