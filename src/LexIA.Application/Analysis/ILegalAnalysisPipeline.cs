using System.Threading;
using System.Threading.Tasks;
using LexIA.Domain.Cases;

namespace LexIA.Application.Analysis;

public interface ILegalAnalysisPipeline
{
    Task<AnalysisResult> ExecuteAsync(
        CaseAggregate caseAggregate,
        string profileId,
        string analysisId,
        string correlationId,
        CancellationToken cancellationToken = default);
}
