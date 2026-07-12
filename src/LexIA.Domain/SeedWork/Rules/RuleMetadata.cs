using System;
using System.Collections.Generic;

namespace LexIA.Domain.SeedWork.Rules;

public sealed record RuleMetadata
{
    public string? Jurisdiction { get; init; }
    public string? ProcedureType { get; init; }
    public string? Version { get; init; }
    public DateTimeOffset? EffectiveFrom { get; init; }
    public DateTimeOffset? EffectiveTo { get; init; }
    public RulePriority Priority { get; init; } = RulePriority.Normal;
    public IReadOnlyCollection<string> Tags { get; init; } = Array.Empty<string>();
}
