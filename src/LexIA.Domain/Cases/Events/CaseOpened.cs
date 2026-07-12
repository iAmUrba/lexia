using LexIA.Domain.SeedWork;

namespace LexIA.Domain.Cases.Events;

public sealed record CaseOpened(string CaseId) : IDomainEvent;
