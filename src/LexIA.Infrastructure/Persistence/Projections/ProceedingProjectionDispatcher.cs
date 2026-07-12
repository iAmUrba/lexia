using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using LexIA.Application.Proceedings;
using LexIA.Domain.Proceedings;
using LexIA.Domain.SeedWork;
using Npgsql;

namespace LexIA.Infrastructure.Persistence.Projections;

public sealed class ProceedingProjectionDispatcher : IProceedingProjectionDispatcher
{
    private readonly string _connectionString;

    public ProceedingProjectionDispatcher(string connectionString)
    {
        _connectionString = connectionString;
    }

    public async Task DispatchAsync(IReadOnlyList<(IDomainEvent Event, EventMetadata Metadata)> events, CancellationToken cancellationToken = default)
    {
        await using var connection = new NpgsqlConnection(_connectionString);
        await connection.OpenAsync(cancellationToken);

        foreach (var (domainEvent, metadata) in events)
        {
            if (domainEvent is ProceedingRegistered registered)
            {
                await using var cmd = new NpgsqlCommand(
                    @"INSERT INTO proceeding_view (id, case_id, type, date, status) 
                      VALUES (@Id, @CaseId, @Type, @Date, 'Registrada')
                      ON CONFLICT (id) DO NOTHING", connection);

                cmd.Parameters.AddWithValue("Id", registered.ProceedingId);
                cmd.Parameters.AddWithValue("CaseId", registered.CaseId);
                cmd.Parameters.AddWithValue("Type", registered.Type);
                cmd.Parameters.AddWithValue("Date", registered.Date);

                await cmd.ExecuteNonQueryAsync(cancellationToken);
            }
        }
    }

    public async Task DispatchRegisteredAsync(ProceedingRegistered @event, CancellationToken cancellationToken = default)
    {
        await using var conn = new NpgsqlConnection(_connectionString);
        await conn.OpenAsync(cancellationToken);
        
        await using var cmd = new NpgsqlCommand(
            "INSERT INTO proceeding_view (id, case_id, type, date, status) VALUES (@id, @caseId, @type, @date, 'Registrada')", 
            conn);
            
        cmd.Parameters.AddWithValue("id", @event.ProceedingId);
        cmd.Parameters.AddWithValue("caseId", @event.CaseId);
        cmd.Parameters.AddWithValue("type", @event.Type);
        cmd.Parameters.AddWithValue("date", @event.Date);

        await cmd.ExecuteNonQueryAsync(cancellationToken);
    }

    public async Task DispatchCancelledAsync(ProceedingCancelled @event, CancellationToken cancellationToken = default)
    {
        await using var conn = new NpgsqlConnection(_connectionString);
        await conn.OpenAsync(cancellationToken);
        
        await using var cmd = new NpgsqlCommand(
            "UPDATE proceeding_view SET status = 'Cancelada' WHERE id = @id", 
            conn);
            
        cmd.Parameters.AddWithValue("id", @event.ProceedingId);

        await cmd.ExecuteNonQueryAsync(cancellationToken);
    }

    public async Task DispatchCorrectedAsync(ProceedingCorrected @event, CancellationToken cancellationToken = default)
    {
        await using var conn = new NpgsqlConnection(_connectionString);
        await conn.OpenAsync(cancellationToken);
        
        await using var cmd = new NpgsqlCommand(
            "UPDATE proceeding_view SET status = 'Corregida' WHERE id = @id", 
            conn);
            
        cmd.Parameters.AddWithValue("id", @event.ProceedingId);

        await cmd.ExecuteNonQueryAsync(cancellationToken);
    }
}
