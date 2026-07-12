namespace LexIA.Domain.Temporal;

public enum TermNature
{
    Peremptory,
    Directory,
    Suspensive
}

public enum TermUnit
{
    Days,
    Months,
    Years,
    Hours
}

public sealed record ProceduralTerm(
    int Length,
    TermUnit Unit,
    TermNature Nature
);
