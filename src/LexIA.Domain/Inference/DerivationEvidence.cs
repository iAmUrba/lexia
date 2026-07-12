using System.Collections.Generic;
using LexIA.Domain.SeedWork;

namespace LexIA.Domain.Inference;

public sealed record DerivationEvidence(
    string Code,
    string Description,
    IReadOnlyList<IEvidence> SupportingEvidence
) : IEvidence;
