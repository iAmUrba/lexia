using System;

namespace LexIA.Domain.SeedWork;

public static class RuntimeEnvironment
{
    public static IClock Clock { get; private set; } = new SystemClock();
    public static IIdGenerator IdGenerator { get; private set; } = new GuidIdGenerator();

    public static void Initialize(IClock clock, IIdGenerator idGenerator)
    {
        Clock = clock ?? throw new ArgumentNullException(nameof(clock));
        IdGenerator = idGenerator ?? throw new ArgumentNullException(nameof(idGenerator));
    }
}
