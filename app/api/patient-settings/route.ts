import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { patientSettings } from "@/lib/db/schema";
import { patientSettingsSchema } from "@/lib/validations/patient-settings";

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

    // Obtener configuración del paciente
    const settings = await db.query.patientSettings.findFirst({
      where: eq(patientSettings.userId, userId),
    });

    // Si no hay configuración, devolver valores por defecto
    if (!settings) {
      return NextResponse.json({
        isf: 100,
        icr: 10,
        targetLow: 70,
        targetHigh: 180,
      });
    }

    return NextResponse.json({
      isf: settings.isf,
      icr: settings.icr,
      targetLow: settings.targetLow,
      targetHigh: settings.targetHigh,
    });
  } catch (error) {
    console.error("Error al obtener configuración del paciente:", error);
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

    // Obtener datos del cuerpo de la solicitud
    const body = await req.json();

    // Validar datos con Zod
    const validatedData = patientSettingsSchema.parse(body);

    // Buscar configuración existente
    const existingSettings = await db.query.patientSettings.findFirst({
      where: eq(patientSettings.userId, userId),
    });

    if (existingSettings) {
      // Actualizar configuración existente
      await db
        .update(patientSettings)
        .set({
          isf: validatedData.isf,
          icr: validatedData.icr,
          targetLow: validatedData.targetLow,
          targetHigh: validatedData.targetHigh,
          updatedAt: new Date(),
        })
        .where(eq(patientSettings.userId, userId));
    } else {
      // Crear nueva configuración
      await db.insert(patientSettings).values({
        userId,
        isf: validatedData.isf,
        icr: validatedData.icr,
        targetLow: validatedData.targetLow,
        targetHigh: validatedData.targetHigh,
      });
    }

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
