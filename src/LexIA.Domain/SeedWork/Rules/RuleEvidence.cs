using System.Collections.Generic;

namespace LexIA.Domain.SeedWork.Rules;

public sealed record RuleEvidence(
    string Code,
    string Description,
    IReadOnlyList<IEvidence> SupportingEvidence
) : IEvidence;
