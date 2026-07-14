import { Participant } from '@lexia/domain';
import { ParticipantMergeResult, MergeConflict } from '@lexia/domain';

export class ParticipantMerger {
  /**
   * Fusiona incrementalmente una lista de nuevos participantes (entrantes de un documento nuevo)
   * con la lista actual consolidada del expediente.
   */
  public static merge(
    existingParticipants: Participant[],
    incomingParticipants: Participant[]
  ): ParticipantMergeResult {
    const startTime = Date.now();
    const resultParticipants: Participant[] = [...existingParticipants];
    const unresolvedConflicts: MergeConflict[] = [];

    let mergedCount = 0;
    let createdCount = 0;
    let ignoredCount = 0;
    let conflictsCount = 0;

    for (const incoming of incomingParticipants) {
      // 1. Estrategia de búsqueda de coincidencia exacta por nombre normalizado o ID (document number)
      // Para un merger de Case, podríamos ser más estrictos.
      const match = existingParticipants.find(p => 
        (p.normalizedName === incoming.normalizedName)
      );

      if (match) {
        // En lugar de mutar, creamos una copia (inmutabilidad).
        // En una implementación real más compleja se cruzarían roles, alias y evidencias.
        // Pero el ParticipantMerger no modifica el "Participant" original, produce una lista nueva.
        // Aquí asumimos que si son exactamente el mismo nombre normalizado, referencian a la misma entidad.
        // Solo unificaremos las referencias o dejaremos el match existente (los assets están inmutables).
        mergedCount++;
        
        // Si quisiéramos actualizar metadata del participant como agregar un rol que tiene en el nuevo doc
        // Deberíamos clonarlo. Por ahora, nos quedamos con el existente y lo consideramos fusionado.
      } else {
        // Podría haber un conflicto si se llaman muy similar (J. Perez vs Juan Perez)
        // Simplificamos: si no hay match directo, es nuevo o requiere resolución manual.
        
        // Ejemplo de detección de conflicto por similitud simple (solo ilustrativo)
        const partialMatch = existingParticipants.find(p => 
          p.normalizedName.includes(incoming.normalizedName) || incoming.normalizedName.includes(p.normalizedName)
        );

        if (partialMatch) {
          unresolvedConflicts.push({
            type: 'LOW_CONFIDENCE',
            description: `Posible similitud entre '${partialMatch.normalizedName}' y '${incoming.normalizedName}'`,
            incomingParticipantId: incoming.id,
            existingParticipantId: partialMatch.id
          });
          conflictsCount++;
        } else {
          // Si no hay ningún match o similitud conflictiva, se crea (agrega) al case
          resultParticipants.push(incoming);
          createdCount++;
        }
      }
    }

    return {
      participants: resultParticipants,
      unresolvedConflicts,
      report: {
        merged: mergedCount,
        created: createdCount,
        ignored: ignoredCount,
        conflicts: conflictsCount,
        durationMs: Date.now() - startTime
      }
    };
  }
}
