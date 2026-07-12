using System;
using FluentValidation;
using LexIA.Api.Models;

namespace LexIA.Api.Validation;

public class CreateSessionRequestValidator : AbstractValidator<CreateSessionRequest>
{
    public CreateSessionRequestValidator()
    {
        RuleFor(x => x.CaseId).NotEmpty().MaximumLength(100);
        RuleFor(x => x.ProfileId).MaximumLength(100);
    }
}

public class AppendEventRequestValidator : AbstractValidator<AppendEventRequest>
{
    public AppendEventRequestValidator()
    {
        RuleFor(x => x.ProceedingId).NotEmpty().Must(BeAValidGuid).WithMessage("ProceedingId must be a valid GUID");
        RuleFor(x => x.CaseId).NotEmpty().MaximumLength(100);
        RuleFor(x => x.Type).NotEmpty().MaximumLength(10);
        // Allowing a bit of leniency for timezone differences
        RuleFor(x => x.Date).NotEmpty().LessThanOrEqualTo(DateTime.UtcNow.AddDays(1)).WithMessage("Date cannot be in the future");
    }

    private bool BeAValidGuid(string id)
    {
        return Guid.TryParse(id, out _);
    }
}
