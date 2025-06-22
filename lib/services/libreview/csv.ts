import { parse } from "csv-parse/sync";

import { CsvFileRecord, UploadResponse } from "@/lib/types";

import { parseCsvFileRecords } from "./parsers";
import { GlucoseRecordProcessor } from "./processor";

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

    // Parsear registros CSV a NewCsvRecord
    const { records: parsedRecords, errors } = parseCsvFileRecords(records, userId);

    // Log errores de parsing si existen
    if (errors.length > 0) {
      console.warn(`Errores de parsing en CSV: ${errors.length} registros fallaron`, errors);
    }

    // Verificar que haya registros válidos después del parsing
    if (parsedRecords.length === 0) {
      throw new Error("No se encontraron registros válidos después del parsing");
    }

    // Usar el procesador centralizado
    const processor = new GlucoseRecordProcessor(userId, {
      fileId,
      onProgress,
      sourceName: "CSV",
    });

    return await processor.processAndStore(parsedRecords);
  } catch (error) {
    console.error("Error al procesar archivo CSV de glucosa:", error);
    throw error instanceof Error
      ? error
      : new Error("Error desconocido al procesar el archivo CSV");
  }
}
