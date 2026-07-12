namespace LexIA.Domain.Temporal;

public interface IDeadlineStep
{
    string StepId { get; }
    DeadlineComputationState Execute(DeadlineComputationState state);
}
