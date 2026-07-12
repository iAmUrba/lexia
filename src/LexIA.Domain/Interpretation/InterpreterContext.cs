using System;

namespace LexIA.Domain.Interpretation;

/// <summary>
/// A snapshot context required to interpret domain events into temporal effects.
/// As per LexIA architecture rules, this must be an immutable, logic-free data structure.
/// </summary>
public sealed record InterpreterContext(
    string CaseId,
    DateTimeOffset CurrentTime
);
