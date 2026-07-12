using System;

namespace LexIA.Domain.Documents;

public readonly record struct DocumentId(Guid Value)
{
    public static DocumentId New() => new(LexIA.Domain.SeedWork.RuntimeEnvironment.IdGenerator.NewGuid());
    public static DocumentId Empty => new(Guid.Empty);
}
