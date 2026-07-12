using System;
using System.Collections.Generic;
using System.Linq;
using LexIA.Domain.Proceedings;
using LexIA.Domain.SeedWork;
using LexIA.Domain.Cases.Modules;
using LexIA.Domain.Courts;
using LexIA.Domain.Parties;
using LexIA.Domain.Proceedings.Kinds;

namespace LexIA.Domain.Cases;

public sealed class CaseAggregate : AggregateRoot
{
    private readonly CaseState _state = new();

    public string CaseId => string.IsNullOrEmpty(Id.Value) ? _state.CaseId : Id.Value;
    public CourtId? CourtId => _state.CourtId;
    public ProcedureType? ProcedureType => _state.ProcedureType;
    public IReadOnlyCollection<PartyId> Parties => _state.Parties.AsReadOnly();
    public IReadOnlyCollection<ProceedingEntity> Proceedings => _state.Proceedings.AsReadOnly();
    public CaseStatus Status => _state.Status;

    public CaseAggregate(string caseId)
    {
        Id = new AggregateId(caseId);
    }

    // Required for Rehydration via Reflection
    public CaseAggregate() { }

    public void Open(string commandId, string caseId)
    {
        if (_state.HandledCommandIds.Contains(commandId)) return;
        LifecycleModule.Open(_state, caseId);

        ApplyChange(new Events.CaseOpened(caseId));
        ApplyChange(new LexIA.Domain.SeedWork.Events.CommandExecutionRecorded(commandId));
    }

    public void Suspend(string commandId, string reason)
    {
        if (_state.HandledCommandIds.Contains(commandId)) return;
        LifecycleModule.Suspend(_state, reason);

        if (Status == CaseStatus.Suspended) return; // Si ya estaba, ApplyChange no debería emitirlo de nuevo si el modulo controla eso. Wait, el modulo no lanza excepcion si ya esta suspendido, retorna. Para evitar emitir:
        if (Status == CaseStatus.Suspended) return; // Actually handled by if condition

        ApplyChange(new Events.CaseSuspended(CaseId, reason));
        ApplyChange(new LexIA.Domain.SeedWork.Events.CommandExecutionRecorded(commandId));
    }

    public void Reopen(string commandId, string reason, Policies.IReopeningPolicy reopeningPolicy)
    {
        if (_state.HandledCommandIds.Contains(commandId)) return;
        LifecycleModule.Reopen(_state, reopeningPolicy);

        ApplyChange(new Events.CaseReopened(CaseId, reason));
        ApplyChange(new LexIA.Domain.SeedWork.Events.CommandExecutionRecorded(commandId));
    }

    public void Archive(string commandId)
    {
        if (_state.HandledCommandIds.Contains(commandId)) return;
        if (Status == CaseStatus.Archived) return;
        LifecycleModule.Archive(_state);

        ApplyChange(new Events.CaseArchived(CaseId));
        ApplyChange(new LexIA.Domain.SeedWork.Events.CommandExecutionRecorded(commandId));
    }

    public void RegisterProceeding(
        string commandId, 
        Guid proceedingId, 
        string type, 
        Proceedings.ValueObjects.ProceedingDate date)
    {
        if (_state.HandledCommandIds.Contains(commandId)) return; 

        ProceedingModule.RegisterProceeding(_state, proceedingId);

        ApplyChange(new ProceedingRegistered(proceedingId, CaseId, type, date));
        ApplyChange(new LexIA.Domain.SeedWork.Events.CommandExecutionRecorded(commandId));
    }

    public void CancelProceeding(string commandId, Guid proceedingId, string reason, DateTimeOffset cancelledAt)
    {
        if (_state.HandledCommandIds.Contains(commandId)) return;

        ProceedingModule.CancelProceeding(_state, proceedingId, cancelledAt);

        ApplyChange(new ProceedingCancelled(proceedingId, reason, new Proceedings.ValueObjects.ProceedingDate(cancelledAt)));
        ApplyChange(new LexIA.Domain.SeedWork.Events.CommandExecutionRecorded(commandId));
    }

    public void CorrectProceeding(string commandId, Guid proceedingId, string reason, DateTimeOffset correctedAt)
    {
        if (_state.HandledCommandIds.Contains(commandId)) return;

        ProceedingModule.CorrectProceeding(_state, proceedingId, correctedAt);

        ApplyChange(new ProceedingCorrected(proceedingId, reason, new Proceedings.ValueObjects.ProceedingDate(correctedAt)));
        ApplyChange(new LexIA.Domain.SeedWork.Events.CommandExecutionRecorded(commandId));
    }

    public CaseSnapshot CreateSnapshot()
    {
        return new CaseSnapshot
        {
            Version = Version.Value,
            State = _state.Clone()
        };
    }

    public void RestoreFromSnapshot(CaseSnapshot snapshot)
    {
        Version = new AggregateVersion(snapshot.Version);
        
        // Deep clone again to prevent external modifications affecting the internal state
        var restoredState = snapshot.State.Clone();
        
        _state.CaseId = restoredState.CaseId;
        _state.Status = restoredState.Status;
        _state.Proceedings.Clear();
        _state.Proceedings.AddRange(restoredState.Proceedings);
        _state.HandledCommandIds.Clear();
        foreach (var cmd in restoredState.HandledCommandIds) _state.HandledCommandIds.Add(cmd);
        
        Id = new AggregateId(restoredState.CaseId);
    }

    protected override void Apply(IDomainEvent @event)
    {
        switch (@event)
        {
            case ProceedingRegistered e:
                if (string.IsNullOrEmpty(Id.Value)) Id = new AggregateId(e.CaseId);
                _state.CaseId = e.CaseId;
                _state.Proceedings.Add(new ProceedingEntity(e));
                break;
            case ProceedingCancelled e:
                _state.GetProceeding(e.ProceedingId).Apply(e);
                break;
            case ProceedingCorrected e:
                _state.GetProceeding(e.ProceedingId).Apply(e);
                break;
            case Events.CaseArchived e:
                if (string.IsNullOrEmpty(Id.Value)) Id = new AggregateId(e.CaseId);
                _state.CaseId = e.CaseId;
                _state.Status = CaseStatus.Archived;
                break;
            case Events.CaseOpened e:
                if (string.IsNullOrEmpty(Id.Value)) Id = new AggregateId(e.CaseId);
                _state.CaseId = e.CaseId;
                _state.Status = CaseStatus.InProgress;
                break;
            case Events.CaseSuspended e:
                _state.Status = CaseStatus.Suspended;
                break;
            case Events.CaseReopened e:
                _state.Status = CaseStatus.InProgress;
                break;
            case LexIA.Domain.SeedWork.Events.CommandExecutionRecorded e:
                _state.HandledCommandIds.Add(e.CommandId);
                break;
        }
    }
}
