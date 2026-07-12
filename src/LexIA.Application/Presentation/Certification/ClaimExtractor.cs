using System;
using System.Collections.Generic;
using System.Text.RegularExpressions;

namespace LexIA.Application.Presentation.Certification;

public sealed class ClaimExtractor
{
    // Common date patterns: YYYY-MM-DD, DD/MM/YYYY, etc.
    private static readonly Regex DateRegex = new Regex(@"\b(\d{4}-\d{2}-\d{2}|\d{2}/\d{2}/\d{4}|\d{1,2}\s+de\s+[a-z]+\s+de\s+\d{4})\b", RegexOptions.IgnoreCase | RegexOptions.Compiled);
    
    // Article patterns: Art. 32, Artículo 32, Art 32
    private static readonly Regex ArticleRegex = new Regex(@"\b(?:art\.|artículo|art)\s*(\d+[a-z]?)\b", RegexOptions.IgnoreCase | RegexOptions.Compiled);
    
    // Forbidden words
    private static readonly string[] ForbiddenPhrases = { "seguramente", "es posible que", "probablemente", "la ley presume" };

    // Outcome hints
    private static readonly string[] ApprovedHints = { "procede el recurso", "se admite", "aprobado", "concedido" };
    private static readonly string[] RejectedHints = { "se rechaza", "no procede", "inadmisible", "denegado", "extemporáneo" };

    public IReadOnlyList<ExplanationClaim> ExtractClaims(string text)
    {
        var claims = new List<ExplanationClaim>();
        if (string.IsNullOrWhiteSpace(text)) return claims;

        // 1. Extract Dates
        var dateMatches = DateRegex.Matches(text);
        foreach (Match match in dateMatches)
        {
            if (TryParseSpanishDate(match.Value, out var date))
            {
                claims.Add(new TimelineClaim(match.Value, date));
            }
        }

        // 2. Extract Legal Basis
        var articleMatches = ArticleRegex.Matches(text);
        foreach (Match match in articleMatches)
        {
            var articleNum = match.Groups[1].Value;
            claims.Add(new LegalBasisClaim(match.Value, articleNum));
        }

        // 3. Extract Forbidden Claims
        var lowerText = text.ToLowerInvariant();
        foreach (var phrase in ForbiddenPhrases)
        {
            if (lowerText.Contains(phrase))
            {
                // We'll just pass the phrase as rawText
                claims.Add(new ForbiddenClaim(phrase, phrase));
            }
        }

        // 4. Extract Outcome Claims
        foreach (var hint in ApprovedHints)
        {
            if (lowerText.Contains(hint))
            {
                claims.Add(new OutcomeClaim(hint, "Approved"));
            }
        }
        foreach (var hint in RejectedHints)
        {
            if (lowerText.Contains(hint))
            {
                claims.Add(new OutcomeClaim(hint, "Rejected"));
            }
        }

        return claims;
    }

    private bool TryParseSpanishDate(string text, out DateTimeOffset date)
    {
        // For simplicity in the MVP, we just use standard parsing. 
        // In reality, a custom TryParse or multiple formats might be needed.
        if (DateTimeOffset.TryParse(text, out date))
        {
            return true;
        }

        // Extremely simple fallback for "12 de mayo de 2026"
        var normalized = text.ToLowerInvariant()
            .Replace(" de ", "-")
            .Replace("enero", "01").Replace("febrero", "02").Replace("marzo", "03").Replace("abril", "04")
            .Replace("mayo", "05").Replace("junio", "06").Replace("julio", "07").Replace("agosto", "08")
            .Replace("septiembre", "09").Replace("octubre", "10").Replace("noviembre", "11").Replace("diciembre", "12");
        
        return DateTimeOffset.TryParse(normalized, out date);
    }
}
