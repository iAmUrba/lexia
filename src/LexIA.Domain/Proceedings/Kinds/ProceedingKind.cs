using System;

namespace LexIA.Domain.Proceedings.Kinds;

public sealed record ProceedingKind
{
    public string Code { get; }
    public string Name { get; }

    private ProceedingKind(string code, string name)
    {
        Code = code;
        Name = name;
    }

    // Catálogo
    public static readonly ProceedingKind Filing = new("FIL", "Filing");
    public static readonly ProceedingKind Resolution = new("RES", "Resolution");
    public static readonly ProceedingKind Appeal = new("APP", "Appeal");
    public static readonly ProceedingKind Notification = new("NOT", "Notification");
    
    // Default o desconocido
    public static readonly ProceedingKind Unknown = new("UNK", "Unknown");

    // Métodos semánticos para reglas
    public bool IsResolution() => Code == Resolution.Code;
    public bool IsAppeal() => Code == Appeal.Code;
    public bool IsFiling() => Code == Filing.Code;
    public bool IsNotification() => Code == Notification.Code;

    // Factory method (por ejemplo para rehidratar desde eventos)
    public static ProceedingKind FromCode(string code)
    {
        return code switch
        {
            "FIL" => Filing,
            "RES" => Resolution,
            "APP" => Appeal,
            "NOT" => Notification,
            _ => new ProceedingKind(code, "Custom/Unknown")
        };
    }

    public override string ToString() => Name;
}
