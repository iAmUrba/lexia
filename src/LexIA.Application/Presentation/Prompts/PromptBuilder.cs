using System;
using System.Linq;
using LexIA.Domain.Decisions;
using LexIA.Application.Presentation.Profiles;
using System.Text.Json;

namespace LexIA.Application.Presentation.Prompts;

public sealed class PromptBuilder
{
    public PromptModel Build(DecisionArtifact artifact, IExplanationProfile profile)
    {
        var instructions = $"Act as a redaction engine. You are explaining a legal decision to a {profile.TargetAudience}. Tone should be: {profile.Tone}. Detail level: {profile.DetailLevel}. {profile.SpecificInstructions}";
        
        var constraints = @"
CRITICAL RULES:
1. No determines el resultado.
2. No alteres el Outcome.
3. No cites normas inexistentes.
4. No completes información faltante. Si falta información, indica expresamente que no fue proporcionada por el DecisionArtifact.
5. Nunca contradigas el EvidenceTree.
6. Nunca elimines advertencias explícitas.
7. No cambies el Timeline.
8. No reordenes hechos cronológicos.
9. No infieras recursos, notificaciones, plazos ni estados procesales que no estén en el artefacto.
";

        var outcome = artifact.Report.Outcome.ToString();
        var summary = JsonSerializer.Serialize(artifact.Report.Narrative);
        
        var timeline = profile.IncludeTimeline && artifact.Timeline != null 
            ? JsonSerializer.Serialize(artifact.Timeline.Nodes) 
            : "Timeline not required for this profile.";

        var evidence = profile.IncludeEvidenceTree && artifact.EvidenceTree != null
            ? JsonSerializer.Serialize(artifact.EvidenceTree)
            : "Evidence tree not required for this profile.";

        var legalReferences = profile.IncludeLegalBasis && artifact.LegalReferences.Any()
            ? string.Join(", ", artifact.LegalReferences)
            : "Legal references not required for this profile.";

        return new PromptModel(
            instructions,
            profile.TargetAudience,
            constraints,
            outcome,
            summary,
            timeline,
            evidence,
            legalReferences
        );
    }
}
