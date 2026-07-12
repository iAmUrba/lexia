using System;

namespace LexIA.Domain.Proceedings.Exceptions;

public class InvalidCancelDateException : Exception
{
    public InvalidCancelDateException(DateTimeOffset cancelledAt, DateTimeOffset originalDate) 
        : base($"La fecha de cancelación ({cancelledAt}) no puede ser anterior a la fecha original de la actuación ({originalDate}).")
    {
    }
}
