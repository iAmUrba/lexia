using System;
using System.Diagnostics;
using System.Threading;
using System.Threading.Tasks;
using LexIA.Application.Monitoring;
using LexIA.Domain.SeedWork;

namespace LexIA.Application.Messaging;

public class MetricsCommandBusDecorator : ICommandBus
{
    private readonly ICommandBus _innerBus;
    private readonly IDomainMetrics _metrics;

    public MetricsCommandBusDecorator(ICommandBus innerBus, IDomainMetrics metrics)
    {
        _innerBus = innerBus;
        _metrics = metrics;
    }

    public async Task DispatchAsync<TCommand>(TCommand command, CancellationToken cancellationToken = default) where TCommand : ICommand
    {
        var sw = Stopwatch.StartNew();
        
        await _innerBus.DispatchAsync(command, cancellationToken);
        
        sw.Stop();
        
        _metrics.RecordCommandExecution(command.GetType(), 0, sw.ElapsedMilliseconds);
    }
}
