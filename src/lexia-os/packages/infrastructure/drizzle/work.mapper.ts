import { ID } from "../../shared/index.js";
import { Trabajo } from "../../domain/index.js";
import { works } from "./schema.js";

type WorkRow = typeof works.$inferSelect;
type WorkInsert = typeof works.$inferInsert;

export class DrizzleWorkMapper {
  static toRow(trabajo: Trabajo): WorkInsert {
    return {
      id: trabajo.id.value,
      eventId: trabajo.eventId.value,
      description: trabajo.description,
      state: trabajo.state,
      version: trabajo.version,
      createdAt: trabajo.createdAt,
      // Suponemos que si state es Completado (o análogo) tiene completedAt.
      // Como no está expuesto fácilmente si no añadimos getters (que el usuario
      // no quiere que contaminemos por ahora), en un modelo real podemos extraerlo 
      // de los eventos o exponer getters limpios en el root aggregate. 
      // Para esta demo lo dejamos null si no tenemos forma de saberlo, o 
      // podríamos usar un truco temporal (Object.assign, proxy).
      // Dado el objetivo de "Cero Fricción", accederemos via cast para no modificar el Dominio:
      completedAt: (trabajo as any).completedAt || null,
    };
  }

  static toDomain(row: WorkRow): Trabajo {
    return Trabajo.fromSnapshot({
      id: row.id,
      eventId: row.eventId,
      description: row.description,
      state: row.state as any,
      createdAt: row.createdAt,
      version: row.version
    });
  }
}
