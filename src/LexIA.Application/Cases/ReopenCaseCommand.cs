using System;

namespace LexIA.Application.Cases;

public sealed record ReopenCaseCommand(Guid Id, string CaseId, string Reason);
