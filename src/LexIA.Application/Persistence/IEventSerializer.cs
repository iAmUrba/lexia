using LexIA.Domain.SeedWork;

namespace LexIA.Application.Persistence;

public interface IEventSerializer
{
    string SerializeEvent(IDomainEvent @event);
    IDomainEvent DeserializeEvent(string typeName, string payload);
    
    string SerializeMetadata(EventMetadata metadata);
    EventMetadata DeserializeMetadata(string metadata);
}
