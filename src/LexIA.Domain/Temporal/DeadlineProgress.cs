namespace LexIA.Domain.Temporal;

public sealed record DeadlineProgress(
    int Remaining,
    TermUnit Unit
)
{
    public bool IsComplete => Remaining <= 0;

    public DeadlineProgress Decrement()
    {
        if (IsComplete) return this;
        return this with { Remaining = Remaining - 1 };
    }
}
