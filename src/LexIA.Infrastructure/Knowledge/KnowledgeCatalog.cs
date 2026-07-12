using System;

namespace LexIA.Infrastructure.Knowledge;

public sealed record RuleDescriptor(string RuleId, string Name, Type ImplementationType, IReadOnlyList<string> Requirements);
public sealed record DeadlineDescriptor(string StepId, string Name, Type ImplementationType, IReadOnlyList<string> Requirements);
public sealed record InferenceDescriptor(string DerivationId, string Name, Type ImplementationType, IReadOnlyList<string> Requirements);
public sealed record DecisionOutcomeDescriptor(string OutcomeCode);
public sealed record ExplanationRuleDescriptor(string RuleId, string Name, Type ImplementationType, IReadOnlyList<string> Requirements);
public sealed record ProfileDescriptor(string ProfileId, string Name, Type ImplementationType, IReadOnlyList<string> Requirements);

public sealed record CapabilityDescriptor(string Area, string ProcedureType, IReadOnlyList<string> SupportedFeatures, Type ImplementationType);

public sealed record KnowledgeCatalog(
    string Version,
    DateTimeOffset GeneratedAt,
    IReadOnlyList<string> Assemblies,
    IReadOnlyList<CapabilityDescriptor> Capabilities,
    IReadOnlyList<RuleDescriptor> Rules,
    IReadOnlyList<DeadlineDescriptor> DeadlineSteps,
    IReadOnlyList<InferenceDescriptor> Inferences,
    IReadOnlyList<DecisionOutcomeDescriptor> Outcomes,
    IReadOnlyList<ExplanationRuleDescriptor> ExplanationRules,
    IReadOnlyList<ProfileDescriptor> Profiles
);
