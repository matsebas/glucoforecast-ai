import { and, desc, eq, gt, gte, lte, or } from "drizzle-orm";

import { db } from "@/lib/db";
import { csvRecords, glucoseMetrics } from "@/lib/db/schema";
import {
  CsvRecord,
  GlucoseAnalysis,
  GlucoseMetricsRecord,
  MultiPeriodGlucoseAnalysis,
  NewGlucoseMetricsRecord,
  TimePeriod,
} from "@/lib/types";

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
 * Obtiene las métricas de glucosa almacenadas en la base de datos
 */
async function getStoredGlucoseMetrics(
  userId: string,
  timePeriod: TimePeriod
): Promise<GlucoseMetricsRecord | null> {
  try {
    const storedMetrics = await db
      .select()
      .from(glucoseMetrics)
      .where(and(eq(glucoseMetrics.userId, userId), eq(glucoseMetrics.timePeriod, timePeriod)))
      .limit(1);

    return storedMetrics.length > 0 ? storedMetrics[0] : null;
  } catch (error) {
    console.error("Error al obtener métricas de glucosa almacenadas:", error);
    return null;
  }
}

/**
 * Guarda las métricas de glucosa en la base de datos
 */
async function saveGlucoseMetrics(
  userId: string,
  timePeriod: TimePeriod,
  metrics: {
    timeInRange: number;
    timeBelowRange: number;
    timeAboveRange: number;
    averageGlucose: number;
    variability?: number;
  }
): Promise<void> {
  try {
    // Crear objeto para insertar en la base de datos
    const metricsRecord: NewGlucoseMetricsRecord = {
      userId,
      timePeriod,
      timeInRange: metrics.timeInRange,
      timeBelowRange: metrics.timeBelowRange,
      timeAboveRange: metrics.timeAboveRange,
      averageGlucose: metrics.averageGlucose,
      variability: metrics.variability,
      calculatedAt: new Date(),
    };

    // Insertar o actualizar las métricas en la base de datos
    await db
      .insert(glucoseMetrics)
      .values(metricsRecord)
      .onConflictDoUpdate({
        target: [glucoseMetrics.userId, glucoseMetrics.timePeriod],
        set: {
          timeInRange: metricsRecord.timeInRange,
          timeBelowRange: metricsRecord.timeBelowRange,
          timeAboveRange: metricsRecord.timeAboveRange,
          averageGlucose: metricsRecord.averageGlucose,
          variability: metricsRecord.variability,
          calculatedAt: metricsRecord.calculatedAt,
        },
      });
  } catch (error) {
    console.error("Error al guardar métricas de glucosa:", error);
  }
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
  periods: TimePeriod[] = ["all"],
  forceRecalculate: boolean = false
): Promise<MultiPeriodGlucoseAnalysis> {
  try {
    const result: MultiPeriodGlucoseAnalysis = {};

    for (const period of periods) {
      console.debug(">> GLUCOSE: Calculando análisis de glucosa para período:", period);
      result[period] = await getUserGlucoseAnalysis(userId, period, forceRecalculate);
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
  timePeriod: TimePeriod = "all",
  forceRecalculate: boolean = false
): Promise<GlucoseAnalysis> {
  try {
    // Verificar si hay métricas almacenadas para este período
    if (!forceRecalculate) {
      const storedMetrics = await getStoredGlucoseMetrics(userId, timePeriod);

      // Si hay métricas almacenadas y son recientes (menos de 24 horas), usarlas
      if (
        storedMetrics &&
        new Date().getTime() - new Date(storedMetrics.calculatedAt).getTime() < 24 * 60 * 60 * 1000
      ) {
        console.debug(">> USANDO MÉTRICAS ALMACENADAS", timePeriod);

        // Obtener algunas lecturas recientes para el texto
        const recentReadings = await db
          .select()
          .from(csvRecords)
          .where(
            and(
              eq(csvRecords.userId, userId),
              or(eq(csvRecords.recordType, "0"), eq(csvRecords.recordType, "1")),
              gt(csvRecords.glucose, 0)
            )
          )
          .orderBy(desc(csvRecords.timestamp))
          .limit(10);

        // Crear objeto de métricas a partir de los datos almacenados
        const metrics = {
          timeInRange: storedMetrics.timeInRange,
          timeBelowRange: storedMetrics.timeBelowRange,
          timeAboveRange: storedMetrics.timeAboveRange,
          averageGlucose: storedMetrics.averageGlucose,
          variability: storedMetrics.variability || undefined,
        };

        // Generar textos para la interfaz
        const recentReadingsText = generateRecentReadingsText(recentReadings);
        console.debug(">> TEXTOS GENERADOS", recentReadingsText);
        const metricsText = generateMetricsText(metrics, timePeriod);
        console.debug(">> MÉTRICAS GENERADAS", metricsText);

        return {
          readings: recentReadings,
          metrics,
          recentReadingsText,
          metricsText,
          timePeriod,
        };
      }
    }

    // Si no hay métricas almacenadas o se fuerza recalcular, obtener lecturas y calcular
    const { fromDate, toDate } = getTimestampFilterByTimePeriod(timePeriod);

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
      .orderBy(desc(csvRecords.timestamp));

    // Si no hay lecturas, devolver valores por defecto
    if (csvReadings.length === 0) {
      console.debug(">> NO HAY LECTURAS DE GLUCOSA", timePeriod);
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

    // Generar análisis de glucosa
    const analysis = generateGlucoseAnalysis(csvReadings, timePeriod);

    // Guardar métricas en la base de datos
    await saveGlucoseMetrics(userId, timePeriod, analysis.metrics);

    return analysis;
  } catch (error) {
    console.error("Error al obtener análisis de glucosa:", error);
    throw new Error("Error al obtener datos de glucosa");
  }
}
