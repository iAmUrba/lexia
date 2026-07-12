using System;

namespace LexIA.Application.Cases;

public sealed record ArchiveCaseCommand(Guid Id, string CaseId);
