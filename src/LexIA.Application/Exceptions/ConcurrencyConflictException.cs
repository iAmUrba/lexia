using System;
using LexIA.Domain.SeedWork;

namespace LexIA.Application.Exceptions;

public class ConcurrencyConflictException : Exception
{
    public ConcurrencyConflictException(AggregateId aggregateId, long expectedVersion, Exception innerException) 
        : base($"Concurrency conflict detected for Aggregate {aggregateId.Value}. Expected version: {expectedVersion}.", innerException)
    {
    }
}
