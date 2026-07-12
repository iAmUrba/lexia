namespace LexIA.Application.Presentation.Profiles;

public interface IExplanationProfile
{
    string ProfileId { get; }
    string TargetAudience { get; }
    string Tone { get; }
    string DetailLevel { get; }
    bool IncludeLegalBasis { get; }
    bool IncludeEvidenceTree { get; }
    bool IncludeTimeline { get; }
    string SpecificInstructions { get; }
}

[LexIA.Domain.SeedWork.Requirement("REQ-CIV-008")]
public sealed record CitizenProfile : IExplanationProfile
{
    public string ProfileId => "PROF.CITIZEN.001";
    public string TargetAudience => "Citizen without legal background";
    public string Tone => "Empathetic, clear, and direct";
    public string DetailLevel => "High level, focusing on practical implications";
    public bool IncludeLegalBasis => false;
    public bool IncludeEvidenceTree => false;
    public bool IncludeTimeline => true;
    public string SpecificInstructions => "Avoid complex legal jargon. Explain the timeline steps simply. Focus on what this means for the citizen's case.";
}

public sealed record LawyerProfile : IExplanationProfile
{
    public string ProfileId => "PROF.LAWYER.001";
    public string TargetAudience => "Lawyer or Legal Professional";
    public string Tone => "Professional, objective, and precise";
    public string DetailLevel => "Exhaustive detail";
    public bool IncludeLegalBasis => true;
    public bool IncludeEvidenceTree => true;
    public bool IncludeTimeline => true;
    public string SpecificInstructions => "Use precise legal terminology. Cite all legal bases. Ensure the evidence tree is fully documented. Provide strict procedural reasoning.";
}

public sealed record SummaryProfile : IExplanationProfile
{
    public string ProfileId => "PROF.SUMMARY.001";
    public string TargetAudience => "Executive or API Integration";
    public string Tone => "Neutral, succinct, and factual";
    public string DetailLevel => "Minimal, bottom-line only";
    public bool IncludeLegalBasis => false;
    public bool IncludeEvidenceTree => false;
    public bool IncludeTimeline => false;
    public string SpecificInstructions => "Provide a 2-sentence maximum summary. Focus exclusively on the final outcome and the immediate next step.";
}
