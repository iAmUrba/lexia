using System.Collections.Generic;
using System.Linq;
using LexIA.Domain.Decisions;

namespace LexIA.Application.Presentation.Certification;

public sealed class RequiredDisclosureRule : IExplanationRule
{
    public string RuleId => "EXPL.DISCLOSE.001";

    public IEnumerable<ExplanationViolation> Evaluate(DecisionArtifact artifact, IReadOnlyList<ExplanationClaim> claims, string rawResponse)
    {
        // For a LawyerProfile, we might require LegalBasis and Timeline.
        // For MVP we just assert that at least one outcome is mentioned.
        var hasOutcome = claims.OfType<OutcomeClaim>().Any();
        
        if (!hasOutcome)
        {
            yield return new ExplanationViolation(
                RuleId: RuleId,
                ErrorCode: "MissingRequiredDisclosure",
                Severity: ViolationSeverity.Warning,
                Description: "La explicación no menciona claramente el resultado (Outcome) de la decisión."
            );
        }
    }
}
