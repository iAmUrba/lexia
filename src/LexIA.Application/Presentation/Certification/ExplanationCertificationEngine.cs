using System.Collections.Generic;
using System.Linq;
using LexIA.Domain.Decisions;

namespace LexIA.Application.Presentation.Certification;

public sealed class ExplanationCertificationEngine
{
    private readonly ClaimExtractor _extractor;
    private readonly IReadOnlyList<IExplanationRule> _rules;

    public ExplanationCertificationEngine(ClaimExtractor extractor, IEnumerable<IExplanationRule> rules)
    {
        _extractor = extractor;
        _rules = rules.ToList();
    }

    public CertificationResult Certify(DecisionArtifact artifact, string rawResponse)
    {
        var claims = _extractor.ExtractClaims(rawResponse);
        var violations = new List<ExplanationViolation>();

        foreach (var rule in _rules)
        {
            violations.AddRange(rule.Evaluate(artifact, claims, rawResponse));
        }

        var isCritical = violations.Any(v => v.Severity == ViolationSeverity.Critical);
        var hasWarnings = violations.Any(v => v.Severity != ViolationSeverity.Critical);

        CertificationStatus status;
        if (isCritical) status = CertificationStatus.Rejected;
        else if (hasWarnings) status = CertificationStatus.CertifiedWithWarnings;
        else status = CertificationStatus.Certified;

        return new CertificationResult(
            Status: status,
            HasCriticalViolations: isCritical,
            Violations: violations
        );
    }
}

public enum CertificationStatus
{
    Certified,
    CertifiedWithWarnings,
    Rejected
}

public sealed record CertificationResult(
    CertificationStatus Status,
    bool HasCriticalViolations,
    IReadOnlyList<ExplanationViolation> Violations
);
