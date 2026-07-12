using System;

namespace LexIA.Domain.SeedWork.Exceptions;

public abstract class DomainException : Exception
{
    protected DomainException(string message) : base(message)
    {
    }
}
