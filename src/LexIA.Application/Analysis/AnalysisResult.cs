using System;
using LexIA.Domain.Decisions;
using LexIA.Application.Presentation.Certification;

namespace LexIA.Application.Analysis;

public sealed record AnalysisResult(
    string AnalysisId,
    string CorrelationId,
    DecisionArtifact Artifact,
    ExplanationResult Explanation,
    CertificationResult Certification
);

public sealed record ExplanationResult(
    ExplanationProfileDescriptor Profile,
    string Content
);

public sealed record ExplanationProfileDescriptor(
    string Id,
    string Name,
    string Locale,
    string Version
);
