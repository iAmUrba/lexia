namespace LexIA.Application.Persistence;

public interface IEventUpcaster
{
    bool CanUpcast(string eventTypeName, int schemaVersion);
    
    /// <summary>
    /// Upcasts the event JSON to the next version.
    /// </summary>
    /// <returns>A tuple with the updated event type name, the upcasted JSON payload, and the new schema version.</returns>
    (string EventTypeName, string DataJson, int SchemaVersion) Upcast(string eventTypeName, string dataJson, int schemaVersion);
}
