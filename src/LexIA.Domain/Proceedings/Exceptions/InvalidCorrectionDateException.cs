using System;

namespace LexIA.Domain.Proceedings.Exceptions;

public class InvalidCorrectionDateException : Exception
{
    public InvalidCorrectionDateException(DateTimeOffset correctedAt, DateTimeOffset originalDate) 
        : base($"La fecha de corrección ({correctedAt}) no puede ser anterior a la fecha original de la actuación ({originalDate}).")
    {
    }
}
