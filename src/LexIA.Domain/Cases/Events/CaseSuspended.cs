using LexIA.Domain.SeedWork;

namespace LexIA.Domain.Cases.Events;

public sealed record CaseSuspended(string CaseId, string Reason) : IDomainEvent;
