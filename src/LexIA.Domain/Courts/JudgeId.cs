using System;

namespace LexIA.Domain.Courts;

public readonly record struct JudgeId(Guid Value)
{
    public static JudgeId New() => new(LexIA.Domain.SeedWork.RuntimeEnvironment.IdGenerator.NewGuid());
    public static JudgeId Empty => new(Guid.Empty);
}
