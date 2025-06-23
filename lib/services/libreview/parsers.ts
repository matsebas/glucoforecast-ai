import { GlucoseReading } from "libre-link-unofficial-api";
import { LibreConnection } from "libre-link-unofficial-api/dist/types";

import { CsvFileRecord, NewCsvRecord } from "@/lib/types";

/**
 * Interfaz para el resultado de parsing
 */
export interface ParseResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Parsea un registro CSV de LibreView a NewCsvRecord
 */
export function parseCsvFileRecord(
  csvRecord: CsvFileRecord,
  userId: string
): ParseResult<NewCsvRecord> {
  try {
    // Validar formato de fecha antes de convertir
    let timestamp: Date;
    try {
      // Intentar parsear la fecha en formato DD-MM-YYYY HH:MM
      if (/^\d{2}-\d{2}-\d{4}\s\d{2}:\d{2}$/.test(csvRecord.timestamp)) {
        const [datePart, timePart] = csvRecord.timestamp.split(" ");
        const [day, month, year] = datePart.split("-").map(Number);
        const [hours, minutes] = timePart.split(":").map(Number);

        timestamp = new Date(year, month - 1, day, hours, minutes);
      } else {
        // Intentar con el constructor de Date estándar para otros formatos
        timestamp = new Date(csvRecord.timestamp);
      }

      // Verificar que la fecha sea válida
      if (isNaN(timestamp.getTime())) {
        return {
          success: false,
          error: `Fecha inválida: ${csvRecord.timestamp}`,
        };
      }
    } catch (error) {
      return {
        success: false,
        error: `Error al procesar fecha: ${csvRecord.timestamp}.
        Mensaje: ${error instanceof Error ? error.message : "Error desconocido"}`,
      };
    }

    // Crear un objeto base con los campos comunes
    const baseRecord: Partial<NewCsvRecord> = {
      userId,
      timestamp,
      recordType: csvRecord.recordType,
      device: csvRecord.device,
      serialNumber: csvRecord.serialNumber,
      rapidInsulin: null,
      longInsulin: null,
      carbs: null,
      notes: null,
      glucose: 0,
    };

    // Procesar según el tipo de registro basado en la tabla proporcionada
    // Si no hay mediciones para el tipo de registro no se procesa
    switch (csvRecord.recordType) {
      case "0": // Historial de glucosa
        if (csvRecord.historicGlucose !== null) {
          return {
            success: true,
            data: {
              ...baseRecord,
              glucose: csvRecord.historicGlucose,
            } as NewCsvRecord,
          };
        }
        return {
          success: false,
          error: "Registro de historial de glucosa sin valor de glucosa",
        };

      case "1": // Escaneadas de glucosa
        if (csvRecord.scannedGlucose !== null) {
          return {
            success: true,
            data: {
              ...baseRecord,
              glucose: csvRecord.scannedGlucose,
            } as NewCsvRecord,
          };
        }
        return {
          success: false,
          error: "Registro de glucosa escaneada sin valor de glucosa",
        };

      case "4": // Insulina
        if (csvRecord.rapidInsulin !== null || csvRecord.longInsulin !== null) {
          return {
            success: true,
            data: {
              ...baseRecord,
              rapidInsulin: csvRecord.rapidInsulin,
              longInsulin: csvRecord.longInsulin,
            } as NewCsvRecord,
          };
        }
        return {
          success: false,
          error: "Registro de insulina sin valores de insulina",
        };

      case "5": // Alimentos
        if (csvRecord.carbs !== null) {
          return {
            success: true,
            data: {
              ...baseRecord,
              carbs: csvRecord.carbs,
            } as NewCsvRecord,
          };
        }
        return {
          success: false,
          error: "Registro de alimentos sin valor de carbohidratos",
        };

      case "6": // Notas
        if (csvRecord.notes) {
          return {
            success: true,
            data: {
              ...baseRecord,
              notes: csvRecord.notes,
            } as NewCsvRecord,
          };
        }
        return {
          success: false,
          error: "Registro de notas sin contenido de nota",
        };

      default:
        return {
          success: false,
          error: `Tipo de registro no reconocido: ${csvRecord.recordType}`,
        };
    }
  } catch (error) {
    return {
      success: false,
      error: `Error inesperado al procesar registro CSV: ${error instanceof Error ? error.message : "Error desconocido"}`,
    };
  }
}

/**
 * Parsea una lectura de glucosa de la API de LibreLink a NewCsvRecord
 */
export function parseGlucoseReading(
  reading: GlucoseReading,
  userId: string,
  patientConnection: LibreConnection
): ParseResult<NewCsvRecord> {
  try {
    const timestamp = new Date(reading.timestamp);

    // Verificar que la fecha sea válida
    if (isNaN(timestamp.getTime())) {
      return {
        success: false,
        error: `Fecha inválida desde API: ${reading.timestamp}`,
      };
    }

    // Para API de LibreLink, siempre es glucose escaneada (tipo 1)
    const record: NewCsvRecord = {
      userId,
      timestamp,
      recordType: "1", // 0 para histórico, 1 para escaneo
      device: patientConnection.patientDevice.did,
      serialNumber: patientConnection.sensor.sn || "Unknown",
      glucose: reading.value,
      rapidInsulin: null,
      longInsulin: null,
      carbs: null,
      notes: null,
    };

    return {
      success: true,
      data: record,
    };
  } catch (error) {
    return {
      success: false,
      error: `Error inesperado al procesar lectura de API: ${error instanceof Error ? error.message : "Error desconocido"}`,
    };
  }
}

/**
 * Parsea múltiples registros CSV filtrando los que fallan
 */
export function parseCsvFileRecords(
  csvRecords: CsvFileRecord[],
  userId: string
): { records: NewCsvRecord[]; errors: string[] } {
  const records: NewCsvRecord[] = [];
  const errors: string[] = [];

  for (const csvRecord of csvRecords) {
    const result = parseCsvFileRecord(csvRecord, userId);
    if (result.success && result.data) {
      records.push(result.data);
    } else if (result.error) {
      errors.push(result.error);
    }
  }

  return { records, errors };
}

/**
 * Parsea múltiples lecturas de glucosa de API filtrando las que fallan
 */
export function parseGlucoseReadings(
  readings: GlucoseReading[],
  userId: string,
  patientConnection: LibreConnection
): { records: NewCsvRecord[]; errors: string[] } {
  const records: NewCsvRecord[] = [];
  const errors: string[] = [];

  for (const reading of readings) {
    const result = parseGlucoseReading(reading, userId, patientConnection);
    if (result.success && result.data) {
      records.push(result.data);
    } else if (result.error) {
      errors.push(result.error);
    }
  }

  return { records, errors };
}
