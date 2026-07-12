using System.Collections.Generic;

namespace LexIA.Domain.Decisions;

public sealed record NarrativeBlock(string Header, string Content);

public sealed record DecisionNarrative(
    IReadOnlyList<NarrativeBlock> Summary,
    IReadOnlyList<NarrativeBlock> DetailedExplanation
);
