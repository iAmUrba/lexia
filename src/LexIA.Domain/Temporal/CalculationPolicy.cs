namespace LexIA.Domain.Temporal;

public enum StartConvention
{
    SameDay,
    NextDay,
    NextWorkingDay
}

public enum DayCountingConvention
{
    CalendarDays,
    WorkingDays
}

public enum HolidayConvention
{
    CountHolidays,
    SkipHolidays,
    SkipIfEndsOnHoliday
}

public enum SuspensionConvention
{
    IgnoreSuspensions,
    FreezeClock
}

public sealed record CalculationPolicy(
    StartConvention Start,
    DayCountingConvention Counting,
    HolidayConvention Holidays,
    SuspensionConvention Suspensions
);
