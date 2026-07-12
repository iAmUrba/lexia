using System.Threading.Tasks;

namespace LexIA.Application.Analysis;

public interface IAnalysisSessionRepository
{
    Task<AnalysisSession?> GetByIdAsync(string sessionId);
    Task SaveAsync(AnalysisSession session);
    Task SaveResultAsync(AnalysisResult result);
    Task<AnalysisResult?> GetResultAsync(string analysisId);
}
