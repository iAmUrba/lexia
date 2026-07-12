using System.Collections.Generic;

namespace LexIA.Domain.LegalRules.RuleSets;

public abstract class RuleSet<TContext>
{
    protected readonly List<ILegalRule<TContext>> Rules = new();

    public IEnumerable<ILegalRule<TContext>> GetRules() => Rules.AsReadOnly();
}
