namespace LexIA.Domain.Temporal;

public interface IDeadlineCalculator
{
    DeadlineEvaluation Calculate(TermComputationContext context);
}
