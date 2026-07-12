using System.Linq;

namespace LexIA.Domain.Temporal;

public sealed class OriginResolverStep : IDeadlineStep
{
    public string StepId => "TEMP.ORIGIN.001";
    public DeadlineComputationState Execute(DeadlineComputationState state)
    {
        // Simple logic for origin resolution.
        // If there's an origin event in the timeline, we start from there.
        var firstEvent = state.Timeline.Events.FirstOrDefault();
        if (firstEvent == null)
            return state;

        var startCursor = firstEvent.Timestamp;
        
        if (state.Policy.Start == StartConvention.NextDay)
        {
            startCursor = startCursor.AddDays(1);
        }
        else if (state.Policy.Start == StartConvention.NextWorkingDay)
        {
            // Simple mockup: assume next day.
            startCursor = startCursor.AddDays(1);
        }
        
        var step = new TraceStep(
            StepId: StepId,
            StepName: "OriginResolver",
            Decision: "ResolvedOrigin",
            Reason: $"Origin set to {startCursor} based on StartConvention {state.Policy.Start}",
            LegalBasis: null,
            AffectedDate: startCursor
        );

        return (state with { Cursor = startCursor }).WithTrace(step);
    }
}
