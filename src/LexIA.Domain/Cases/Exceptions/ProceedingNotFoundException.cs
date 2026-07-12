using System;
using LexIA.Domain.SeedWork.Exceptions;

namespace LexIA.Domain.Cases.Exceptions;

public class ProceedingNotFoundException : DomainException
{
    public ProceedingNotFoundException(Guid proceedingId) 
        : base($"El proceeding con ID {proceedingId} no fue encontrado en el caso.")
    {
    }
}
