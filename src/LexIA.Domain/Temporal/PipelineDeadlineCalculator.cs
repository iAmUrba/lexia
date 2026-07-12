using System.Collections.Generic;

namespace LexIA.Domain.Temporal;

public sealed class PipelineDeadlineCalculator : IDeadlineCalculator
{
    private readonly IReadOnlyList<IDeadlineStep> _steps;

    public PipelineDeadlineCalculator(IEnumerable<IDeadlineStep> steps)
    {
        _steps = new List<IDeadlineStep>(steps);
    }

    public DeadlineEvaluation Calculate(TermComputationContext context)
    {
        // TODO: In a real implementation, we would determine the cursor from the OriginResolver.
        // For now, we mock the initial state to satisfy the interface constraint.
        var initialState = new DeadlineComputationState(
            Cursor: context.Clock.Now,
            Progress: new DeadlineProgress(context.Term.Length, context.Term.Unit),
            Timeline: context.Timeline,
            Policy: context.Policy,
            Trace: new List<TraceStep>()
        );

        var currentState = initialState;

        foreach (var step in _steps)
        {
            currentState = step.Execute(currentState);
        }

        var finalDeadline = new Deadline(
            CalculatedDate: currentState.Cursor,
            Status: DeadlineStatus.Pending
        );

        return new DeadlineEvaluation(
            Deadline: finalDeadline,
            Trace: new TemporalTrace(currentState.Trace),
            Reasoning: "Evaluación completada vía pipeline."
        );
    }
}
