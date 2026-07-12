using System;

namespace LexIA.Application.Cases;

public sealed record SuspendCaseCommand(Guid Id, string CaseId, string Reason);
