using LexIA.Domain.SeedWork;

namespace LexIA.Domain.Cases.Events;

public sealed record CaseReopened(string CaseId, string Reason) : IDomainEvent;
