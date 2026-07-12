using System;
using LexIA.Application.Messaging;

namespace LexIA.Application.Proceedings;

public sealed record CorrectProceedingCommand(Guid Id, string CaseId, Guid ProceedingId, string Reason, DateTimeOffset CorrectedAt) : ICommand;
