using System;
using LexIA.Domain.SeedWork.Exceptions;

namespace LexIA.Domain.Cases.Exceptions;

public class CaseArchivedException : DomainException
{
    public CaseArchivedException(string caseId) 
        : base($"El caso {caseId} se encuentra archivado y no acepta modificaciones.")
    {
    }
}
