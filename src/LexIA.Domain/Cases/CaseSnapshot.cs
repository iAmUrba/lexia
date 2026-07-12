using System;
using System.Collections.Generic;
using System.Linq;
using LexIA.Domain.Proceedings;

namespace LexIA.Domain.Cases;

public class CaseSnapshot
{
    public long Version { get; init; }
    public CaseState State { get; init; } = default!;
}
