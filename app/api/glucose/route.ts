import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { glucoseReadings } from "@/lib/db/schema";

export async function GET() {
  try {
    // Verificar autenticación
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Obtener el ID del usuario desde la sesión
    const userId = session.user.id!;

    // Obtener las lecturas de glucosa del usuario
    const readings = await db
      .select()
      .from(glucoseReadings)
      .where(eq(glucoseReadings.userId, userId))
      .orderBy(glucoseReadings.timestamp);

    // Calcular métricas
    const timeInRange = calculateTimeInRange(readings);
    const averageGlucose = calculateAverageGlucose(readings);
    const variability = calculateVariability(readings);

    return NextResponse.json({
      readings,
      metrics: {
        timeInRange: timeInRange.inRange,
        timeBelowRange: timeInRange.below,
        timeAboveRange: timeInRange.above,
        averageGlucose,
        variability,
      },
    });
  } catch (error) {
    console.error("Error al obtener datos de glucosa:", error);
    return NextResponse.json({ error: "Error al obtener datos" }, { status: 500 });
  }
}

// Función para calcular el tiempo en rango (70-180 mg/dL)
function calculateTimeInRange(readings: any[]) {
  if (readings.length === 0) return { inRange: 0, below: 0, above: 0 };

  const inRange = readings.filter((r) => r.value >= 70 && r.value <= 180).length;
  const below = readings.filter((r) => r.value < 70).length;
  const above = readings.filter((r) => r.value > 180).length;

  return {
    inRange: Math.round((inRange / readings.length) * 100),
    below: Math.round((below / readings.length) * 100),
    above: Math.round((above / readings.length) * 100),
  };
}

// Función para calcular la glucosa promedio
function calculateAverageGlucose(readings: any[]) {
  if (readings.length === 0) return 0;

  const sum = readings.reduce((acc, r) => acc + r.value, 0);
  return Math.round(sum / readings.length);
}

// Función para calcular la variabilidad glucémica (coeficiente de variación)
function calculateVariability(readings: any[]) {
  if (readings.length <= 1) return 0;

  const avg = calculateAverageGlucose(readings);
  const squaredDiffs = readings.map((r) => Math.pow(r.value - avg, 2));
  const variance = squaredDiffs.reduce((acc, val) => acc + val, 0) / readings.length;
  const stdDev = Math.sqrt(variance);

  return Math.round((stdDev / avg) * 100); // CV en porcentaje
}
