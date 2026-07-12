using System;
using LexIA.Domain.SeedWork;
using LexIA.Domain.Proceedings.ValueObjects;

namespace LexIA.Domain.Proceedings;

public sealed record ProceedingCorrected(Guid ProceedingId, string Reason, ProceedingDate CorrectedAt) : IDomainEvent;
