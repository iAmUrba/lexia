using System.Linq;
using LexIA.Domain.LegalRules.Contexts;
using LexIA.Domain.Proceedings.Kinds;
using LexIA.Domain.SeedWork.Rules;

using LexIA.Domain.SeedWork;

namespace LexIA.Domain.LegalRules.Rules;

[Requirement("REQ-CIV-001")]
public sealed class AppealRequiresAppealableDecisionRule : ILegalRule<ProceedingRegistrationContext>
{
    public string RuleId => "RULE.APPEAL.001";
    public string RuleName => "AppealRequiresAppealableDecisionRule";

    public RuleMetadata Metadata { get; } = new RuleMetadata();

    public bool AppliesTo(ProceedingRegistrationContext context) => context.Kind == ProceedingKind.Appeal;

    public RuleEvaluation Evaluate(ProceedingRegistrationContext context)
    {
        var hasAppealableDecision = context.State.Proceedings.Any(p => p.Kind == ProceedingKind.Resolution);

        if (!hasAppealableDecision)
        {
            var basis = new LegalBasis
            {
                Source = "Código de Procedimiento Civil",
                Article = "YYY",
                Explanation = "El recurso de apelación tiene por objeto que el superior jerárquico revise una resolución dictada por el inferior. Si no hay resolución previa, carece de objeto."
            };
            return new RuleEvaluation(RuleId, RuleName, RuleOutcome.Failed, basis, "No procede recurso de apelación porque no existe resolución recurrible en el expediente.");
        }

        return new RuleEvaluation(RuleId, RuleName, RuleOutcome.Passed);
    }
}
