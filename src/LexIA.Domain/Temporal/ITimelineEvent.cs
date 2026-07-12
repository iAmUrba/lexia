using System;

namespace LexIA.Domain.Temporal;

public interface ITimelineEvent
{
    Guid EventId { get; }
    DateTimeOffset Timestamp { get; }
}
