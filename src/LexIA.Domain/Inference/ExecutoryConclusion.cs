using System;
using LexIA.Domain.Temporal;

namespace LexIA.Domain.Inference;

public sealed record ExecutoryConclusion(
    string DerivationId,
    bool IsExecutory,
    string? LegalBasis,
    DateTimeOffset? EffectiveDate,
    LexIA.Domain.SeedWork.IEvidence Evidence,
    TemporalTrace? Trace
) : LegalConclusion(
    DerivationId: DerivationId,
    ConclusionCode: "LEX.TEMP.EXEC",
    LegalBasis: LegalBasis,
    EffectiveDate: EffectiveDate,
    Evidence: Evidence,
    Trace: Trace
);
