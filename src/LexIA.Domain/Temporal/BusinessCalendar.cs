using System;
using System.Collections.Generic;

namespace LexIA.Domain.Temporal;

public sealed record BusinessCalendar(
    IReadOnlyCollection<DateTimeOffset> Holidays,
    IReadOnlyCollection<DayOfWeek> WeekendDefinition,
    TimeSpan WorkingHoursStart,
    TimeSpan WorkingHoursEnd
);
