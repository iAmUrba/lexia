using System;
using System.Collections.Generic;
using System.Linq;
using System.Reflection;
using LexIA.Application.Presentation.Certification;
using LexIA.Application.Presentation.Profiles;
using LexIA.Domain.Decisions;
using LexIA.Domain.Inference;
using LexIA.Domain.LegalRules.Contexts;
using LexIA.Domain.SeedWork;
using LexIA.Domain.SeedWork.Rules;
using LexIA.Domain.Temporal;

namespace LexIA.Infrastructure.Knowledge;

public static class KnowledgeCatalogDiscoverer
{
    public static KnowledgeCatalog Discover()
    {
        var domainAssembly = typeof(IRule<>).Assembly;
        var appAssembly = typeof(IExplanationRule).Assembly;
        
        var assemblies = new List<string> 
        { 
            domainAssembly.GetName().Name ?? "LexIA.Domain", 
            appAssembly.GetName().Name ?? "LexIA.Application" 
        };
        var version = domainAssembly.GetName().Version?.ToString() ?? "1.0.0.0";

        return new KnowledgeCatalog(
            Version: version,
            GeneratedAt: DateTimeOffset.UtcNow,
            Assemblies: assemblies,
            Capabilities: DiscoverCapabilities(domainAssembly),
            Rules: DiscoverRules(domainAssembly),
            DeadlineSteps: DiscoverDeadlineSteps(domainAssembly),
            Inferences: DiscoverInferences(domainAssembly),
            Outcomes: DiscoverOutcomes(),
            ExplanationRules: DiscoverExplanationRules(appAssembly),
            Profiles: DiscoverProfiles(appAssembly)
        );
    }
    
    private static IReadOnlyList<CapabilityDescriptor> DiscoverCapabilities(Assembly assembly)
    {
        var capabilities = new List<CapabilityDescriptor>();
        var capabilityTypes = assembly.GetTypes()
            .Where(t => t.IsClass && !t.IsAbstract && typeof(LexIA.Domain.SeedWork.Knowledge.ICapabilityModule).IsAssignableFrom(t));

        foreach (var type in capabilityTypes)
        {
            try
            {
                var instance = Activator.CreateInstance(type) as LexIA.Domain.SeedWork.Knowledge.ICapabilityModule;
                if (instance != null)
                {
                    capabilities.Add(new CapabilityDescriptor(
                        instance.Area, 
                        instance.ProcedureType, 
                        instance.SupportedFeatures, 
                        type));
                }
            }
            catch { }
        }
        return capabilities;
    }

    private static IReadOnlyList<string> GetRequirements(Type type)
    {
        return type.GetCustomAttributes(typeof(RequirementAttribute), false)
                   .Cast<RequirementAttribute>()
                   .Select(a => a.RequirementId)
                   .ToList();
    }

    private static IReadOnlyList<RuleDescriptor> DiscoverRules(Assembly assembly)
    {
        var rules = new List<RuleDescriptor>();
        // Simple heuristic: instances of classes that implement IRule<T>
        var ruleTypes = assembly.GetTypes()
            .Where(t => t.IsClass && !t.IsAbstract && 
                        t.GetInterfaces().Any(i => i.IsGenericType && i.GetGenericTypeDefinition() == typeof(IRule<>)));

        foreach (var type in ruleTypes)
        {
            try
            {
                var instance = Activator.CreateInstance(type);
                var ruleIdProp = type.GetProperty("RuleId");
                var ruleNameProp = type.GetProperty("RuleName");
                if (ruleIdProp != null && ruleNameProp != null)
                {
                    var id = ruleIdProp.GetValue(instance) as string;
                    var name = ruleNameProp.GetValue(instance) as string;
                    if (id != null && name != null)
                    {
                        rules.Add(new RuleDescriptor(id, name, type, GetRequirements(type)));
                    }
                }
            }
            catch { /* Skip classes without parameterless constructors if any */ }
        }
        return rules;
    }

    private static IReadOnlyList<DeadlineDescriptor> DiscoverDeadlineSteps(Assembly assembly)
    {
        var steps = new List<DeadlineDescriptor>();
        var stepTypes = assembly.GetTypes()
            .Where(t => t.IsClass && !t.IsAbstract && typeof(IDeadlineStep).IsAssignableFrom(t));

        foreach (var type in stepTypes)
        {
            try
            {
                var instance = Activator.CreateInstance(type);
                var stepIdProp = type.GetProperty("StepId");
                if (stepIdProp != null)
                {
                    var id = stepIdProp.GetValue(instance) as string;
                    if (id != null)
                    {
                        steps.Add(new DeadlineDescriptor(id, type.Name, type, GetRequirements(type)));
                    }
                }
            }
            catch { }
        }
        return steps;
    }

    private static IReadOnlyList<InferenceDescriptor> DiscoverInferences(Assembly assembly)
    {
        var inferences = new List<InferenceDescriptor>();
        var derivTypes = assembly.GetTypes()
            .Where(t => t.IsClass && !t.IsAbstract && 
                        t.GetInterfaces().Any(i => i.IsGenericType && i.GetGenericTypeDefinition() == typeof(ILegalDerivation<,>)));

        foreach (var type in derivTypes)
        {
            try
            {
                var instance = Activator.CreateInstance(type);
                var derivIdProp = type.GetProperty("DerivationId");
                if (derivIdProp != null)
                {
                    var id = derivIdProp.GetValue(instance) as string;
                    if (id != null)
                    {
                        inferences.Add(new InferenceDescriptor(id, type.Name, type, GetRequirements(type)));
                    }
                }
            }
            catch { }
        }
        return inferences;
    }

    private static IReadOnlyList<DecisionOutcomeDescriptor> DiscoverOutcomes()
    {
        return Enum.GetNames(typeof(DecisionOutcome))
            .Select(name => new DecisionOutcomeDescriptor(name))
            .ToList();
    }

    private static IReadOnlyList<ExplanationRuleDescriptor> DiscoverExplanationRules(Assembly assembly)
    {
        var rules = new List<ExplanationRuleDescriptor>();
        var ruleTypes = assembly.GetTypes()
            .Where(t => t.IsClass && !t.IsAbstract && typeof(IExplanationRule).IsAssignableFrom(t));

        foreach (var type in ruleTypes)
        {
            try
            {
                var instance = Activator.CreateInstance(type);
                var ruleIdProp = type.GetProperty("RuleId");
                if (ruleIdProp != null)
                {
                    var id = ruleIdProp.GetValue(instance) as string;
                    if (id != null)
                    {
                        rules.Add(new ExplanationRuleDescriptor(id, type.Name, type, GetRequirements(type)));
                    }
                }
            }
            catch { }
        }
        return rules;
    }

    private static IReadOnlyList<ProfileDescriptor> DiscoverProfiles(Assembly assembly)
    {
        var profiles = new List<ProfileDescriptor>();
        var profileTypes = assembly.GetTypes()
            .Where(t => t.IsClass && !t.IsAbstract && typeof(IExplanationProfile).IsAssignableFrom(t));

        foreach (var type in profileTypes)
        {
            try
            {
                var instance = Activator.CreateInstance(type);
                var profileIdProp = type.GetProperty("ProfileId");
                if (profileIdProp != null)
                {
                    var id = profileIdProp.GetValue(instance) as string;
                    if (id != null)
                    {
                        profiles.Add(new ProfileDescriptor(id, type.Name, type, GetRequirements(type)));
                    }
                }
            }
            catch { }
        }
        return profiles;
    }
}
