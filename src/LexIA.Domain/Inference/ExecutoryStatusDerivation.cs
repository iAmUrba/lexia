using System;
using System.Collections.Generic;
using System.Linq;
using LexIA.Domain.Proceedings;

using LexIA.Domain.SeedWork;

namespace LexIA.Domain.Inference;

[Requirement("REQ-CIV-005")]
public sealed class ExecutoryStatusDerivation : ILegalDerivation<ProceduralTimeContext, ExecutoryConclusion>
{
    public string DerivationId => "INF.EXEC.001";

    public IReadOnlyList<ExecutoryConclusion> Derive(ProceduralTimeContext context)
    {
        // For the sake of the domain model, we just define a simple implementation.
        // A decision is executory if there's no suspensive appeal.
        
        bool hasSuspensiveAppeal = context.Proceedings
            .Any(p => p.Kind.IsAppeal()); // Simple heuristic for now

        bool isExecutory = !hasSuspensiveAppeal;
        
        // Ensure firmness >= executory (if it's firm, it should be executory)
        // Here we just define basic logic that can be tested in PBT.
        
        var evidenceDesc = isExecutory 
            ? "No suspensive appeals found." 
            : "Found suspensive appeal preventing execution.";

        var evidence = new DerivationEvidence("EXEC.DERIV", evidenceDesc, new List<LexIA.Domain.SeedWork.IEvidence>());

        var conclusion = new ExecutoryConclusion(
            DerivationId: DerivationId,
            IsExecutory: isExecutory,
            LegalBasis: "General Procedural Principle",
            EffectiveDate: context.Deadline?.Deadline.CalculatedDate ?? LexIA.Domain.SeedWork.RuntimeEnvironment.Clock.UtcNow,
            Evidence: evidence,
            Trace: context.Deadline?.Trace
        );

        return new List<ExecutoryConclusion> { conclusion };
    }
}
