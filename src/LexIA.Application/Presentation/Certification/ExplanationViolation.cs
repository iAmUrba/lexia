namespace LexIA.Application.Presentation.Certification;

public sealed record ExplanationViolation(
    string RuleId,
    string ErrorCode,
    ViolationSeverity Severity,
    string Description
);
