namespace LexIA.Domain.Parties;

public sealed record PartyRole(string Name)
{
    public static readonly PartyRole Plaintiff = new("Actor/Demandante");
    public static readonly PartyRole Defendant = new("Demandado");
    public static readonly PartyRole ThirdParty = new("Tercero Interesado");
    public static readonly PartyRole PublicProsecutor = new("Ministerio Público");

    public override string ToString() => Name;
}
