import { eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { csvRecords } from "@/lib/db/schema";
import { updateProcessedRecords } from "@/lib/services/files";
import { updateProgress } from "@/lib/services/progress";
import { NewCsvRecord, UploadResponse } from "@/lib/types";

/**
 * Opciones para el procesador de registros
 */
export interface RecordProcessorOptions {
  fileId?: number;
  batchSize?: number;
  // eslint-disable-next-line no-unused-vars
  onProgress?: (progress: number, processedCount: number, totalCount: number) => void;
  sourceName?: string;
}

/**
 * Servicio centralizado para procesar e insertar registros de glucosa
 * Maneja únicamente arrays de NewCsvRecord que ya han sido parseados
 */
export class GlucoseRecordProcessor {
  private readonly userId: string;
  private options: RecordProcessorOptions;

  constructor(userId: string, options: RecordProcessorOptions = {}) {
    this.userId = userId;
    this.options = {
      batchSize: 100,
      sourceName: "Unknown",
      ...options,
    };
  }

  /**
   * Procesa e inserta registros NewCsvRecord en la base de datos evitando duplicados
   */
  async processAndStore(records: NewCsvRecord[]): Promise<UploadResponse> {
    try {
      // Verificar que haya registros válidos para insertar
      if (records.length === 0) {
        return Promise.reject(new Error("No se encontraron registros válidos para procesar"));
      }

      const totalRecords = records.length;
      let processedCount = 0;
      let insertedCount = 0;

      // Reportar progreso inicial
      this.reportProgress(0, 0, totalRecords);

      // Obtener todos los registros existentes en una sola consulta para optimizar
      const existingRecords = await db
        .select({
          userId: csvRecords.userId,
          timestamp: csvRecords.timestamp,
          recordType: csvRecords.recordType,
        })
        .from(csvRecords)
        .where(eq(csvRecords.userId, this.userId));

      // Crear un Set para búsquedas rápidas
      const existingSet = new Set(
        existingRecords.map((r) => `${r.userId}-${r.timestamp.toISOString()}-${r.recordType}`)
      );

      // Procesar en lotes
      const batchSize = this.options.batchSize!;
      for (let i = 0; i < records.length; i += batchSize) {
        const batch = records.slice(i, i + batchSize);

        // Filtrar duplicados
        const uniqueRecords = batch.filter((record) => {
          const key = `${record.userId}-${record.timestamp.toISOString()}-${record.recordType}`;
          return !existingSet.has(key);
        });

        // Insertar en lote si hay registros únicos
        if (uniqueRecords.length > 0) {
          try {
            await db.insert(csvRecords).values(uniqueRecords);
            insertedCount += uniqueRecords.length;

            // Agregar los nuevos registros al conjunto de existentes para evitar duplicados en lotes futuros
            for (const record of uniqueRecords) {
              const key = `${record.userId}-${record.timestamp.toISOString()}-${record.recordType}`;
              existingSet.add(key);
            }
          } catch (error) {
            // Manejar errores de duplicados
            if (this.isDuplicateKeyError(error)) {
              console.warn("Se detectaron registros duplicados, procesando individualmente...");

              // Procesar los registros uno por uno para evitar que un duplicado detenga el lote completo
              for (const record of uniqueRecords) {
                try {
                  await db.insert(csvRecords).values([record]);
                  insertedCount++;

                  // Agregar el registro al conjunto de existentes
                  const key = `${record.userId}-${record.timestamp.toISOString()}-${record.recordType}`;
                  existingSet.add(key);
                } catch (insertError) {
                  // Ignorar errores de duplicados individuales
                  if (!this.isDuplicateKeyError(insertError)) {
                    throw insertError; // Re-lanzar si no es un error de duplicado
                  }
                }
              }
            } else {
              // Si no es un error de duplicado, re-lanzar
              throw error;
            }
          }
        }

        // Actualizar progreso
        processedCount += batch.length;
        const progress = Math.round((processedCount / totalRecords) * 100);
        this.reportProgress(progress, processedCount, totalRecords);
      }

      // Actualizar el número de registros procesados si es un archivo
      if (this.options.fileId) {
        await updateProcessedRecords(this.options.fileId, insertedCount);
      }

      console.info(`Registros insertados desde ${this.options.sourceName}: ${insertedCount}`);

      return {
        success: true,
        message: `Se procesaron ${totalRecords} registros desde ${this.options.sourceName}, se insertaron ${insertedCount} nuevos registros`,
        count: insertedCount,
        totalProcessed: totalRecords,
        fileId: this.options.fileId,
      };
    } catch (error) {
      console.error(`Error al procesar registros desde ${this.options.sourceName}:`, error);
      throw error instanceof Error
        ? error
        : new Error(`Error desconocido al procesar datos desde ${this.options.sourceName}`);
    }
  }

  /**
   * Reporta el progreso usando ambos mecanismos disponibles
   */
  private reportProgress(progress: number, processedCount: number, totalCount: number): void {
    if (this.options.onProgress) {
      this.options.onProgress(progress, processedCount, totalCount);
    }

    if (this.options.fileId) {
      updateProgress(this.options.fileId, progress, processedCount, totalCount);
    }
  }

  /**
   * Verifica si un error es de clave duplicada
   */

  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  private isDuplicateKeyError(error: any): boolean {
    return (
      error instanceof Error &&
      error.message.includes("duplicate key value violates unique constraint") &&
      error.message.includes("csv_records_timestamp_type_idx")
    );
  }
}
