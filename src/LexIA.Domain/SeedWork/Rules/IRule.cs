namespace LexIA.Domain.SeedWork.Rules;

public interface IRule<TContext>
{
    string RuleId { get; }
    string RuleName { get; }
    RuleMetadata Metadata { get; }
    bool AppliesTo(TContext context);
    RuleEvaluation Evaluate(TContext context);
}
