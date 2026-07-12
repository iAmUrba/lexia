using System;

namespace LexIA.Application.Cases;

public sealed record OpenCaseCommand(Guid Id, string CaseId);
