namespace LexIA.Domain.Proceedings.Kinds;

public sealed record ProcedureType(string Name)
{
    public static readonly ProcedureType Ordinary = new("Ordinario");
    public static readonly ProcedureType Summary = new("Sumario");
    public static readonly ProcedureType Executive = new("Ejecutivo");
    public static readonly ProcedureType Constitutional = new("Constitucional");

    public override string ToString() => Name;
}
