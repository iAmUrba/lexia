using System;
using LexIA.Application.Messaging;

namespace LexIA.Application.Proceedings;

public sealed record CancelProceedingCommand(Guid Id, string CaseId, Guid ProceedingId, string Reason, DateTimeOffset CancelledAt) : ICommand;
