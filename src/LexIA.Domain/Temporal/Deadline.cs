using System;

namespace LexIA.Domain.Temporal;

public enum DeadlineStatus
{
    Pending,
    Expired,
    Fulfilled,
    Suspended
}

public sealed record Deadline(
    DateTimeOffset CalculatedDate,
    DeadlineStatus Status
);
