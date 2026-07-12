using System.Collections.Generic;
using LexIA.Domain.SeedWork.Knowledge;

namespace LexIA.Domain.Capabilities;

public sealed class CivilExecutiveCapabilityModule : ICapabilityModule
{
    public string Area => "Civil";
    public string ProcedureType => "Executive";
    public IReadOnlyList<string> SupportedFeatures => new List<string>
    {
        "Appeal",
        "Notification",
        "Executory",
        "Finality"
    };
}
