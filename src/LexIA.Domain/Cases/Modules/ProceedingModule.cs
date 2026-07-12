using System;
using System.Linq;
using LexIA.Domain.Proceedings;
using LexIA.Domain.Proceedings.ValueObjects;
using LexIA.Domain.Proceedings.Exceptions;
using LexIA.Domain.Cases.Exceptions;

namespace LexIA.Domain.Cases.Modules;

public static class ProceedingModule
{
    public static void RegisterProceeding(CaseState state, Guid proceedingId)
    {
        if (state.Status == CaseStatus.Archived)
            throw new CaseArchivedException(state.CaseId);

        if (state.Proceedings.Any(p => p.Id == proceedingId))
            throw new DuplicateProceedingException(proceedingId);
    }

    public static void CancelProceeding(CaseState state, Guid proceedingId, DateTimeOffset cancelledAt)
    {
        if (state.Status == CaseStatus.Archived)
            throw new CaseArchivedException(state.CaseId);

        var proceeding = state.GetProceeding(proceedingId);

        if (proceeding.Status == ProceedingStatus.Cancelled)
            throw new CannotCancelAlreadyCancelledProceedingException(proceedingId.ToString());
            
        if (cancelledAt < proceeding.Date.Value)
            throw new InvalidCancelDateException(cancelledAt, proceeding.Date.Value);
    }

    public static void CorrectProceeding(CaseState state, Guid proceedingId, DateTimeOffset correctedAt)
    {
        if (state.Status == CaseStatus.Archived)
            throw new CaseArchivedException(state.CaseId);

        var proceeding = state.GetProceeding(proceedingId);

        if (proceeding.Status == ProceedingStatus.Cancelled)
            throw new CannotCorrectCancelledProceedingException(proceedingId.ToString());

        if (correctedAt < proceeding.Date.Value)
            throw new InvalidCorrectionDateException(correctedAt, proceeding.Date.Value);
    }
}
