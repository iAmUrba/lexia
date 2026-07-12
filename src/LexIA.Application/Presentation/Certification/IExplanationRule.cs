using System.Collections.Generic;
using LexIA.Domain.Decisions;

namespace LexIA.Application.Presentation.Certification;

public interface IExplanationRule
{
    string RuleId { get; }
    IEnumerable<ExplanationViolation> Evaluate(DecisionArtifact artifact, IReadOnlyList<ExplanationClaim> claims, string rawResponse);
}
