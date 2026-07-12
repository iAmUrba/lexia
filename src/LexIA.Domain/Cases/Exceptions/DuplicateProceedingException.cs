using System;
using LexIA.Domain.SeedWork.Exceptions;

namespace LexIA.Domain.Cases.Exceptions;

public class DuplicateProceedingException : DomainException
{
    public DuplicateProceedingException(Guid proceedingId) 
        : base($"El proceeding con ID {proceedingId} ya existe en el caso y no puede ser duplicado.")
    {
    }
}
