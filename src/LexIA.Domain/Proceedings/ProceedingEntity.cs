using System;
using LexIA.Domain.SeedWork;
using LexIA.Domain.Proceedings.Kinds;

namespace LexIA.Domain.Proceedings;

public sealed class ProceedingEntity
{
    public Guid Id { get; private set; }
    public ProceedingStatus Status { get; private set; }
    public string CaseId { get; private set; } = string.Empty;
    public ProceedingKind Kind { get; private set; } = ProceedingKind.Unknown;
    public ValueObjects.ProceedingDate Date { get; private set; }

    internal ProceedingEntity(ProceedingRegistered e)
    {
        Id = e.ProceedingId;
        CaseId = e.CaseId;
        Kind = ProceedingKind.FromCode(e.Type);
        Date = e.Date;
        Status = ProceedingStatus.Registered;
    }

    internal void Apply(ProceedingCancelled e)
    {
        Status = ProceedingStatus.Cancelled;
    }

    internal void Apply(ProceedingCorrected e)
    {
        Status = ProceedingStatus.Corrected;
    }

    internal ProceedingEntity Clone()
    {
        return new ProceedingEntity(new ProceedingRegistered(Id, CaseId, Kind.Code, Date))
        {
            Status = this.Status
        };
    }
}
