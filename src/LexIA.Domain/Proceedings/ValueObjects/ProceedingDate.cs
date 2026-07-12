using System;
using LexIA.Domain.Proceedings.Exceptions;

namespace LexIA.Domain.Proceedings.ValueObjects;

public readonly record struct ProceedingDate
{
    public DateTimeOffset Value { get; }

    public ProceedingDate(DateTimeOffset value, CaseOpeningDate caseOpening)
    {
        if (value < caseOpening.Value)
        {
            throw new ProceedingDateBeforeCaseOpeningException(value, caseOpening.Value);
        }

        Value = value;
    }
    
    // Internal constructor for rebuilding from history where it's already valid
    [System.Text.Json.Serialization.JsonConstructor]
    internal ProceedingDate(DateTimeOffset value)
    {
        Value = value;
    }
}
