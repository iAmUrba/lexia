using System.Linq;
using LexIA.Infrastructure.Configuration;
using LexIA.Infrastructure.Knowledge;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Diagnostics.HealthChecks;

namespace LexIA.Infrastructure.DependencyInjection;

public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddLexIAPlatform(this IServiceCollection services, IConfiguration configuration)
    {
        // 1. Configuration
        var options = new LexIAOptions();
        configuration.GetSection(LexIAOptions.SectionName).Bind(options);
        services.AddSingleton(options);

        // 2. Discover and Register Knowledge
        var catalog = KnowledgeCatalogDiscoverer.Discover();
        services.AddSingleton(catalog);

        // Register all rule implementations as Transient/Singleton (Domain elements are stateless so Singleton is fine, but Transient is safer for pure functions if they had state)
        foreach (var rule in catalog.Rules)
        {
            // We use the first implemented interface that looks like IRule<T>
            var ruleInterface = rule.ImplementationType.GetInterfaces().FirstOrDefault(i => i.IsGenericType && i.GetGenericTypeDefinition() == typeof(LexIA.Domain.SeedWork.Rules.IRule<>));
            if (ruleInterface != null)
            {
                services.AddSingleton(ruleInterface, rule.ImplementationType);
            }
        }

        foreach (var step in catalog.DeadlineSteps)
        {
            services.AddSingleton(typeof(LexIA.Domain.Temporal.IDeadlineStep), step.ImplementationType);
        }

        foreach (var deriv in catalog.Inferences)
        {
            var derivInterface = deriv.ImplementationType.GetInterfaces().FirstOrDefault(i => i.IsGenericType && i.GetGenericTypeDefinition() == typeof(LexIA.Domain.Inference.ILegalDerivation<,>));
            if (derivInterface != null)
            {
                services.AddSingleton(derivInterface, deriv.ImplementationType);
            }
        }

        foreach (var profile in catalog.Profiles)
        {
            services.AddSingleton(typeof(LexIA.Application.Presentation.Profiles.IExplanationProfile), profile.ImplementationType);
        }

        foreach (var explanationRule in catalog.ExplanationRules)
        {
            services.AddSingleton(typeof(LexIA.Application.Presentation.Certification.IExplanationRule), explanationRule.ImplementationType);
        }

        // 3. Register Engines and Application Services
        services.AddSingleton(typeof(LexIA.Domain.LegalRules.RuleEngine<>));
        services.AddSingleton<LexIA.Domain.Temporal.IDeadlineCalculator, LexIA.Domain.Temporal.PipelineDeadlineCalculator>();
        services.AddSingleton<LexIA.Domain.Decisions.DecisionComposer>();
        
        services.AddSingleton<LexIA.Application.Presentation.Certification.ClaimExtractor>();
        services.AddSingleton<LexIA.Application.Presentation.ExplanationValidator>();
        services.AddSingleton<LexIA.Application.Presentation.Prompts.PromptBuilder>();
        services.AddSingleton<LexIA.Application.Presentation.Generation.IExplanationGenerator, LexIA.Application.Presentation.Generation.DeterministicExplanationGenerator>();
        services.AddSingleton<LexIA.Application.Presentation.Certification.ExplanationCertificationEngine>();

        services.AddSingleton<LexIA.Application.Analysis.ILegalAnalysisPipeline, LexIA.Application.Analysis.LegalAnalysisPipeline>();
        services.AddSingleton<LexIA.Application.Analysis.AnalysisOrchestrator>();

        // 3.1. Persistence (InMemory for Sprint 8.1)
        services.AddSingleton<LexIA.Application.Persistence.IEventStore, LexIA.Infrastructure.Persistence.InMemoryEventStore>();
        services.AddSingleton(typeof(LexIA.Application.Persistence.IAggregateRepository<>), typeof(LexIA.Infrastructure.Persistence.InMemoryAggregateRepository<>));
        services.AddSingleton<LexIA.Application.Analysis.IAnalysisSessionRepository, LexIA.Infrastructure.Persistence.InMemorySessionRepository>();

        // 4. Register Health Checks
        services.AddHealthChecks()
            .AddCheck("live", () => HealthCheckResult.Healthy("System is live"))
            .AddCheck("ready", () => HealthCheckResult.Healthy("System is ready"));

        return services;
    }
}
