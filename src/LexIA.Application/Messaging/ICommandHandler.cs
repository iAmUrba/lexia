using System.Threading;
using System.Threading.Tasks;

namespace LexIA.Application.Messaging;

public interface ICommandHandler<in TCommand> where TCommand : ICommand
{
    Task HandleAsync(TCommand command, CancellationToken cancellationToken = default);
}
