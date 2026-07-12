using System;
using System.Threading;
using System.Threading.Tasks;
using LexIA.Application.Proceedings;
using Npgsql;

namespace LexIA.Infrastructure.Persistence.Projections;

public sealed class ProceedingQueries : IProceedingQueries
{
    private readonly string _connectionString;

    public ProceedingQueries(string connectionString)
    {
        _connectionString = connectionString;
    }

    public async Task<ProceedingView?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        await using var connection = new NpgsqlConnection(_connectionString);
        await connection.OpenAsync(cancellationToken);

        await using var cmd = new NpgsqlCommand(
            @"SELECT id, case_id, type, date, status 
              FROM proceeding_view 
              WHERE id = @Id", connection);
        
        cmd.Parameters.AddWithValue("Id", id);

        await using var reader = await cmd.ExecuteReaderAsync(cancellationToken);

        if (await reader.ReadAsync(cancellationToken))
        {
            return new ProceedingView(
                reader.GetGuid(0),
                reader.GetString(1),
                reader.GetString(2),
                reader.GetDateTime(3), // mapped to Date
                reader.GetString(4)
            );
        }

        return null;
    }
}
