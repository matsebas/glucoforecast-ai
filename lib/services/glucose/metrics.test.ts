import { describe, expect, it } from "vitest";

import { CsvRecord, GlucoseMetrics } from "../../types";

import {
  calculateAverageGlucose,
  calculateTimeInRange,
  calculateVariability,
  generateMetricsText,
  generateRecentReadingsText,
} from "./metrics";

describe("calculateTimeInRange", () => {
  it("debería calcular correctamente el tiempo en rango para datos válidos", () => {
    const readings: CsvRecord[] = [
      { glucose: 80 }, // En rango
      { glucose: 60 }, // Bajo rango
      { glucose: 200 }, // Alto rango
      { glucose: 120 }, // En rango
      { glucose: 180 }, // En rango
    ] as CsvRecord[];

    const result = calculateTimeInRange(readings);

    expect(result.inRange).toBe(60); // 3 de 5 = 60%
    expect(result.below).toBe(20); // 1 de 5 = 20%
    expect(result.above).toBe(20); // 1 de 5 = 20%
  });

  it("debería retornar ceros para array vacío", () => {
    const result = calculateTimeInRange([]);

    expect(result.inRange).toBe(0);
    expect(result.below).toBe(0);
    expect(result.above).toBe(0);
  });

  it("debería manejar valores en los límites correctamente", () => {
    const readings: CsvRecord[] = [
      { glucose: 70 }, // En rango (límite inferior)
      { glucose: 180 }, // En rango (límite superior)
      { glucose: 69 }, // Bajo rango
      { glucose: 181 }, // Alto rango
    ] as CsvRecord[];

    const result = calculateTimeInRange(readings);

    expect(result.inRange).toBe(50); // 2 de 4 = 50%
    expect(result.below).toBe(25); // 1 de 4 = 25%
    expect(result.above).toBe(25); // 1 de 4 = 25%
  });
});

describe("calculateAverageGlucose", () => {
  it("debería calcular el promedio correctamente", () => {
    const readings: CsvRecord[] = [
      { glucose: 80 },
      { glucose: 120 },
      { glucose: 100 },
    ] as CsvRecord[];

    const result = calculateAverageGlucose(readings);

    expect(result).toBe(100); // (80 + 120 + 100) / 3 = 100
  });

  it("debería retornar 0 para array vacío", () => {
    const result = calculateAverageGlucose([]);

    expect(result).toBe(0);
  });

  it("debería redondear correctamente", () => {
    const readings: CsvRecord[] = [{ glucose: 81 }, { glucose: 82 }] as CsvRecord[];

    const result = calculateAverageGlucose(readings);

    expect(result).toBe(82); // (81 + 82) / 2 = 81.5, redondeado a 82
  });
});

describe("calculateVariability", () => {
  it("debería calcular la variabilidad correctamente", () => {
    const readings: CsvRecord[] = [
      { glucose: 80 },
      { glucose: 120 },
      { glucose: 100 },
    ] as CsvRecord[];

    const result = calculateVariability(readings);

    // Promedio: 100, desviación estándar: ~16.33, CV: ~16%
    expect(result).toBeGreaterThan(15);
    expect(result).toBeLessThan(20);
  });

  it("debería retornar 0 para array vacío o con un elemento", () => {
    expect(calculateVariability([])).toBe(0);
    expect(calculateVariability([{ glucose: 100 } as CsvRecord])).toBe(0);
  });

  it("debería manejar promedio cero sin división por cero", () => {
    const readings: CsvRecord[] = [{ glucose: 0 }, { glucose: 0 }] as CsvRecord[];

    const result = calculateVariability(readings);

    expect(result).toBe(0);
  });

  it("debería retornar 0 para lecturas idénticas", () => {
    const readings: CsvRecord[] = [
      { glucose: 100 },
      { glucose: 100 },
      { glucose: 100 },
    ] as CsvRecord[];

    const result = calculateVariability(readings);

    expect(result).toBe(0);
  });
});

