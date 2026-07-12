using System.Collections.Generic;
using System.Linq;
using LexIA.Domain.Decisions;

namespace LexIA.Application.Presentation.Certification;

public sealed class TimelineConsistencyRule : IExplanationRule
{
    public string RuleId => "EXPL.TIMELINE.001";

    public IEnumerable<ExplanationViolation> Evaluate(DecisionArtifact artifact, IReadOnlyList<ExplanationClaim> claims, string rawResponse)
    {
        var artifactDates = artifact.Timeline.Nodes.Select(n => n.Date.Date).ToHashSet();
        var timelineClaims = claims.OfType<TimelineClaim>().ToList();

        foreach (var claim in timelineClaims)
        {
            if (!artifactDates.Contains(claim.Date.Date))
            {
                yield return new ExplanationViolation(
                    RuleId: RuleId,
                    ErrorCode: "TimelineHallucination",
                    Severity: ViolationSeverity.Critical,
                    Description: $"La explicación menciona la fecha '{claim.RawText}' ({claim.Date.Date:yyyy-MM-dd}) que no existe en el Timeline del DecisionArtifact."
                );
            }
        }
    }
}
