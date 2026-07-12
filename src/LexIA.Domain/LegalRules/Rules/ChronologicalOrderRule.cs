using System.Linq;
using LexIA.Domain.LegalRules.Contexts;
using LexIA.Domain.Proceedings;
using LexIA.Domain.SeedWork.Rules;

using LexIA.Domain.SeedWork;

namespace LexIA.Domain.LegalRules.Rules;

[Requirement("REQ-CIV-002")]
public sealed class ChronologicalOrderRule : ILegalRule<ProceedingRegistrationContext>
{
    public string RuleId => "RULE.TIME.001";
    public string RuleName => "ChronologicalOrderRule";

    public RuleMetadata Metadata { get; } = new RuleMetadata();

    public bool AppliesTo(ProceedingRegistrationContext context) => true;

    public RuleEvaluation Evaluate(ProceedingRegistrationContext context)
    {
        var proceedings = context.State.Proceedings;

        if (proceedings.Count == 0)
            return new RuleEvaluation(RuleId, RuleName, RuleOutcome.Passed);

        var lastProceeding = proceedings.OrderByDescending(p => p.Date.Value).First();

        if (context.Date < lastProceeding.Date.Value)
        {
            var basis = new LegalBasis
            {
                Explanation = "Las actuaciones deben registrarse en orden cronológico estricto."
            };
            return new RuleEvaluation(RuleId, RuleName, RuleOutcome.Failed, basis, $"No se puede registrar una actuación con fecha {context.Date} anterior a la última actuación registrada ({lastProceeding.Date.Value}).");
        }

        return new RuleEvaluation(RuleId, RuleName, RuleOutcome.Passed);
    }
}
