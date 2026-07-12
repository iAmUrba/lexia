namespace LexIA.Domain.SeedWork.Rules;

public sealed record LegalBasis
{
    public string SourceType { get; init; } = string.Empty; // e.g. Law, Decree, Jurisprudence
    public string Source { get; init; } = string.Empty;     // e.g. Civil Code, Constitution
    public string? Article { get; init; }
    public string? Paragraph { get; init; }
    public string? Numeral { get; init; }
    public string? Literal { get; init; }
    public string? Jurisdiction { get; init; }
    public System.DateTimeOffset? EffectiveFrom { get; init; }
    public System.DateTimeOffset? EffectiveTo { get; init; }
    public string Explanation { get; init; } = string.Empty;

    public static LegalBasis Empty => new();
}
