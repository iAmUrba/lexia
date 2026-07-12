using System;
using System.Collections.Generic;

namespace LexIA.Domain.Inference;

public interface ILegalDerivation<TContext, TResult>
{
    string DerivationId { get; }
    IReadOnlyList<TResult> Derive(TContext context);
}
