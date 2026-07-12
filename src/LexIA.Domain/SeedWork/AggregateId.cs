using System;

namespace LexIA.Domain.SeedWork;

public readonly record struct AggregateId(string Value)
{
    public static AggregateId New() => new(LexIA.Domain.SeedWork.RuntimeEnvironment.IdGenerator.NewGuid().ToString());
    public static implicit operator string(AggregateId id) => id.Value;
    public static implicit operator AggregateId(string value) => new(value);
}
