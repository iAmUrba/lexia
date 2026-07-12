using System;
using LexIA.Domain.SeedWork;

namespace LexIA.Domain.Decisions;

public sealed record TimelineNode(
    DateTimeOffset Date,
    string Title,
    string Description,
    string Icon,
    IEvidence? Evidence
);
