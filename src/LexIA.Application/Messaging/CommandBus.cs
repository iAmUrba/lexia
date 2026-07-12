using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace LexIA.Application.Messaging;

// Implementación minimalista deliberada: Sin Reflection pesada, sin descubrimiento automático.
// Se requiere registro manual explícito.
public sealed class CommandBus : ICommandBus
{
    private readonly Dictionary<Type, Func<ICommand, CancellationToken, Task>> _handlers = new();

    public void Register<TCommand>(ICommandHandler<TCommand> handler) where TCommand : ICommand
    {
        if (_handlers.ContainsKey(typeof(TCommand)))
        {
            throw new InvalidOperationException($"Handler for {typeof(TCommand).Name} is already registered.");
        }

        _handlers[typeof(TCommand)] = (cmd, ct) => handler.HandleAsync((TCommand)cmd, ct);
    }

    public Task DispatchAsync<TCommand>(TCommand command, CancellationToken cancellationToken = default) where TCommand : ICommand
    {
        var commandType = command.GetType();
        if (!_handlers.TryGetValue(commandType, out var handlerWrapper))
        {
            throw new InvalidOperationException($"No handler explicitly registered for command type: {commandType.Name}");
        }

        return handlerWrapper(command, cancellationToken);
    }
}
