using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using LexIA.Application.Presentation.Certification;
using LexIA.Application.Presentation.Generation;
using LexIA.Application.Presentation.Profiles;
using LexIA.Application.Presentation.Prompts;
using LexIA.Domain.Cases;
using LexIA.Domain.Decisions;
using LexIA.Domain.LegalRules;
using LexIA.Domain.LegalRules.Contexts;
using LexIA.Domain.Temporal;
using LexIA.Domain.Proceedings;
using LexIA.Domain.Proceedings.Kinds;

namespace LexIA.Application.Analysis;

public sealed class LegalAnalysisPipeline : ILegalAnalysisPipeline
{
    private readonly RuleEngine<ProceedingRegistrationContext> _ruleEngine;
    private readonly IDeadlineCalculator _deadlineCalculator;
    private readonly DecisionComposer _decisionComposer;
    private readonly PromptBuilder _promptBuilder;
    private readonly IExplanationGenerator _explanationGenerator;
    private readonly ExplanationCertificationEngine _certificationEngine;
    private readonly IExplanationProfile[] _profiles;

    public LegalAnalysisPipeline(
        RuleEngine<ProceedingRegistrationContext> ruleEngine,
        IDeadlineCalculator deadlineCalculator,
        DecisionComposer decisionComposer,
        PromptBuilder promptBuilder,
        IExplanationGenerator explanationGenerator,
        ExplanationCertificationEngine certificationEngine,
        System.Collections.Generic.IEnumerable<IExplanationProfile> profiles)
    {
        _ruleEngine = ruleEngine;
        _deadlineCalculator = deadlineCalculator;
        _decisionComposer = decisionComposer;
        _promptBuilder = promptBuilder;
        _explanationGenerator = explanationGenerator;
        _certificationEngine = certificationEngine;
        _profiles = profiles.ToArray();
    }

    public async Task<AnalysisResult> ExecuteAsync(
        CaseAggregate caseAggregate,
        string profileId,
        string analysisId,
        string correlationId,
        CancellationToken cancellationToken = default)
    {
        // 1. Run Engines
        var state = caseAggregate.CreateSnapshot().State;
        var proceeding = caseAggregate.Proceedings.LastOrDefault();
        var context = proceeding != null
            ? new ProceedingRegistrationContext(state, proceeding.Id, proceeding.Kind, proceeding.Date.Value)
            : new ProceedingRegistrationContext(state, Guid.NewGuid(), ProceedingKind.Unknown, DateTimeOffset.UtcNow);

        var evaluationResult = _ruleEngine.Evaluate(context);
        
        var calendar = new LexIA.Domain.Temporal.BusinessCalendar(
            Array.Empty<DateTimeOffset>(),
            new[] { DayOfWeek.Saturday, DayOfWeek.Sunday },
            TimeSpan.FromHours(8),
            TimeSpan.FromHours(18)
        );

        var termContext = new TermComputationContext(
            new LexIA.Domain.Temporal.Timeline(Array.Empty<LexIA.Domain.Temporal.ITimelineEvent>(), calendar),
            new ProceduralTerm(5, TermUnit.Days, TermNature.Peremptory),
            new LexIA.Domain.Temporal.SystemLegalClock(),
            new CalculationPolicy(
                StartConvention.NextWorkingDay, 
                DayCountingConvention.WorkingDays, 
                HolidayConvention.SkipIfEndsOnHoliday, 
                SuspensionConvention.FreezeClock)
        );
        var temporalResult = _deadlineCalculator.Calculate(termContext);

        var composerContext = new DecisionComposerContext(
            evaluationResult.Evaluations.ToList(),
            temporalResult,
            Array.Empty<LexIA.Domain.Inference.LegalConclusion>()
        );

        var metadata = new DecisionMetadata("1.0.0", DateTimeOffset.UtcNow, new Dictionary<string, string>());

        // 2. Compose Artifact
        var artifact = _decisionComposer.Compose(composerContext, metadata);

        // 3. Resolve Profile
        var profile = _profiles.FirstOrDefault(p => p.ProfileId.Equals(profileId, StringComparison.OrdinalIgnoreCase))
                      ?? _profiles.FirstOrDefault(p => p.ProfileId.Equals("PROF.CITIZEN.001", StringComparison.OrdinalIgnoreCase))
                      ?? _profiles.First();

        // 4. Build Prompt & Generate Explanation
        var prompt = _promptBuilder.Build(artifact, profile);
        var explanationContent = await _explanationGenerator.GenerateAsync(prompt, profile, cancellationToken);
        var explanationResult = new ExplanationResult(
            new ExplanationProfileDescriptor(profile.ProfileId, profile.GetType().Name.Replace("Profile", ""), "en-US", "1.0"),
            explanationContent
        );

        // 5. Certify Explanation
        var certification = _certificationEngine.Certify(artifact, explanationContent);

        // 6. Return Result
        return new AnalysisResult(
            AnalysisId: analysisId,
            CorrelationId: correlationId,
            Artifact: artifact,
            Explanation: explanationResult,
            Certification: certification
        );
    }
}
