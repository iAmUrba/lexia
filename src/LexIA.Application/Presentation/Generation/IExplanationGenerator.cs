using System.Threading;
using System.Threading.Tasks;
using LexIA.Application.Presentation.Profiles;
using LexIA.Application.Presentation.Prompts;

namespace LexIA.Application.Presentation.Generation;

public interface IExplanationGenerator
{
    Task<string> GenerateAsync(PromptModel prompt, IExplanationProfile profile, CancellationToken cancellationToken = default);
}
