using LexIA.Domain.LegalRules.Contexts;
using LexIA.Domain.LegalRules.Rules;

namespace LexIA.Domain.LegalRules.RuleSets;

public sealed class CommonRuleSet : RuleSet<ProceedingRegistrationContext>
{
    public CommonRuleSet()
    {
        Rules.Add(new ChronologicalOrderRule());
    }
}
