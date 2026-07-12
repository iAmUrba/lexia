using System;
using LexIA.Domain.SeedWork;

namespace LexIA.Domain.Proceedings.Exceptions;

public class CannotCorrectCancelledProceedingException : Exception
{
    public CannotCorrectCancelledProceedingException(AggregateId id) 
        : base($"La actuación procesal {id.Value} está cancelada y por lo tanto no admite correcciones.")
    {
    }
}
