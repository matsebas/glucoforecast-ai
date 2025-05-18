import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { getUserGlucoseAnalysis } from "@/lib/services/glucose";

export async function GET() {
  try {
    // Verificar autenticación
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Obtener el ID del usuario desde la sesión
    const userId = session.user.id!;

    // Usar el servicio centralizado para obtener análisis de glucosa
    const glucoseAnalysis = await getUserGlucoseAnalysis(userId);

    // Devolver la respuesta estructurada
    return NextResponse.json({
      readings: glucoseAnalysis.readings,
      metrics: glucoseAnalysis.metrics,
    });
  } catch (error) {
    console.error("Error al obtener datos de glucosa:", error);
    return NextResponse.json({ error: "Error al obtener datos" }, { status: 500 });
  }
}
