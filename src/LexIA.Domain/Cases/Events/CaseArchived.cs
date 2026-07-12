using LexIA.Domain.SeedWork;

namespace LexIA.Domain.Cases.Events;

public sealed record CaseArchived(string CaseId) : IDomainEvent;
