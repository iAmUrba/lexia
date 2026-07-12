namespace LexIA.Domain.SeedWork.Events;

/// <summary>
/// Evento técnico de idempotencia. No forma parte del lenguaje ubicuo jurídico, 
/// pero se persiste en el stream para garantizar que un comando no se procese dos veces.
/// (Ver ADR-010).
/// </summary>
public sealed record CommandExecutionRecorded(string CommandId) : IDomainEvent;
