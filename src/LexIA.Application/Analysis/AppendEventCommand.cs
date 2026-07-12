using System;

namespace LexIA.Application.Analysis;

public record AppendEventCommand(string ProceedingId, string CaseId, string Type, DateTime Date);
