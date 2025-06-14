import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";

import { auth } from "@/auth";
import { getPatientSettings, parsePatientSettings, savePatientSettingsFromObject } from "@/lib/services/settings";

/**
 * GET /api/patient-settings
 * Obtiene la configuración de parámetros del paciente
 */
export async function GET() {
  try {
    // Verificar autenticación
    const session = await auth();
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const userId = session.user.id;

    // Obtener configuración del paciente usando el servicio
    const settings = await getPatientSettings(userId);

    return NextResponse.json(settings);
  } catch (error) {
    console.error("Error al obtener configuración del paciente:", error);
    
    // Manejo específico para configuración no encontrada
    if (error instanceof Error && error.message === "PATIENT_SETTINGS_NOT_CONFIGURED") {
      return NextResponse.json(
        {
          error: "PATIENT_SETTINGS_NOT_CONFIGURED",
          message: "Los parámetros de configuración del paciente no están establecidos. Es necesario configurarlos antes de continuar.",
        },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      {
        error: "Error al obtener configuración del paciente",
        message: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/patient-settings
 * Guarda la configuración de parámetros del paciente
 *
 * Body:
 * - isf: Factor de Sensibilidad a la Insulina
 * - icr: Relación Insulina-Carbohidratos
 * - targetLow: Límite inferior del rango objetivo
 * - targetHigh: Límite superior del rango objetivo
 */
export async function POST(req: NextRequest) {
  try {
    // Verificar autenticación
    const session = await auth();
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const userId = session.user.id;

    // Obtener y validar datos del cuerpo de la solicitud
    const body = await req.json();
    const validatedSettings = parsePatientSettings(body);

    // Guardar configuración usando el servicio
    await savePatientSettingsFromObject(userId, validatedSettings);

    return NextResponse.json({
      success: true,
      message: "Configuración guardada correctamente",
    });
  } catch (error) {
    console.error("Error al guardar configuración del paciente:", error);

    // Formatear errores de Zod
    if (error instanceof ZodError) {
      const formattedErrors = error.errors.map((err) => ({
        path: err.path.join("."),
        message: err.message,
      }));

      return NextResponse.json(
        { error: "Datos inválidos", validationErrors: formattedErrors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: "Error al guardar configuración del paciente",
        message: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 }
    );
  }
}
