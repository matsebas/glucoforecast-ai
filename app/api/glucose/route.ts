import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { getUserGlucoseAnalysis, getUserMultiPeriodGlucoseAnalysis } from "@/lib/services/glucose";
import { TimePeriod } from "@/lib/types";

export async function GET(request: Request) {
  try {
    // Verificar autenticación
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Obtener el ID del usuario desde la sesión
    const userId = session.user.id!;

    // Obtener parámetros de la URL
    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") as TimePeriod | null;
    const multiPeriod = searchParams.get("multiPeriod");

    // Si se solicitan múltiples períodos
    if (multiPeriod === "true") {
      // Obtener los períodos solicitados o usar los predeterminados
      const periods = (searchParams.get("periods")?.split(",") as TimePeriod[]) || [
        "day",
        "7days",
        "14days",
        "30days",
        "90days",
      ];

      // Usar el servicio para obtener análisis de glucosa para múltiples períodos
      const multiPeriodAnalysis = await getUserMultiPeriodGlucoseAnalysis(userId, periods);

      // Devolver la respuesta estructurada con múltiples períodos
      return NextResponse.json(multiPeriodAnalysis);
    } else {
      // Usar el servicio centralizado para obtener análisis de glucosa para un período específico
      const glucoseAnalysis = await getUserGlucoseAnalysis(userId, period || "all");

      console.info(">> GET: Análisis de glucosa obtenido:", glucoseAnalysis);

      // Devolver la respuesta estructurada
      return NextResponse.json({
        readings: glucoseAnalysis.readings,
        metrics: glucoseAnalysis.metrics,
        timePeriod: glucoseAnalysis.timePeriod,
      });
    }
  } catch (error) {
    console.error("Error al obtener datos de glucosa:", error);
    return NextResponse.json({ error: "Error al obtener datos" }, { status: 500 });
  }
}
