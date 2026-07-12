using System.Collections.Generic;
using System.Linq;
using LexIA.Domain.Decisions;

using LexIA.Domain.SeedWork;

namespace LexIA.Application.Presentation.Certification;

[Requirement("REQ-CIV-006")]
public sealed class OutcomeConsistencyRule : IExplanationRule
{
    public string RuleId => "EXPL.OUTCOME.001";

    public IEnumerable<ExplanationViolation> Evaluate(DecisionArtifact artifact, IReadOnlyList<ExplanationClaim> claims, string rawResponse)
    {
        var artifactOutcome = artifact.Report.Outcome.ToString();
        var outcomeClaims = claims.OfType<OutcomeClaim>().ToList();

        if (outcomeClaims.Count == 0)
        {
            // Possibly a warning if outcome is required, but RequiredDisclosureRule handles that.
            yield break;
        }

        foreach (var claim in outcomeClaims)
        {
            if (claim.NormalizedOutcome != artifactOutcome)
            {
                yield return new ExplanationViolation(
                    RuleId: RuleId,
                    ErrorCode: "OutcomeInconsistency",
                    Severity: ViolationSeverity.Critical,
                    Description: $"La explicación afirma un resultado ('{claim.RawText}' -> {claim.NormalizedOutcome}) que contradice el DecisionArtifact ({artifactOutcome})."
                );
            }
        }
    }
}
