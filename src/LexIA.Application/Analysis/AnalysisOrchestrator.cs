using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using LexIA.Application.Persistence;
using LexIA.Domain.Cases;
using LexIA.Domain.SeedWork;

namespace LexIA.Application.Analysis;

public sealed class AnalysisOrchestrator
{
    private readonly IAnalysisSessionRepository _sessionRepository;
    private readonly IAggregateRepository<CaseAggregate> _caseRepository;
    private readonly ILegalAnalysisPipeline _pipeline;

    public AnalysisOrchestrator(
        IAnalysisSessionRepository sessionRepository,
        IAggregateRepository<CaseAggregate> caseRepository,
        ILegalAnalysisPipeline pipeline)
    {
        _sessionRepository = sessionRepository;
        _caseRepository = caseRepository;
        _pipeline = pipeline;
    }

    public async Task<AnalysisSession> CreateSessionAsync(string caseId)
    {
        var session = new AnalysisSession { CaseId = caseId };
        await _sessionRepository.SaveAsync(session);

        // Ensure case exists
        var caseAggregate = await _caseRepository.GetAsync(new AggregateId(caseId));
        if (caseAggregate == null)
        {
            // Initializing new case aggregate
            caseAggregate = new CaseAggregate(caseId);
            caseAggregate.Open(Guid.NewGuid().ToString(), caseId);
            await _caseRepository.SaveAsync(caseAggregate);
        }

        return session;
    }

    public async Task AppendEventsAsync(string sessionId, IEnumerable<AppendEventCommand> events)
    {
        var session = await _sessionRepository.GetByIdAsync(sessionId);
        if (session == null) throw new InvalidOperationException("Session not found");
        if (session.Status != AnalysisSessionStatus.Created && 
            session.Status != AnalysisSessionStatus.EventsAccepted && 
            session.Status != AnalysisSessionStatus.ReadyForAnalysis) 
        {
            throw new InvalidOperationException("Session is already analyzing or completed");
        }
        
        if (session.Status == AnalysisSessionStatus.Created)
        {
            session.Status = AnalysisSessionStatus.EventsAccepted;
        }

        var caseAggregate = await _caseRepository.GetAsync(new AggregateId(session.CaseId));
        if (caseAggregate == null) throw new InvalidOperationException("Case not found");

        var caseOpeningDate = new LexIA.Domain.Proceedings.ValueObjects.CaseOpeningDate(DateTimeOffset.MinValue);

        foreach (var evt in events)
        {
            var proceedingDate = new LexIA.Domain.Proceedings.ValueObjects.ProceedingDate(evt.Date, caseOpeningDate);
            var domainEvent = new LexIA.Domain.Proceedings.ProceedingRegistered(
                Guid.Parse(evt.ProceedingId),
                evt.CaseId,
                evt.Type,
                proceedingDate);

            // We use reflection to call Apply Event because CaseAggregate expects specific events
            // In a real CQRS system, you might route these via commands
            var applyMethod = caseAggregate.GetType().GetMethod("ApplyEvent", System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance, null, new[] { domainEvent.GetType() }, null);
            if (applyMethod != null)
            {
                applyMethod.Invoke(caseAggregate, new object[] { domainEvent });
            }
        }

        await _caseRepository.SaveAsync(caseAggregate);
    }

    public async Task<AnalysisResult?> AnalyzeAsync(string sessionId, string profileId, string correlationId, CancellationToken cancellationToken = default)
    {
        var session = await _sessionRepository.GetByIdAsync(sessionId);
        if (session == null) throw new InvalidOperationException("Session not found");
        
        if (session.Status == AnalysisSessionStatus.Failed) throw new InvalidOperationException("Session failed");
        if (session.Status == AnalysisSessionStatus.Completed) return await GetResultAsync(sessionId);
        if (session.Status == AnalysisSessionStatus.Analyzing) return null; // Indicator to return 202
        if (session.Status != AnalysisSessionStatus.Created &&
            session.Status != AnalysisSessionStatus.EventsAccepted &&
            session.Status != AnalysisSessionStatus.ReadyForAnalysis)
        {
            throw new InvalidOperationException($"Invalid state transition from {session.Status} to Analyzing");
        }

        var caseAggregate = await _caseRepository.GetAsync(new AggregateId(session.CaseId));
        if (caseAggregate == null) throw new InvalidOperationException("Case not found");

        var analysisId = Guid.NewGuid().ToString();
        session.MarkAsAnalyzing(analysisId);
        await _sessionRepository.SaveAsync(session);

        try
        {
            var result = await _pipeline.ExecuteAsync(caseAggregate, profileId, analysisId, correlationId, cancellationToken);
            await _sessionRepository.SaveResultAsync(result);

            session.MarkAsCompleted();
            await _sessionRepository.SaveAsync(session);

            return result;
        }
        catch (Exception)
        {
            session.MarkAsFailed();
            await _sessionRepository.SaveAsync(session);
            throw;
        }
    }

    public async Task<AnalysisResult?> GetResultAsync(string sessionId)
    {
        var session = await _sessionRepository.GetByIdAsync(sessionId);
        if (session == null || session.CurrentAnalysisId == null) return null;
        return await _sessionRepository.GetResultAsync(session.CurrentAnalysisId);
    }
}
