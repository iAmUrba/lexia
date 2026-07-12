using System.Linq;
using LexIA.Domain.LegalRules.Contexts;
using LexIA.Domain.Proceedings.Kinds;
using LexIA.Domain.SeedWork.Rules;

namespace LexIA.Domain.LegalRules.Rules;

public sealed class ClaimMustExistBeforeResolutionRule : ILegalRule<ProceedingRegistrationContext>
{
    public string RuleId => "RULE.CLAIM.001";
    public string RuleName => "ClaimMustExistBeforeResolutionRule";

    public RuleMetadata Metadata { get; } = new RuleMetadata();

    public bool AppliesTo(ProceedingRegistrationContext context) => context.Kind == ProceedingKind.Resolution;

    public RuleEvaluation Evaluate(ProceedingRegistrationContext context)
    {
        // Si es una resolución, el expediente debe tener una demanda previa (Filing)
        var hasClaim = context.State.Proceedings.Any(p => p.Kind == ProceedingKind.Filing);

        if (!hasClaim)
        {
            var basis = new LegalBasis
            {
                Source = "Código de Procedimiento Civil",
                Article = "XXX",
                Explanation = "Principio de congruencia y debido proceso: Toda resolución jurisdiccional debe recaer sobre una petición o demanda inicial."
            };
            return new RuleEvaluation(RuleId, RuleName, RuleOutcome.Failed, basis, "No se puede emitir una resolución sin que exista una demanda o solicitud inicial registrada.");
        }

        return new RuleEvaluation(RuleId, RuleName, RuleOutcome.Passed);
    }
}
