import { eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { csvRecords } from "@/lib/db/schema";
import { CsvRecord, GlucoseAnalysis, MultiPeriodGlucoseAnalysis, TimePeriod } from "@/lib/types";

import {
  calculateAverageGlucose,
  calculateTimeInRange,
  calculateVariability,
  generateMetricsText,
  generateRecentReadingsText,
} from "./metrics";

/**
 * Filtra las lecturas por período de tiempo
 */
function filterReadingsByTimePeriod(readings: CsvRecord[], timePeriod: TimePeriod): CsvRecord[] {
  if (timePeriod === 'all') {
    return readings;
  }

  const now = new Date();
  let startDate: Date;

  switch (timePeriod) {
    case 'day':
      startDate = new Date(now);
      startDate.setDate(now.getDate() - 1);
      break;
    case '7days':
      startDate = new Date(now);
      startDate.setDate(now.getDate() - 7);
      break;
    case '14days':
      startDate = new Date(now);
      startDate.setDate(now.getDate() - 14);
      break;
    case '30days':
      startDate = new Date(now);
      startDate.setDate(now.getDate() - 30);
      break;
    case '90days':
      startDate = new Date(now);
      startDate.setDate(now.getDate() - 90);
      break;
    default:
      return readings;
  }

  return readings.filter(reading => {
    const readingDate = new Date(reading.timestamp);
    return readingDate >= startDate && readingDate <= now;
  });
}

/**
 * Genera un análisis de glucosa para un período de tiempo específico
 */
function generateGlucoseAnalysis(readings: CsvRecord[], timePeriod: TimePeriod): GlucoseAnalysis {
  // Si no hay lecturas, devolver valores por defecto
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
      timePeriod,
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
  const metricsText = generateMetricsText(metrics, timePeriod);

  return {
    readings,
    metrics,
    recentReadingsText,
    metricsText,
    timePeriod,
  };
}

/**
 * Obtiene las métricas de glucosa para un usuario en múltiples períodos de tiempo
 */
export async function getUserMultiPeriodGlucoseAnalysis(
  userId: string,
  periods: TimePeriod[] = ['all']
): Promise<MultiPeriodGlucoseAnalysis> {
  try {
    const result: MultiPeriodGlucoseAnalysis = {};

    for (const period of periods) {
      result[period] = await getUserGlucoseAnalysis(userId, period);
    }

    return result;
  } catch (error) {
    console.error("Error al obtener análisis de glucosa para múltiples períodos:", error);
    throw new Error("Error al obtener datos de glucosa para múltiples períodos");
  }
}

/**
 * Obtiene las lecturas de glucosa para un usuario y calcula métricas relevantes
 * para un período de tiempo específico
 */
export async function getUserGlucoseAnalysis(
  userId: string, 
  timePeriod: TimePeriod = 'all'
): Promise<GlucoseAnalysis> {
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
        timePeriod,
      };
    }

    // Procesar lecturas para convertirlas al formato esperado
    const allReadings: CsvRecord[] = csvReadings
      // Filtramos solo registros de tipo 0 (historial) y 1 (escaneo) que tienen valores de glucosa válidos (mayores que 0)
      .filter((r) => (r.recordType === "0" || r.recordType === "1") && r.glucose !== null && r.glucose !== undefined && r.glucose > 0);

    // Si no hay lecturas de glucosa válidas después de filtrar
    if (allReadings.length === 0) {
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
        timePeriod,
      };
    }

    // Filtrar lecturas por período de tiempo
    const filteredReadings = filterReadingsByTimePeriod(allReadings, timePeriod);

    return generateGlucoseAnalysis(filteredReadings, timePeriod);
  } catch (error) {
    console.error("Error al obtener análisis de glucosa:", error);
    throw new Error("Error al obtener datos de glucosa");
  }
}
