using System;

namespace LexIA.Domain.Cases.Exceptions;

public class ChronologyViolationException : Exception
{
    public string CaseId { get; }
    public DateTimeOffset AttemptedDate { get; }
    public DateTimeOffset ConflictDate { get; }

    public ChronologyViolationException(string caseId, DateTimeOffset attemptedDate, DateTimeOffset conflictDate, string message) 
        : base(message)
    {
        CaseId = caseId;
        AttemptedDate = attemptedDate;
        ConflictDate = conflictDate;
    }
}
