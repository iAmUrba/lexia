using System;
using LexIA.Domain.SeedWork;

namespace LexIA.Domain.Proceedings.Exceptions;

public class CannotCancelAlreadyCancelledProceedingException : Exception
{
    public CannotCancelAlreadyCancelledProceedingException(AggregateId id) 
        : base($"La actuación procesal {id.Value} ya ha sido cancelada.")
    {
    }
}
