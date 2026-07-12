using System;
using LexIA.Domain.SeedWork.Exceptions;

namespace LexIA.Domain.Cases.Exceptions;

public class InvalidCaseStatusTransitionException : DomainException
{
    public InvalidCaseStatusTransitionException(CaseStatus currentStatus, string intendedAction) 
        : base($"No se puede realizar la acción '{intendedAction}' porque el caso se encuentra en estado {currentStatus}.")
    {
    }
}
