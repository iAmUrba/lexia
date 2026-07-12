using System;
using LexIA.Domain.Cases;
using LexIA.Domain.Proceedings.Kinds;

namespace LexIA.Domain.LegalRules.Contexts;

public sealed record ProceedingRegistrationContext(
    CaseState State,
    Guid ProceedingId,
    ProceedingKind Kind,
    DateTimeOffset Date
);
