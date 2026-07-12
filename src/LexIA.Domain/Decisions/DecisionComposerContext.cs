using System.Collections.Generic;
using LexIA.Domain.SeedWork.Rules;
using LexIA.Domain.Temporal;
using LexIA.Domain.Inference;

namespace LexIA.Domain.Decisions;

public sealed record DecisionComposerContext(
    IReadOnlyList<RuleEvaluation> RuleEvaluations,
    DeadlineEvaluation? DeadlineEvaluation,
    IReadOnlyList<LegalConclusion> LegalConclusions
);
