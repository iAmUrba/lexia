using System;
using System.Linq;
using LexIA.Domain.Proceedings.Kinds;

namespace LexIA.Domain.Cases;

public sealed record CaseLegalStatus
{
    public string StatusName { get; }
    public string Description { get; }
    public bool IsActive { get; }

    private CaseLegalStatus(string statusName, string description, bool isActive)
    {
        StatusName = statusName;
        Description = description;
        IsActive = isActive;
    }

    public static CaseLegalStatus DeriveFrom(CaseState state)
    {
        if (state.Status == CaseStatus.Archived)
            return new CaseLegalStatus("Archivado", "El caso está cerrado y archivado.", false);

        if (state.Status == CaseStatus.Suspended)
            return new CaseLegalStatus("Suspendido", "Los plazos procesales se encuentran suspendidos.", false);

        var proceedings = state.Proceedings.Where(p => p.Status != Proceedings.ProceedingStatus.Cancelled).ToList();

        if (proceedings.Any(p => p.Kind.IsAppeal()))
            return new CaseLegalStatus("En Apelación", "Existe un recurso de apelación pendiente de resolver.", true);

        if (proceedings.Any(p => p.Kind.IsResolution()))
            return new CaseLegalStatus("Pendiente de Ejecutoria", "Existe una resolución dictada pendiente de firmeza.", true);

        if (state.Status == CaseStatus.Open || state.Status == CaseStatus.InProgress)
            return new CaseLegalStatus("En Trámite", "El caso se encuentra en trámite regular.", true);

        return new CaseLegalStatus("Desconocido", "Estado legal no determinable.", false);
    }
}
