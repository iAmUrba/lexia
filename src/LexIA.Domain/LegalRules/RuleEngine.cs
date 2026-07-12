using System.Collections.Generic;
using LexIA.Domain.SeedWork.Rules;

namespace LexIA.Domain.LegalRules;

public sealed class RuleEngine<TContext>
{
    private readonly IReadOnlyList<IRule<TContext>> _rules;

    public RuleEngine(IEnumerable<IRule<TContext>> rules)
    {
        _rules = new List<IRule<TContext>>(rules);
    }

    public RuleResult Evaluate(TContext context)
    {
        var finalResult = RuleResult.Success();

        foreach (var rule in _rules)
        {
            if (!rule.AppliesTo(context))
            {
                finalResult.AddEvaluation(new RuleEvaluation(
                    rule.RuleId,
                    rule.RuleName,
                    RuleOutcome.Skipped,
                    Explanation: "Regla omitida porque no aplica al contexto actual."
                ));
                continue;
            }

            var evaluation = rule.Evaluate(context);
            finalResult.AddEvaluation(evaluation);
        }

        return finalResult;
    }
}
