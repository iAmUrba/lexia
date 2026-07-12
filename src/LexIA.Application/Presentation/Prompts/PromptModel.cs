using System.Collections.Generic;

namespace LexIA.Application.Presentation.Prompts;

public sealed record PromptModel(
    string SystemInstructions,
    string TargetAudience,
    string Constraints,
    string Outcome,
    string Summary,
    string Timeline,
    string Evidence,
    string LegalReferences
);
