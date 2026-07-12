using System;
using System.Collections.Generic;
using System.Linq;
using LexIA.Domain.SeedWork;
using LexIA.Domain.SeedWork.Rules;
using LexIA.Domain.Temporal;
using LexIA.Domain.Inference;

namespace LexIA.Domain.Decisions;

public sealed class DecisionComposer
{
    public DecisionArtifact Compose(DecisionComposerContext context, DecisionMetadata metadata)
    {
        var outcome = DetermineOutcome(context);
        
        var evidenceTree = BuildEvidenceTree(context);
        
        var references = BuildLegalReferences(context);
        
        var timeline = BuildPresentationTimeline(context.DeadlineEvaluation?.Trace);

        var narrative = BuildNarrative(outcome, context);

        var report = new DecisionReport(outcome, narrative);

        return new DecisionArtifact(
            report,
            evidenceTree,
            timeline,
            references.ToList(),
            context.RuleEvaluations,
            context.LegalConclusions,
            metadata
        );
    }

    private DecisionOutcome DetermineOutcome(DecisionComposerContext context)
    {
        if (context.RuleEvaluations.Any(r => r.Outcome == RuleOutcome.Failed))
            return DecisionOutcome.Rejected;

        if (context.LegalConclusions.Any())
            return DecisionOutcome.Derived;

        return DecisionOutcome.Allowed;
    }

    private IEvidence BuildEvidenceTree(DecisionComposerContext context)
    {
        var supporting = new List<IEvidence>();

        foreach (var rule in context.RuleEvaluations)
        {
            if (rule.Evidence != null)
                supporting.Add(rule.Evidence);
        }

        if (context.DeadlineEvaluation?.Trace != null)
            supporting.Add(context.DeadlineEvaluation.Trace);

        foreach (var conc in context.LegalConclusions)
        {
            if (conc.Evidence != null)
                supporting.Add(conc.Evidence);
        }

        // Return a root node
        return new RootEvidence("DECISION.ROOT", "Canonical Decision Evidence Tree", supporting);
    }

    private IReadOnlyList<string> BuildLegalReferences(DecisionComposerContext context)
    {
        var refs = new HashSet<string>();

        foreach (var rule in context.RuleEvaluations)
        {
            if (rule.Basis != null)
                refs.Add(rule.Basis.ToString()!);
        }

        foreach (var conc in context.LegalConclusions)
        {
            if (!string.IsNullOrWhiteSpace(conc.LegalBasis))
                refs.Add(conc.LegalBasis);
        }

        return refs.ToList();
    }

    private PresentationTimeline BuildPresentationTimeline(TemporalTrace? trace)
    {
        if (trace == null)
            return new PresentationTimeline(Array.Empty<TimelineNode>());

        var nodes = trace.Steps.Select(s => new TimelineNode(
            s.AffectedDate,
            s.Reason, // Using reason as title for now
            $"Timeline adjusted because of {s.Reason}",
            "Icon",
            null
        )).ToList();

        return new PresentationTimeline(nodes);
    }

    private DecisionNarrative BuildNarrative(DecisionOutcome outcome, DecisionComposerContext context)
    {
        var summary = new List<NarrativeBlock>
        {
            new NarrativeBlock("Outcome", $"The decision outcome is {outcome}.")
        };

        var detail = new List<NarrativeBlock>
        {
            new NarrativeBlock("Rules", $"Evaluated {context.RuleEvaluations.Count} rules."),
            new NarrativeBlock("Inferences", $"Generated {context.LegalConclusions.Count} legal conclusions.")
        };

        return new DecisionNarrative(summary, detail);
    }
}

public sealed record RootEvidence(
    string Code,
    string Description,
    IReadOnlyList<IEvidence> SupportingEvidence
) : IEvidence;
