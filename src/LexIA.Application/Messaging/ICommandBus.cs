using System.Threading;
using System.Threading.Tasks;

namespace LexIA.Application.Messaging;

public interface ICommandBus
{
    Task DispatchAsync<TCommand>(TCommand command, CancellationToken cancellationToken = default) where TCommand : ICommand;
}
