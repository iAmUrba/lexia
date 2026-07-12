namespace LexIA.Application.Analysis;

public enum AnalysisSessionStatus
{
    Created = 0,
    EventsAccepted = 1,
    ReadyForAnalysis = 2,
    Analyzing = 3,
    Completed = 4,
    Failed = 5,
    Archived = 6
}
