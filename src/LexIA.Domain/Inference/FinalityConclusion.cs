using System;
using LexIA.Domain.Temporal;

namespace LexIA.Domain.Inference;

public sealed record FinalityConclusion(
    string DerivationId,
    bool IsFinal,
    string? LegalBasis,
    DateTimeOffset? EffectiveDate,
    LexIA.Domain.SeedWork.IEvidence Evidence,
    TemporalTrace? Trace
) : LegalConclusion(
    DerivationId: DerivationId,
    ConclusionCode: "LEX.TEMP.FINAL",
    LegalBasis: LegalBasis,
    EffectiveDate: EffectiveDate,
    Evidence: Evidence,
    Trace: Trace
);
