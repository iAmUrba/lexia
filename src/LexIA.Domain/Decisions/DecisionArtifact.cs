using System.Collections.Generic;
using LexIA.Domain.SeedWork;

namespace LexIA.Domain.Decisions;

public sealed record DecisionArtifact(
    DecisionReport Report,
    IEvidence EvidenceTree,
    PresentationTimeline Timeline,
    IReadOnlyList<string> LegalReferences, // Or specialized LegalBasis class
    IReadOnlyList<LexIA.Domain.SeedWork.Rules.RuleEvaluation> EvaluatedRules,
    IReadOnlyList<LexIA.Domain.Inference.LegalConclusion> LegalConclusions,
    DecisionMetadata Metadata
);
