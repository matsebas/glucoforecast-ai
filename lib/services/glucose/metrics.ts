import { CsvRecord, GlucoseMetrics, TimePeriod } from "../../types";

/**
 * Calcula el tiempo en rango (70-180 mg/dL), bajo rango (<70 mg/dL) y sobre rango (>180 mg/dL)
 */
export function calculateTimeInRange(readings: CsvRecord[]): {
  inRange: number;
  below: number;
  above: number;
} {
  if (readings.length === 0) return { inRange: 0, below: 0, above: 0 };

  const inRange = readings.filter((r) => r.glucose! >= 70 && r.glucose! <= 180).length;
  const below = readings.filter((r) => r.glucose! < 70).length;
  const above = readings.filter((r) => r.glucose! > 180).length;

  return {
    inRange: Math.round((inRange / readings.length) * 100),
    below: Math.round((below / readings.length) * 100),
    above: Math.round((above / readings.length) * 100),
  };
}

/**
 * Calcula la glucosa promedio
 */
export function calculateAverageGlucose(readings: CsvRecord[]): number {
  if (readings.length === 0) return 0;

  const sum = readings.reduce((acc, r) => acc + r.glucose!, 0);
  return Math.round(sum / readings.length);
}

/**
 * Calcula la variabilidad glucémica (coeficiente de variación)
 */
export function calculateVariability(readings: CsvRecord[]): number {
  if (readings.length <= 1) return 0;

  const avg = calculateAverageGlucose(readings);
  // Prevenir división por cero si el promedio es 0
  if (avg === 0) return 0;

  const squaredDiffs = readings.map((r) => Math.pow(r.glucose! - avg, 2));
  const variance = squaredDiffs.reduce((acc, val) => acc + val, 0) / readings.length;
  const stdDev = Math.sqrt(variance);

  // Coeficiente de variación (CV) expresado como porcentaje
  return Math.round((stdDev / avg) * 100);
}

/**
 * Genera un texto con las lecturas recientes de glucosa
 */
export function generateRecentReadingsText(readings: CsvRecord[], limit: number = 10): string {
  if (readings.length === 0) return "No hay datos de glucosa disponibles.";

  const recentReadings = readings
    .slice(-limit)
    .map(
      (r) =>
        `${r.timestamp ? new Date(r.timestamp).toLocaleString() : "Fecha no disponible"}: ${r.glucose} mg/dL`
    )
    .reverse()
    .join("\n");

  return `Últimas 10 lecturas de glucosa:\n${recentReadings}`;
}

/**
 * Genera un texto formateado con las métricas de glucosa
 */
export function generateMetricsText(metrics: GlucoseMetrics, timePeriod?: TimePeriod): string {
  if (!metrics || metrics.timeInRange === 0) return "No hay métricas disponibles.";

  let periodText = "";
  if (timePeriod) {
    switch (timePeriod) {
      case "day":
        periodText = "del último día";
        break;
      case "7days":
        periodText = "de los últimos 7 días";
        break;
      case "14days":
        periodText = "de los últimos 14 días";
        break;
      case "30days":
        periodText = "de los últimos 30 días";
        break;
      case "90days":
        periodText = "de los últimos 90 días";
        break;
      case "all":
        periodText = "de todo el período";
        break;
    }
  }

  return `
    Métricas de glucosa ${periodText}:
    - Tiempo en Rango (70-180 mg/dL): ${metrics.timeInRange}%
    - Tiempo Bajo Rango (<70 mg/dL): ${metrics.timeBelowRange}%
    - Tiempo Alto Rango (>180 mg/dL): ${metrics.timeAboveRange}%
    - Glucosa Promedio: ${metrics.averageGlucose} mg/dL
    ${metrics.variability ? `- Variabilidad (CV): ${metrics.variability}%` : ""}
  `;
}
