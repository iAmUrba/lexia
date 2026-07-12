using System;

namespace LexIA.Domain.Proceedings.Exceptions;

public class ProceedingDateBeforeCaseOpeningException : Exception
{
    public ProceedingDateBeforeCaseOpeningException(DateTimeOffset proceedingDate, DateTimeOffset caseOpeningDate) 
        : base($"La fecha de la actuación ({proceedingDate}) no puede ser anterior a la fecha de apertura del expediente ({caseOpeningDate}).")
    {
    }
}
