using System.Collections.Generic;
using LexIA.Domain.Decisions;

namespace LexIA.Application.Presentation;

public sealed class ExplanationValidationResult
{
    public bool IsValid { get; }
    public IReadOnlyList<string> Errors { get; }

    public ExplanationValidationResult(bool isValid, IReadOnlyList<string> errors)
    {
        IsValid = isValid;
        Errors = errors;
    }
}

public sealed class ExplanationValidator
{
    public ExplanationValidationResult Validate(ExplanationResponse response, DecisionArtifact originalArtifact)
    {
        var errors = new List<string>();
        var content = response.Content;

        // Validar Fidelidad de Resultado
        // Si el outcome original es Rejected, el texto generado no debería decir que fue Allowed.
        // Esto es una validación simplista, en producción podría ser heurística o usando un NLP ligero.
        if (originalArtifact.Report.Outcome == DecisionOutcome.Rejected && content.Contains("Allowed", System.StringComparison.OrdinalIgnoreCase))
        {
            errors.Add("Fidelity Error: Generated explanation implies 'Allowed' but canonical outcome is 'Rejected'.");
        }

        if (originalArtifact.Report.Outcome == DecisionOutcome.Allowed && content.Contains("Rejected", System.StringComparison.OrdinalIgnoreCase))
        {
            errors.Add("Fidelity Error: Generated explanation implies 'Rejected' but canonical outcome is 'Allowed'.");
        }

        return new ExplanationValidationResult(errors.Count == 0, errors);
    }
}
