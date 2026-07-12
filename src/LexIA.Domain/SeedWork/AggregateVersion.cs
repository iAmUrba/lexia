namespace LexIA.Domain.SeedWork;

public readonly record struct AggregateVersion(long Value)
{
    public static AggregateVersion Initial => new(0);
    public AggregateVersion Next() => new(Value + 1);
}
