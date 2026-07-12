using System;

namespace LexIA.Api.Models;

public record CreateSessionRequest(
    string CaseId,
    string? ProfileId
);

public record AppendEventRequest(
    string ProceedingId,
    string CaseId,
    string Type,
    DateTime Date
);
