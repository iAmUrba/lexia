using System;

namespace LexIA.Application.Presentation.Certification;

public abstract record ExplanationClaim(string RawText);

public sealed record OutcomeClaim(string RawText, string NormalizedOutcome) : ExplanationClaim(RawText);

public sealed record TimelineClaim(string RawText, DateTimeOffset Date) : ExplanationClaim(RawText);

public sealed record LegalBasisClaim(string RawText, string Article) : ExplanationClaim(RawText);

public sealed record ForbiddenClaim(string RawText, string Keyword) : ExplanationClaim(RawText);
