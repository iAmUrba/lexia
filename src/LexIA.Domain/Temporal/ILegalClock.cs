using System;

namespace LexIA.Domain.Temporal;

public interface ILegalClock
{
    DateTimeOffset Now { get; }
    DateTimeOffset Today { get; }
}

public sealed class SystemLegalClock : ILegalClock
{
    public DateTimeOffset Now => LexIA.Domain.SeedWork.RuntimeEnvironment.Clock.UtcNow;
    public DateTimeOffset Today => LexIA.Domain.SeedWork.RuntimeEnvironment.Clock.UtcNow.Date;
}
