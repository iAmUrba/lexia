using System;

namespace LexIA.Application.Proceedings;

// Vista inmutable optimizada para lectura (CQRS)
public sealed record ProceedingView(
    Guid Id,
    string CaseId,
    string Type,
    DateTimeOffset Date,
    string Status);
