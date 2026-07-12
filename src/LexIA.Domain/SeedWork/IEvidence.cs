using System.Collections.Generic;

namespace LexIA.Domain.SeedWork;

public interface IEvidence
{
    string Code { get; }
    string Description { get; }
    IReadOnlyList<IEvidence> SupportingEvidence { get; }
}
