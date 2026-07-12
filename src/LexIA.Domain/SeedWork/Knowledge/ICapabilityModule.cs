using System.Collections.Generic;

namespace LexIA.Domain.SeedWork.Knowledge;

public interface ICapabilityModule
{
    string Area { get; }
    string ProcedureType { get; }
    IReadOnlyList<string> SupportedFeatures { get; }
}
