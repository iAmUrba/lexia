using System.Collections.Generic;
using System.Linq;
using LexIA.Domain.LegalRules;
using LexIA.Domain.LegalRules.Contexts;
using LexIA.Domain.LegalRules.RuleSets;
using LexIA.Domain.Proceedings.Kinds;

namespace LexIA.Application.Proceedings.RuleSets;

public sealed class ProceedingRegistrationRuleSetProvider : IRuleSetProvider<ProceedingRegistrationContext>
{
    private readonly CommonRuleSet _commonRuleSet;
    private readonly OrdinaryProcedureRuleSet _ordinaryRuleSet;

    public ProceedingRegistrationRuleSetProvider(
        CommonRuleSet commonRuleSet,
        OrdinaryProcedureRuleSet ordinaryRuleSet)
    {
        _commonRuleSet = commonRuleSet;
        _ordinaryRuleSet = ordinaryRuleSet;
    }

    public IEnumerable<ILegalRule<ProceedingRegistrationContext>> Resolve(ProcedureType? procedureType)
    {
        var rules = new List<ILegalRule<ProceedingRegistrationContext>>(_commonRuleSet.GetRules());

        if (procedureType == ProcedureType.Ordinary)
        {
            rules.AddRange(_ordinaryRuleSet.GetRules());
        }

        return rules;
    }
}
