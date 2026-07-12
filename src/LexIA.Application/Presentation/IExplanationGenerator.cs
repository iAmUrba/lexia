using System.Threading;
using System.Threading.Tasks;

namespace LexIA.Application.Presentation;

public sealed record ExplanationRequest(
    string RenderedPrompt
);

public sealed record ExplanationResponse(
    string Content
);

public interface IExplanationGenerator
{
    Task<ExplanationResponse> GenerateAsync(ExplanationRequest request, CancellationToken cancellationToken = default);
}
