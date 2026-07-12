using System;

namespace LexIA.Application.Monitoring;

public interface IDomainMetrics
{
    void RecordCommandExecution(Type commandType, int generatedEventsCount, double executionTimeMs);
}
