using System;

using LexIA.Domain.SeedWork;

namespace LexIA.Domain.Temporal;

[Requirement("REQ-CIV-007")]
public sealed class BusinessDayCounterStep : IDeadlineStep
{
    public string StepId => "TEMP.COUNT.001";
    public DeadlineComputationState Execute(DeadlineComputationState state)
    {
        var currentState = state;

        // In a real implementation, we'd handle hours, months, years.
        // For now we just implement the basic iteration.
        while (!currentState.Progress.IsComplete)
        {
            var nextDay = currentState.Cursor.AddDays(1);
            
            // Here we would apply Weekend and Holiday skipping.
            // For now, let's just advance the cursor.
            
            currentState = currentState with { Cursor = nextDay };
            currentState = currentState with { Progress = currentState.Progress.Decrement() };

            currentState = currentState.WithTrace(new TraceStep(
                StepId: StepId,
                StepName: "DayCounter",
                Decision: "CountedDay",
                Reason: "Día contabilizado exitosamente",
                LegalBasis: null,
                AffectedDate: nextDay
            ));
        }

        return currentState;
    }
}
