using System;
using LexIA.Domain.SeedWork;
using LexIA.Domain.Proceedings.ValueObjects;

namespace LexIA.Domain.Proceedings;

public sealed record ProceedingRegistered(Guid ProceedingId, string CaseId, string Type, ProceedingDate Date) : IDomainEvent;
