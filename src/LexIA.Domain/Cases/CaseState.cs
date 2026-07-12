using System;
using System.Collections.Generic;
using System.Linq;
using LexIA.Domain.Proceedings;
using LexIA.Domain.Courts;
using LexIA.Domain.Parties;
using LexIA.Domain.Proceedings.Kinds;

namespace LexIA.Domain.Cases;

public sealed class CaseState
{
    public string CaseId { get; internal set; } = string.Empty;
    public CaseStatus Status { get; internal set; } = CaseStatus.Open;
    public CourtId? CourtId { get; internal set; }
    public ProcedureType? ProcedureType { get; internal set; }
    public List<PartyId> Parties { get; } = new();
    
    public List<ProceedingEntity> Proceedings { get; } = new();
    public HashSet<string> HandledCommandIds { get; } = new();

    public ProceedingEntity GetProceeding(Guid proceedingId)
    {
        var proceeding = Proceedings.FirstOrDefault(p => p.Id == proceedingId);
        if (proceeding == null)
            throw new LexIA.Domain.Cases.Exceptions.ProceedingNotFoundException(proceedingId);
        return proceeding;
    }

    public CaseState Clone()
    {
        var clone = new CaseState
        {
            CaseId = CaseId,
            Status = Status,
            CourtId = CourtId,
            ProcedureType = ProcedureType
        };
        
        foreach (var party in Parties)
        {
            clone.Parties.Add(party);
        }
        
        foreach (var p in Proceedings)
        {
            clone.Proceedings.Add(p.Clone());
        }

        foreach (var cmd in HandledCommandIds)
        {
            clone.HandledCommandIds.Add(cmd);
        }

        return clone;
    }
}
