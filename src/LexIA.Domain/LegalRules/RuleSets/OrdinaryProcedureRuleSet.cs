using LexIA.Domain.LegalRules.Contexts;
using LexIA.Domain.LegalRules.Rules;

namespace LexIA.Domain.LegalRules.RuleSets;

public sealed class OrdinaryProcedureRuleSet : RuleSet<ProceedingRegistrationContext>
{
    public OrdinaryProcedureRuleSet()
    {
        Rules.Add(new ClaimMustExistBeforeResolutionRule());
        Rules.Add(new AppealRequiresAppealableDecisionRule());
    }
}
