using System;
using System.Collections.Generic;
using System.Data;
using System.Linq;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using LexIA.Application.Persistence;
using LexIA.Domain.SeedWork;
using Npgsql;

namespace LexIA.Infrastructure.Persistence;

// Esta es una implementación minimalista intencionalmente. 
// No Type Registries automáticos. JSONB plano. 
// Upcasters se aplican on the fly.
public class PostgresEventStore : IEventStore
{
    private readonly string _connectionString;
    private readonly IEnumerable<IEventUpcaster> _upcasters;

    public PostgresEventStore(string connectionString, IEnumerable<IEventUpcaster>? upcasters = null)
    {
        _connectionString = connectionString;
        _upcasters = upcasters ?? Enumerable.Empty<IEventUpcaster>();
    }

    public async Task AppendToStreamAsync(AggregateId aggregateId, long expectedVersion, IEnumerable<(IDomainEvent Event, EventMetadata Metadata)> events, CancellationToken cancellationToken = default)
    {
        await using var connection = new NpgsqlConnection(_connectionString);
        await connection.OpenAsync(cancellationToken);
        
        // Bloqueamos el flujo optimista para el Agregado particular insertando en orden.
        await using var transaction = await connection.BeginTransactionAsync(IsolationLevel.ReadCommitted, cancellationToken);
        
        long currentVersion = expectedVersion;

        foreach (var (domainEvent, metadata) in events)
        {
            currentVersion++;
            
            // Si la versión del metadata difiere del flujo optimista, hay una ventana rota teórica en el dominio,
            // pero el ExpectedVersion nos protege a nivel de base de datos gracias a constraint UNIQUE(aggregate_id, version)
            
            var eventType = domainEvent.GetType().AssemblyQualifiedName ?? throw new InvalidOperationException("Event type not resolvable");
            var eventData = JsonSerializer.Serialize((object)domainEvent);
            var metadataJson = JsonSerializer.Serialize(metadata);

            await using var cmd = new NpgsqlCommand(
                @"INSERT INTO events (event_id, aggregate_id, version, event_type, data, metadata, occurred_on)
                  VALUES (@EventId, @AggregateId, @Version, @EventType, @Data::jsonb, @Metadata::jsonb, @OccurredOn)",
                connection, transaction);

            cmd.Parameters.AddWithValue("EventId", metadata.Id.Value);
            cmd.Parameters.AddWithValue("AggregateId", aggregateId.Value);
            cmd.Parameters.AddWithValue("Version", metadata.Version.Value);
            cmd.Parameters.AddWithValue("EventType", eventType);
            cmd.Parameters.AddWithValue("Data", eventData);
            cmd.Parameters.AddWithValue("Metadata", metadataJson);
            cmd.Parameters.AddWithValue("OccurredOn", metadata.OccurredOn);

            try
            {
                await cmd.ExecuteNonQueryAsync(cancellationToken);
            }
            catch (PostgresException ex) when (ex.SqlState == "23505") // Unique violation
            {
                throw new LexIA.Application.Exceptions.ConcurrencyConflictException(aggregateId, expectedVersion, ex);
            }
        }

        await transaction.CommitAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<(IDomainEvent Event, EventMetadata Metadata)>> ReadStreamAsync(AggregateId aggregateId, CancellationToken cancellationToken = default)
    {
        await using var connection = new NpgsqlConnection(_connectionString);
        await connection.OpenAsync(cancellationToken);

        await using var cmd = new NpgsqlCommand(
            @"SELECT event_type, data, metadata FROM events 
              WHERE aggregate_id = @AggregateId 
              ORDER BY version ASC", 
            connection);
            
        cmd.Parameters.AddWithValue("AggregateId", aggregateId.Value);

        await using var reader = await cmd.ExecuteReaderAsync(cancellationToken);
        
        var result = new List<(IDomainEvent Event, EventMetadata Metadata)>();

        while (await reader.ReadAsync(cancellationToken))
        {
            var eventTypeString = reader.GetString(0);
            var dataJson = reader.GetString(1);
            var metadataJson = reader.GetString(2);

            var metadata = JsonSerializer.Deserialize<EventMetadata>(metadataJson)!;
            var currentSchemaVersion = metadata.SchemaVersion;

            // Pipeline de Upcasting
            bool upcasted;
            do
            {
                upcasted = false;
                var upcaster = _upcasters.FirstOrDefault(u => u.CanUpcast(eventTypeString, currentSchemaVersion));
                if (upcaster != null)
                {
                    (eventTypeString, dataJson, currentSchemaVersion) = upcaster.Upcast(eventTypeString, dataJson, currentSchemaVersion);
                    upcasted = true;
                }
            } while (upcasted); // Sigue aplicando upcasters en cadena si existen (ej. V1 -> V2 -> V3)

            var eventType = Type.GetType(eventTypeString) ?? throw new InvalidOperationException($"Unknown event type: {eventTypeString}");
            
            var domainEvent = (IDomainEvent)JsonSerializer.Deserialize(dataJson, eventType)!;
            
            // Re-ensamblar metadata con la versión del schema actualizada
            var upcastedMetadata = metadata with { SchemaVersion = currentSchemaVersion };

            result.Add((domainEvent, upcastedMetadata));
        }

        return result;
    }
}
