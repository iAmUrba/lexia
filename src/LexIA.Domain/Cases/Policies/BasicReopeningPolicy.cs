using System;

namespace LexIA.Domain.Cases.Policies;

public class BasicReopeningPolicy : IReopeningPolicy
{
    public void EnsureCanReopen(CaseStatus currentStatus)
    {
        if (currentStatus != CaseStatus.Archived)
        {
            throw new InvalidOperationException($"No se puede reabrir un caso que está en estado {currentStatus}.");
        }
    }
}
