using System;

namespace LexIA.Application.Analysis;

public sealed class AnalysisSession
{
    public string SessionId { get; init; } = Guid.NewGuid().ToString();
    public string CaseId { get; init; } = string.Empty;
    public AnalysisSessionStatus Status { get; set; } = AnalysisSessionStatus.Created;
    public string? CurrentAnalysisId { get; set; }
    
    public DateTimeOffset StartedAt { get; init; } = DateTimeOffset.UtcNow;
    public DateTimeOffset? CompletedAt { get; set; }
    
    public int Version { get; set; } = 0;

    public void MarkAsAnalyzing(string analysisId)
    {
        Status = AnalysisSessionStatus.Analyzing;
        CurrentAnalysisId = analysisId;
    }

    public void MarkAsCompleted()
    {
        Status = AnalysisSessionStatus.Completed;
        CompletedAt = DateTimeOffset.UtcNow;
    }

    public void MarkAsFailed()
    {
        Status = AnalysisSessionStatus.Failed;
        CompletedAt = DateTimeOffset.UtcNow;
    }
}
