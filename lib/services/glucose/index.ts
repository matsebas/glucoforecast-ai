import { eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { csvRecords } from "@/lib/db/schema";
import { CsvRecord, GlucoseAnalysis } from "@/lib/types";

import {
  calculateAverageGlucose,
  calculateTimeInRange,
  calculateVariability,
  generateMetricsText,
  generateRecentReadingsText,
} from "./metrics";

/**
 * Obtiene las lecturas de glucosa para un usuario y calcula métricas relevantes
 */
export async function getUserGlucoseAnalysis(userId: string): Promise<GlucoseAnalysis> {
  try {
    // Obtener lecturas de la tabla de CSV
    const csvReadings = await db
      .select()
      .from(csvRecords)
      .where(eq(csvRecords.userId, userId))
      .orderBy(csvRecords.timestamp);

    // Si no hay lecturas, devolver valores por defecto
    if (csvReadings.length === 0) {
      return {
        readings: [],
        metrics: {
          timeInRange: 0,
          timeBelowRange: 0,
          timeAboveRange: 0,
          averageGlucose: 0,
        },
        recentReadingsText: "No hay datos de glucosa disponibles.",
        metricsText: "No hay métricas disponibles.",
      };
    }

    // Procesar lecturas para convertirlas al formato esperado
    const readings: CsvRecord[] = csvReadings
      // Filtramos solo registros de tipo 0 (historial) y 1 (escaneo) que tienen valores de glucosa
      .filter((r) => (r.recordType === "0" || r.recordType === "1") && r.glucose && r.glucose > 0);

    // Si no hay lecturas de glucosa válidas después de filtrar
    if (readings.length === 0) {
      return {
        readings: [],
        metrics: {
          timeInRange: 0,
          timeBelowRange: 0,
          timeAboveRange: 0,
          averageGlucose: 0,
        },
        recentReadingsText: "No hay lecturas de glucosa válidas disponibles.",
        metricsText: "No hay métricas disponibles.",
      };
    }

    // Calcular métricas
    const timeInRangeData = calculateTimeInRange(readings);
    const metrics = {
      timeInRange: timeInRangeData.inRange,
      timeBelowRange: timeInRangeData.below,
      timeAboveRange: timeInRangeData.above,
      averageGlucose: calculateAverageGlucose(readings),
      variability: calculateVariability(readings),
    };

    // Generar textos para la interfaz y el prompt
    const recentReadingsText = generateRecentReadingsText(readings);
    const metricsText = generateMetricsText(metrics);

    return {
      readings,
      metrics,
      recentReadingsText,
      metricsText,
    };
  } catch (error) {
    console.error("Error al obtener análisis de glucosa:", error);
    throw new Error("Error al obtener datos de glucosa");
  }
}
