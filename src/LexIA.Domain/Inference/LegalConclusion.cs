using System;
using LexIA.Domain.Temporal;

namespace LexIA.Domain.Inference;

public abstract record LegalConclusion(
    string DerivationId,
    string ConclusionCode,
    string? LegalBasis,
    DateTimeOffset? EffectiveDate,
    LexIA.Domain.SeedWork.IEvidence Evidence,
    TemporalTrace? Trace
);
