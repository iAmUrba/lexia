using LexIA.Api.Endpoints;
using LexIA.Infrastructure.DependencyInjection;
using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using OpenTelemetry.Metrics;
using OpenTelemetry.Resources;
using OpenTelemetry.Trace;
using Serilog;
using Serilog.Events;
using FluentValidation;

var builder = WebApplication.CreateBuilder(args);

// Configure Serilog
Log.Logger = new LoggerConfiguration()
    .MinimumLevel.Override("Microsoft", LogEventLevel.Information)
    .Enrich.FromLogContext()
    .WriteTo.Console()
    .CreateLogger();
builder.Host.UseSerilog();

var serviceName = "LexIA.Api";
var serviceVersion = "1.0.0";

// Configure OpenTelemetry
builder.Services.AddOpenTelemetry()
    .ConfigureResource(resource => resource.AddService(serviceName, serviceVersion))
    .WithTracing(tracing => tracing
        .AddAspNetCoreInstrumentation()
        .AddHttpClientInstrumentation()
        .AddConsoleExporter())
    .WithMetrics(metrics => metrics
        .AddAspNetCoreInstrumentation()
        .AddHttpClientInstrumentation()
        .AddConsoleExporter());

// Configure JSON Options
builder.Services.ConfigureHttpJsonOptions(options =>
{
    options.SerializerOptions.Converters.Add(new System.Text.Json.Serialization.JsonStringEnumConverter());
});

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    var xmlFile = $"{System.Reflection.Assembly.GetExecutingAssembly().GetName().Name}.xml";
    var xmlPath = System.IO.Path.Combine(System.AppContext.BaseDirectory, xmlFile);
    if (System.IO.File.Exists(xmlPath))
    {
        c.IncludeXmlComments(xmlPath);
    }
});
builder.Services.AddProblemDetails();
builder.Services.AddExceptionHandler<LexIA.Api.Middleware.GlobalExceptionHandler>();

// Add FluentValidation
builder.Services.AddValidatorsFromAssemblyContaining<LexIA.Api.Models.CreateSessionRequest>();

// Add Infrastructure & Domain
builder.Services.AddLexIAPlatform(builder.Configuration);

var app = builder.Build();

app.UseSerilogRequestLogging();

// Correlation ID Middleware
app.Use(async (context, next) =>
{
    var correlationId = context.Request.Headers["X-Correlation-Id"].ToString();
    if (string.IsNullOrEmpty(correlationId))
    {
        correlationId = System.Guid.NewGuid().ToString();
    }
    context.TraceIdentifier = correlationId;
    context.Response.Headers["X-Correlation-Id"] = correlationId;
    
    using (Serilog.Context.LogContext.PushProperty("CorrelationId", correlationId))
    {
        await next();
    }
});

app.UseSwagger();
app.UseSwaggerUI();

app.UseExceptionHandler();

app.MapHealthChecks("/health/live");
app.MapHealthChecks("/health/ready");

app.MapAnalysisSessionEndpoints();

app.Run();

public partial class Program { } // Marker for WebApplicationFactory
