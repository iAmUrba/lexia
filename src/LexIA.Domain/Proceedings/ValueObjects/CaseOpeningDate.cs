using System;

namespace LexIA.Domain.Proceedings.ValueObjects;

public readonly record struct CaseOpeningDate
{
    public DateTimeOffset Value { get; }

    public CaseOpeningDate(DateTimeOffset value)
    {
        Value = value;
    }
}
