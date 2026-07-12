using System;

namespace LexIA.Api.Models;

public class EnvelopeMeta
{
    public string ApiVersion { get; init; } = "1.0";
    public string CorrelationId { get; init; } = string.Empty;
    public DateTimeOffset GeneratedAt { get; init; } = DateTimeOffset.UtcNow;
}

public class Envelope<T>
{
    public EnvelopeMeta Meta { get; init; } = new();
    public T Data { get; init; } = default!;
}
