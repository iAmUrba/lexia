using System.Collections.Generic;
using System.Linq;
using LexIA.Domain.Decisions;

namespace LexIA.Application.Presentation.Certification;

public sealed class LegalBasisConsistencyRule : IExplanationRule
{
    public string RuleId => "EXPL.LEGAL.001";

    public IEnumerable<ExplanationViolation> Evaluate(DecisionArtifact artifact, IReadOnlyList<ExplanationClaim> claims, string rawResponse)
    {
        // Simple logic for MVP: artifact legal references should contain the article number
        var legalRefs = string.Join(" ", artifact.LegalReferences).ToLowerInvariant();
        var legalClaims = claims.OfType<LegalBasisClaim>().ToList();

        foreach (var claim in legalClaims)
        {
            if (!legalRefs.Contains(claim.Article.ToLowerInvariant()))
            {
                yield return new ExplanationViolation(
                    RuleId: RuleId,
                    ErrorCode: "LegalBasisHallucination",
                    Severity: ViolationSeverity.Critical,
                    Description: $"La explicación menciona un artículo o base legal ('{claim.RawText}') que no se encuentra en las referencias del DecisionArtifact."
                );
            }
        }
    }
}
