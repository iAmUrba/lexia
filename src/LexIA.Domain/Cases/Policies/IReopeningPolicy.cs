namespace LexIA.Domain.Cases.Policies;

public interface IReopeningPolicy
{
    void EnsureCanReopen(CaseStatus currentStatus);
}
