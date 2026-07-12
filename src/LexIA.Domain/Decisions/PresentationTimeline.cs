using System.Collections.Generic;

namespace LexIA.Domain.Decisions;

public sealed record PresentationTimeline(
    IReadOnlyList<TimelineNode> Nodes
);
