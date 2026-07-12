using System.Collections.Generic;
using System.Linq;
using LexIA.Domain.Decisions;

namespace LexIA.Application.Presentation.Certification;

public sealed class ForbiddenClaimRule : IExplanationRule
{
    public string RuleId => "EXPL.FORBIDDEN.001";

    public IEnumerable<ExplanationViolation> Evaluate(DecisionArtifact artifact, IReadOnlyList<ExplanationClaim> claims, string rawResponse)
    {
        var forbiddenClaims = claims.OfType<ForbiddenClaim>().ToList();

        foreach (var claim in forbiddenClaims)
        {
            yield return new ExplanationViolation(
                RuleId: RuleId,
                ErrorCode: "ForbiddenProbabilisticLanguage",
                Severity: ViolationSeverity.Critical,
                Description: $"La explicación usa lenguaje probabilístico o prohibido ('{claim.RawText}'), lo cual vulnera la política de determinismo."
            );
        }
    }
}
