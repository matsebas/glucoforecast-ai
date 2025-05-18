import { and, eq, gt, gte, lte, or } from "drizzle-orm";

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

function getTimestampFilterByTimePeriod(timePeriod: TimePeriod) {
  const now = new Date();
  let fromDate: Date | undefined = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  let toDate: Date | undefined = now;

  switch (timePeriod) {
    case "day":
      fromDate.setDate(now.getDate() - 1);
      break;
    case "7days":
      fromDate.setDate(now.getDate() - 7);
      break;
    case "14days":
      fromDate.setDate(now.getDate() - 14);
      break;
    case "30days":
      fromDate.setDate(now.getDate() - 30);
      break;
    case "90days":
      fromDate.setDate(now.getDate() - 90);
      break;
    default:
      fromDate = undefined;
      toDate = undefined;
      break;
  }

  return {
    fromDate,
    toDate,
  };
}

/**
 * Genera un análisis de glucosa para un período de tiempo específico
 */
function generateGlucoseAnalysis(readings: CsvRecord[], timePeriod: TimePeriod): GlucoseAnalysis {
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
  periods: TimePeriod[] = ["all"]
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
  timePeriod: TimePeriod = "all"
): Promise<GlucoseAnalysis> {
  try {
    const { fromDate, toDate } = getTimestampFilterByTimePeriod(timePeriod);

    console.debug(
      ">> getUserGlucoseAnalysis: Obteniendo análisis de glucosa para el usuario:",
      userId
    );
    console.debug(
      ">> getUserGlucoseAnalysis: Período de tiempo:",
      timePeriod,
      "desde:",
      fromDate,
      "hasta:",
      toDate
    );

    // Obtener lecturas de la tabla de CSV
    const csvReadings = await db
      .select()
      .from(csvRecords)
      .where(
        and(
          eq(csvRecords.userId, userId),
          or(eq(csvRecords.recordType, "0"), eq(csvRecords.recordType, "1")),
          gt(csvRecords.glucose, 0),
          fromDate ? gte(csvRecords.timestamp, fromDate) : undefined,
          toDate ? lte(csvRecords.timestamp, toDate) : undefined
        )
      )
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
    return generateGlucoseAnalysis(csvReadings, timePeriod);
  } catch (error) {
    console.error("Error al obtener análisis de glucosa:", error);
    throw new Error("Error al obtener datos de glucosa");
  }
}
