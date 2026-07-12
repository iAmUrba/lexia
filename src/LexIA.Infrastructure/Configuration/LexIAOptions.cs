namespace LexIA.Infrastructure.Configuration;

public sealed class LexIAOptions
{
    public const string SectionName = "LexIA";

    public DatabaseOptions Database { get; set; } = new();
    public TelemetryOptions Telemetry { get; set; } = new();
    public PersistenceOptions Persistence { get; set; } = new();
}

public sealed class DatabaseOptions
{
    public string ConnectionString { get; set; } = string.Empty;
}

public sealed class TelemetryOptions
{
    public bool EnableMetrics { get; set; } = true;
    public bool EnableTracing { get; set; } = true;
}

public sealed class PersistenceOptions
{
    public string EventStoreType { get; set; } = "Postgres";
}
