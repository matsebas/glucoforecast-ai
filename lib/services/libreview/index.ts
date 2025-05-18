import { parse } from "csv-parse/sync";
import { eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { csvRecords } from "@/lib/db/schema";
import { updateProcessedRecords } from "@/lib/services/files";
import { updateProgress } from "@/lib/services/progress";
import { CsvFileRecord, CsvRecord, NewCsvRecord, UploadResponse } from "@/lib/types";

/**
 * Procesa cada registro del archivo CSV y guarda los datos en la base de datos
 * @param userId Identificador del usuario
 * @param fileId Identificador del archivo subido
 * @param file Archivo CSV
 * @param onProgress Función opcional para reportar el progreso del procesamiento
 */
export async function processLibreViewCSV(
  userId: string,
  fileId: number,
  file: File,
  onProgress?: (progress: number, processedCount: number, totalCount: number) => void
): Promise<UploadResponse> {
  try {
    // Obtener el contenido del archivo
    const csvContent = await file.text();
    // Verificar si el contenido está vacío
    if (!csvContent.trim()) {
      throw new Error("El archivo CSV está vacío");
    }

    // Saltamos las primeras 2 líneas que contienen metadatos
    const csvLines = csvContent.split("\n");

    // Verificar que el archivo tenga al menos 3 líneas
    if (csvLines.length < 3) {
      throw new Error("El formato del archivo CSV no es válido. No contiene suficientes líneas.");
    }

    const dataLines = csvLines.slice(2).join("\n");

    // Parsear el contenido CSV
    const records = parse(dataLines, {
      columns: [
        "device",
        "serialNumber",
        "timestamp",
        "recordType",
        "historicGlucose",
        "scannedGlucose",
        "rapidInsulinNonNumeric",
        "rapidInsulin",
        "foodNonNumeric",
        "carbs",
        "carbPortions",
        "longInsulinNonNumeric",
        "longInsulin",
        "notes",
        "glucoseBand",
        "ketone",
        "mealInsulin",
        "correctionInsulin",
        "userChangeInsulin",
      ],
      skip_empty_lines: true,
      trim: true,
      cast: (value, context) => {
        if (
          context.column === "historicGlucose" ||
          context.column === "scannedGlucose" ||
          context.column === "rapidInsulin" ||
          context.column === "longInsulin" ||
          context.column === "carbs"
        ) {
          // Convertir a número con decimales
          return value !== "" ? parseFloat(value) : null;
        }
        return value;
      },
    }) as CsvFileRecord[];

    // Eliminar la fila de encabezados si ha sido incluida
    if (records.length > 0 && records[0].device === "Dispositivo") {
      records.shift();
    }

    // Verificar que haya registros para procesar
    if (records.length === 0) {
      throw new Error("No se encontraron registros válidos en el archivo");
    }

    // Transformar registros para la base de datos
    const recordsToInsert = records
      .map((record) => {
        // Validar formato de fecha antes de convertir
        let timestamp: Date;
        try {
          // Intentar parsear la fecha en formato DD-MM-YYYY HH:MM
          if (/^\d{2}-\d{2}-\d{4}\s\d{2}:\d{2}$/.test(record.timestamp)) {
            const [datePart, timePart] = record.timestamp.split(" ");
            const [day, month, year] = datePart.split("-").map(Number);
            const [hours, minutes] = timePart.split(":").map(Number);

            timestamp = new Date(year, month - 1, day, hours, minutes);
          } else {
            // Intentar con el constructor de Date estándar para otros formatos
            timestamp = new Date(record.timestamp);
          }

          // Verificar que la fecha sea válida
          if (isNaN(timestamp.getTime())) {
            console.warn(`Fecha inválida: ${record.timestamp}`);
            return null;
          }
        } catch (error) {
          console.warn(`Error al procesar fecha: ${record.timestamp}`, error);
          return null;
        }

        // Crear un objeto base con los campos comunes
        const baseRecord: Partial<CsvRecord> = {
          userId,
          timestamp,
          recordType: record.recordType,
          device: record.device,
          serialNumber: record.serialNumber,
        };

        // Procesar según el tipo de registro basado en la tabla proporcionada
        // Si no hay mediciones para el tipo de registro no se inserta
        switch (record.recordType) {
          case "0": // Historial de glucosa
            if (record.historicGlucose !== null) {
              return {
                ...baseRecord,
                glucose: record.historicGlucose,
              };
            }
            return null;
          case "1": // Escaneadas de glucosa
            if (record.scannedGlucose !== null) {
              return {
                ...baseRecord,
                glucose: record.scannedGlucose,
              };
            }
            return null;
          case "4": // Insulina
            if (record.rapidInsulin !== null || record.longInsulin !== null) {
              return {
                ...baseRecord,
                rapidInsulin: record.rapidInsulin,
                longInsulin: record.longInsulin,
              };
            }
            return null;
          case "5": // Alimentos
            if (record.carbs !== null) {
              return {
                ...baseRecord,
                carbs: record.carbs,
              };
            }
            return null;
          case "6": // Notas
            if (record.notes) {
              return {
                ...baseRecord,
                notes: record.notes,
              };
            }
            return null;
          default:
            return null;
        }
      })
      .filter((record) => record !== null);

    // Verificar que haya lecturas válidas para insertar
    if (recordsToInsert.length === 0) {
      throw new Error("No se encontraron lecturas válidas en el archivo");
    }

    // Después de determinar recordsToInsert.length
    const totalRecords = recordsToInsert.length;
    let processedCount = 0;

    // Insertar los registros en lotes, evitando duplicados
    const batchSize = 100;
    let insertedCount = 0;

    // Reportar progreso inicial
    if (onProgress) {
      onProgress(0, 0, totalRecords);
    }
    // También usar el mecanismo global de progreso
    updateProgress(fileId, 0, 0, totalRecords);

    // Obtener todos los registros existentes en una sola consulta para optimizar
    const existingRecords = await db
      .select({
        userId: csvRecords.userId,
        timestamp: csvRecords.timestamp,
        recordType: csvRecords.recordType,
      })
      .from(csvRecords)
      .where(eq(csvRecords.userId, userId));

    // Crear un Set para búsquedas rápidas
    const existingSet = new Set(
      existingRecords.map((r) => `${r.userId}-${r.timestamp.toISOString()}-${r.recordType}`)
    );

    for (let i = 0; i < recordsToInsert.length; i += batchSize) {
      const batch = recordsToInsert.slice(i, i + batchSize);

      // Filtrar duplicados
      const uniqueRecords = batch.filter((record) => {
        const key = `${record.userId}-${record.timestamp!.toISOString()}-${record.recordType}`;
        return !existingSet.has(key);
      });

      // Preparar registros para inserción en lote
      const valuesToStore: NewCsvRecord[] = uniqueRecords.map((record) => ({
        userId: record.userId!,
        timestamp: record.timestamp!,
        recordType: record.recordType!,
        device: record.device!,
        serialNumber: record.serialNumber!,
        glucose: record.glucose,
        rapidInsulin: record.rapidInsulin,
        longInsulin: record.longInsulin,
        carbs: record.carbs,
        notes: record.notes,
      }));

      // Insertar en lote si hay registros únicos
      if (valuesToStore.length > 0) {
        try {
          await db.insert(csvRecords).values(valuesToStore);
          insertedCount += valuesToStore.length;

          // Agregar los nuevos registros al conjunto de existentes para evitar duplicados en lotes futuros
          for (const record of uniqueRecords) {
            const key = `${record.userId}-${record.timestamp!.toISOString()}-${record.recordType}`;
            existingSet.add(key);
          }
        } catch (error) {
          // Verificar si es un error de clave duplicada
          if (
            error instanceof Error &&
            error.message.includes("duplicate key value violates unique constraint") &&
            error.message.includes("csv_records_timestamp_type_idx")
          ) {
            console.warn("Se detectaron registros duplicados, continuando con el procesamiento...");

            // Procesar los registros uno por uno para evitar que un duplicado detenga todo el lote
            for (let i = 0; i < valuesToStore.length; i++) {
              try {
                await db.insert(csvRecords).values([valuesToStore[i]]);
                insertedCount++;

                // Agregar el registro al conjunto de existentes
                const record = uniqueRecords[i];
                const key = `${record.userId}-${record.timestamp!.toISOString()}-${record.recordType}`;
                existingSet.add(key);
              } catch (insertError) {
                // Ignorar errores de duplicados individuales
                if (
                  !(
                    insertError instanceof Error &&
                    insertError.message.includes(
                      "duplicate key value violates unique constraint"
                    ) &&
                    insertError.message.includes("csv_records_timestamp_type_idx")
                  )
                ) {
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

      if (onProgress) {
        onProgress(progress, processedCount, totalRecords);
      }
      // También usar el mecanismo global de progreso
      updateProgress(fileId, progress, processedCount, totalRecords);
    }

    // Actualizar el número de registros procesados
    await updateProcessedRecords(fileId, insertedCount);

    console.info(`Registros insertados: ${insertedCount}`);
    return {
      success: true,
      message: `Se procesaron ${insertedCount} registros`,
      count: insertedCount,
      fileId,
    };
  } catch (error) {
    console.error("Error al procesar archivo CSV de glucosa:", error);
    throw error instanceof Error
      ? error
      : new Error("Error desconocido al procesar el archivo CSV");
  }
}
