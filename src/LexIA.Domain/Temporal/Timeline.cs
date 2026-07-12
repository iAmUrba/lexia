using System.Collections.Generic;

namespace LexIA.Domain.Temporal;

public sealed record Timeline(
    IReadOnlyList<ITimelineEvent> Events,
    BusinessCalendar Calendar
);
