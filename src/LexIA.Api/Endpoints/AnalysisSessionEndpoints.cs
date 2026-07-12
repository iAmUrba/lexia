using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using LexIA.Api.Models;
using LexIA.Application.Analysis;
using LexIA.Domain.Proceedings;
using LexIA.Domain.Proceedings.ValueObjects;
using LexIA.Domain.SeedWork;
using LexIA.Infrastructure.Knowledge;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using FluentValidation;

namespace LexIA.Api.Endpoints;

public static class AnalysisSessionEndpoints
{
    public static void MapAnalysisSessionEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/v1/analysis-sessions")
            .WithTags("Analysis Sessions");

        group.MapPost("/", CreateSession)
            .Produces<Envelope<AnalysisSession>>(StatusCodes.Status202Accepted)
            .Produces<Microsoft.AspNetCore.Mvc.ProblemDetails>(StatusCodes.Status400BadRequest);

        group.MapGet("/{id}", GetSessionStatus)
            .Produces<Envelope<AnalysisSession>>(StatusCodes.Status200OK)
            .Produces<Microsoft.AspNetCore.Mvc.ProblemDetails>(StatusCodes.Status404NotFound);

        group.MapPost("/{id}/events", AppendEvents)
            .Produces(StatusCodes.Status202Accepted)
            .Produces<Microsoft.AspNetCore.Mvc.ProblemDetails>(StatusCodes.Status400BadRequest)
            .Produces<Microsoft.AspNetCore.Mvc.ProblemDetails>(StatusCodes.Status404NotFound)
            .Produces<Microsoft.AspNetCore.Mvc.ProblemDetails>(StatusCodes.Status409Conflict);

        group.MapPost("/{id}/analyze", Analyze)
            .Produces<Envelope<AnalysisResult>>(StatusCodes.Status200OK) // if completed
            .Produces(StatusCodes.Status202Accepted) // if analyzing
            .Produces<Microsoft.AspNetCore.Mvc.ProblemDetails>(StatusCodes.Status404NotFound)
            .Produces<Microsoft.AspNetCore.Mvc.ProblemDetails>(StatusCodes.Status409Conflict);

        group.MapGet("/{id}/result", GetResult)
            .Produces<Envelope<AnalysisResult>>(StatusCodes.Status200OK)
            .Produces<Microsoft.AspNetCore.Mvc.ProblemDetails>(StatusCodes.Status404NotFound);

        app.MapGet("/api/v1/capabilities", GetCapabilities)
            .WithTags("System")
            .Produces<Envelope<IReadOnlyList<CapabilityDescriptor>>>(StatusCodes.Status200OK);
    }

    private static Envelope<T> Wrap<T>(T data, HttpContext context)
    {
        return new Envelope<T>
        {
            Meta = new EnvelopeMeta
            {
                CorrelationId = context.TraceIdentifier,
                ApiVersion = "1.0",
                GeneratedAt = System.DateTimeOffset.UtcNow
            },
            Data = data
        };
    }

    private static async Task<IResult> CreateSession(
        CreateSessionRequest request,
        IValidator<CreateSessionRequest> validator,
        AnalysisOrchestrator orchestrator,
        HttpContext context)
    {
        var validationResult = await validator.ValidateAsync(request);
        if (!validationResult.IsValid)
        {
            return Results.ValidationProblem(validationResult.ToDictionary());
        }

        var session = await orchestrator.CreateSessionAsync(request.CaseId);
        return Results.Accepted($"/api/v1/analysis-sessions/{session.SessionId}", Wrap(session, context));
    }

    private static async Task<IResult> GetSessionStatus(string id, IAnalysisSessionRepository repository, HttpContext context)
    {
        var session = await repository.GetByIdAsync(id);
        if (session == null) throw new System.Collections.Generic.KeyNotFoundException("Session not found");
        return Results.Ok(Wrap(session, context));
    }

    private static async Task<IResult> AppendEvents(
        string id, 
        AppendEventRequest request, 
        IValidator<AppendEventRequest> validator,
        AnalysisOrchestrator orchestrator)
    {
        var validationResult = await validator.ValidateAsync(request);
        if (!validationResult.IsValid)
        {
            return Results.ValidationProblem(validationResult.ToDictionary());
        }

        var command = new AppendEventCommand(
            request.ProceedingId,
            request.CaseId,
            request.Type,
            request.Date);

        await orchestrator.AppendEventsAsync(id, new[] { command });
        return Results.Accepted();
    }

    private static async Task<IResult> Analyze(string id, HttpContext context, AnalysisOrchestrator orchestrator)
    {
        var correlationId = context.TraceIdentifier;
        var result = await orchestrator.AnalyzeAsync(id, "CitizenProfile", correlationId);
        
        if (result == null)
        {
            return Results.Accepted($"/api/v1/analysis-sessions/{id}/result");
        }
        
        return Results.Ok(Wrap(result, context));
    }

    private static async Task<IResult> GetResult(string id, AnalysisOrchestrator orchestrator, HttpContext context)
    {
        var result = await orchestrator.GetResultAsync(id);
        if (result == null) throw new System.Collections.Generic.KeyNotFoundException("Result not found or not completed");
        return Results.Ok(Wrap(result, context));
    }

    private static IResult GetCapabilities(KnowledgeCatalog catalog, HttpContext context)
    {
        return Results.Ok(Wrap(catalog.Capabilities, context));
    }
}
