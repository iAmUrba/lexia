using System;
using System.Collections.Generic;

namespace LexIA.Domain.Decisions;

public sealed record DecisionMetadata(
    string Version,
    DateTimeOffset GeneratedAt,
    IReadOnlyDictionary<string, string> EngineVersions
);
