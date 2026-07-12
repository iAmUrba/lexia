using System.Collections.Generic;
using LexIA.Domain.Proceedings;
using LexIA.Domain.Temporal;

namespace LexIA.Domain.Inference;

public sealed record ProceduralTimeContext(
    Timeline Timeline,
    DeadlineEvaluation? Deadline,
    IReadOnlyList<ProceedingEntity> Proceedings,
    BusinessCalendar Calendar,
    CalculationPolicy Policy
);
