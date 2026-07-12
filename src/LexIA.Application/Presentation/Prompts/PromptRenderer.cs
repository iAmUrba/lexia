using System.Text;

namespace LexIA.Application.Presentation.Prompts;

public sealed class PromptRenderer
{
    public string Render(PromptModel model)
    {
        var sb = new StringBuilder();

        sb.AppendLine("=== SYSTEM INSTRUCTIONS ===");
        sb.AppendLine(model.SystemInstructions);
        sb.AppendLine();
        
        sb.AppendLine("=== CONSTRAINTS ===");
        sb.AppendLine(model.Constraints);
        sb.AppendLine();

        sb.AppendLine("=== DECISION ARTIFACT ===");
        sb.AppendLine($"Outcome: {model.Outcome}");
        sb.AppendLine();
        
        sb.AppendLine("Summary Narrative:");
        sb.AppendLine(model.Summary);
        sb.AppendLine();

        sb.AppendLine("Timeline:");
        sb.AppendLine(model.Timeline);
        sb.AppendLine();

        sb.AppendLine("Evidence Tree:");
        sb.AppendLine(model.Evidence);
        sb.AppendLine();

        sb.AppendLine("Legal References:");
        sb.AppendLine(model.LegalReferences);
        sb.AppendLine();

        sb.AppendLine("=== EXPECTED OUTPUT ===");
        sb.AppendLine($"Provide the explanation targeting {model.TargetAudience} strictly following the constraints above.");

        return sb.ToString();
    }
}
