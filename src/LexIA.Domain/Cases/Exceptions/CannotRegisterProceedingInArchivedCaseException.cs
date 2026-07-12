using System;
using LexIA.Domain.SeedWork;

namespace LexIA.Domain.Cases.Exceptions;

public class CannotRegisterProceedingInArchivedCaseException : Exception
{
    public string CaseId { get; }

    public CannotRegisterProceedingInArchivedCaseException(string caseId) 
        : base($"No se pueden registrar actuaciones en el expediente {caseId} porque se encuentra archivado.")
    {
        CaseId = caseId;
    }
}
