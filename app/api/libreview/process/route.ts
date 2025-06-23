import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/auth";
import { LibreLinkService } from "@/lib/services/libreview/api";

/**
 * POST /api/libreview/process
 * Descarga y procesa datos de glucosa de un paciente específico de LibreView
 *
 * Body:
 * - email: Email del usuario en LibreView
 * - password: Contraseña del usuario en LibreView
 * - patientId: ID del paciente seleccionado
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
    const { email, password, patientId } = body;

    // Validar datos requeridos
    if (!email || !password || !patientId) {
      return NextResponse.json(
        { error: "Se requieren email, password y patientId" },
        { status: 400 }
      );
    }

    // Autenticar y obtener datos del usuario
    const service = new LibreLinkService(userId);
    const userData = await service.authenticate(email, password, patientId);

    // Buscar la conexión del paciente específico
    const patientConnection = userData.connections.find((conn) => conn.patientId === patientId);

    if (!patientConnection) {
      return NextResponse.json(
        { error: "No se encontró el paciente especificado" },
        { status: 404 }
      );
    }

    // Procesar datos del paciente
    const result = await service.fetchAndStoreGlucoseData(patientConnection);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error al procesar datos de LibreView:", error);

    return NextResponse.json(
      {
        error: "Error al procesar datos de LibreView",
        message: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 }
    );
  }
}
