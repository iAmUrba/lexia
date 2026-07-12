using System;

namespace LexIA.Domain.SeedWork;

[AttributeUsage(AttributeTargets.Class, AllowMultiple = true, Inherited = false)]
public sealed class RequirementAttribute : Attribute
{
    public string RequirementId { get; }

    public RequirementAttribute(string requirementId)
    {
        if (string.IsNullOrWhiteSpace(requirementId))
            throw new ArgumentException("RequirementId cannot be null or whitespace.", nameof(requirementId));
            
        RequirementId = requirementId;
    }
}
