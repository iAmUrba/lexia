using System;
using LexIA.Application.Messaging;

namespace LexIA.Application.Proceedings;

public sealed record RegisterProceedingCommand(
    Guid Id,
    Guid ProceedingId,
    string CaseId,
    string Type,
    DateTimeOffset Date,
    DateTimeOffset CaseOpenedAt) : ICommand;
