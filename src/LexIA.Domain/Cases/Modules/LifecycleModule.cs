using System;
using System.Linq;
using LexIA.Domain.Cases.Events;
using LexIA.Domain.Cases.Exceptions;

namespace LexIA.Domain.Cases.Modules;

public static class LifecycleModule
{
    public static void Open(CaseState state, string caseId)
    {
        if (state.Status != CaseStatus.Open)
            throw new InvalidCaseStatusTransitionException(state.Status, "Open");
    }

    public static void Suspend(CaseState state, string reason)
    {
        if (state.Status == CaseStatus.Suspended) return; // Idempotencia de dominio
        if (state.Status == CaseStatus.Archived)
            throw new CaseArchivedException(state.CaseId);
    }

    public static void Reopen(CaseState state, Policies.IReopeningPolicy reopeningPolicy)
    {
        reopeningPolicy.EnsureCanReopen(state.Status);
    }

    public static void Archive(CaseState state)
    {
        if (state.Status == CaseStatus.Archived) return;
    }
}
