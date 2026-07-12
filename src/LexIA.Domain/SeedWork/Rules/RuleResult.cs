using System.Collections.Generic;
using System.Linq;

namespace LexIA.Domain.SeedWork.Rules;

public sealed class RuleResult
{
    private readonly List<RuleEvaluation> _evaluations = new();

    public bool IsValid => !Violations.Any();

    public IReadOnlyList<RuleEvaluation> Evaluations => _evaluations.AsReadOnly();

    public IEnumerable<RuleViolation> Violations => _evaluations
        .Where(e => e.Outcome == RuleOutcome.Failed)
        .Select(e => new RuleViolation(e.RuleName, e.Explanation ?? string.Empty, e.Basis));

    public IEnumerable<RuleWarning> Warnings => _evaluations
        .Where(e => e.Outcome == RuleOutcome.Warning)
        .Select(e => new RuleWarning(e.RuleName, e.Explanation ?? string.Empty));

    public IEnumerable<string> AppliedRules => _evaluations
        .Where(e => e.Outcome == RuleOutcome.Passed)
        .Select(e => e.RuleName);

    public static RuleResult Success() => new();

    public static RuleResult Failed(RuleEvaluation evaluation)
    {
        var result = new RuleResult();
        result.AddEvaluation(evaluation);
        return result;
    }

    public static RuleResult Failed(IEnumerable<RuleEvaluation> evaluations)
    {
        var result = new RuleResult();
        result._evaluations.AddRange(evaluations);
        return result;
    }

    public void AddEvaluation(RuleEvaluation evaluation)
    {
        _evaluations.Add(evaluation);
    }

    public void Merge(RuleResult other)
    {
        _evaluations.AddRange(other._evaluations);
    }
}
