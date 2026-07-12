using System.Collections.Generic;
using LexIA.Domain.LegalRules;
using LexIA.Domain.Proceedings.Kinds;

namespace LexIA.Application.Proceedings.RuleSets;

public interface IRuleSetProvider<TContext>
{
    IEnumerable<ILegalRule<TContext>> Resolve(ProcedureType? procedureType);
}