describe("generateRecentReadingsText", () => {
  it("debería generar texto para lecturas recientes", () => {
    const readings: CsvRecord[] = [
      { glucose: 80, timestamp: new Date("2024-01-01T10:00:00Z") },
      { glucose: 120, timestamp: new Date("2024-01-01T11:00:00Z") },
    ] as CsvRecord[];

    const result = generateRecentReadingsText(readings, 2);

    expect(result).toContain("Últimas 2 lecturas de glucosa:");
    expect(result).toContain("120 mg/dL");
    expect(result).toContain("80 mg/dL");
  });

  it("debería manejar array vacío", () => {
    const result = generateRecentReadingsText([]);

    expect(result).toBe("No hay datos de glucosa disponibles.");
  });

  it("debería manejar timestamps nulos", () => {
    const readings: CsvRecord[] = [
      {
        id: 1,
        userId: "test-user",
        glucose: 80,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        timestamp: null as any,
        recordType: "0",
        rapidInsulin: null,
        longInsulin: null,
        carbs: null,
        notes: null,
        device: null,
        serialNumber: null,
      },
    ];

    const result = generateRecentReadingsText(readings, 1);

    expect(result).toContain("Fecha no disponible");
    expect(result).toContain("80 mg/dL");
  });

  it("debería limitar las lecturas correctamente", () => {
    const readings: CsvRecord[] = Array.from({ length: 15 }, (_, i) => ({
      glucose: 100 + i,
      timestamp: new Date(),
    })) as CsvRecord[];

    const result = generateRecentReadingsText(readings, 3);

    // Debería mostrar solo las últimas 3 lecturas
    // Contar las líneas que contienen mg/dL (las lecturas)
    const readingLines = result.split("\n").filter((line) => line.includes("mg/dL"));
    expect(readingLines.length).toBe(3);
  });
});

describe("generateMetricsText", () => {
  it("debería generar texto para métricas válidas", () => {
    const metrics: GlucoseMetrics = {
      timeInRange: 70,
      timeBelowRange: 10,
      timeAboveRange: 20,
      averageGlucose: 140,
      variability: 15,
    } as GlucoseMetrics;

    const result = generateMetricsText(metrics, "7days");

    expect(result).toContain("de los últimos 7 días");
    expect(result).toContain("Tiempo en Rango (70-180 mg/dL): 70%");
    expect(result).toContain("Tiempo Bajo Rango (<70 mg/dL): 10%");
    expect(result).toContain("Tiempo Alto Rango (>180 mg/dL): 20%");
    expect(result).toContain("Glucosa Promedio: 140 mg/dL");
    expect(result).toContain("Variabilidad (CV): 15%");
  });

  it("debería manejar métricas nulas o vacías", () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = generateMetricsText(null as any);

    expect(result).toBe("No hay métricas disponibles.");
  });

  it("debería manejar métricas sin variabilidad", () => {
    const metrics: GlucoseMetrics = {
      timeInRange: 70,
      timeBelowRange: 10,
      timeAboveRange: 20,
      averageGlucose: 140,
    } as GlucoseMetrics;

    const result = generateMetricsText(metrics);

    expect(result).toContain("Tiempo en Rango");
    expect(result).not.toContain("Variabilidad");
  });

  it("debería formatear correctamente diferentes períodos de tiempo", () => {
    const metrics: GlucoseMetrics = {
      timeInRange: 70,
      timeBelowRange: 10,
      timeAboveRange: 20,
      averageGlucose: 140,
    } as GlucoseMetrics;

    expect(generateMetricsText(metrics, "day")).toContain("del último día");
    expect(generateMetricsText(metrics, "30days")).toContain("de los últimos 30 días");
    expect(generateMetricsText(metrics, "90days")).toContain("de los últimos 90 días");
    expect(generateMetricsText(metrics, "all")).toContain("de todo el período");
  });
});
