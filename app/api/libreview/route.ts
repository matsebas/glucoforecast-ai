import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/auth";
import { syncLibreLinkData } from "@/lib/services/libreview/api";

/**
 * POST /api/libreview
 * Sincroniza datos de glucosa desde LibreView
 *
 * Body:
 * - email: Email del usuario en LibreView
 * - password: Contraseña del usuario en LibreView
 * - days: (opcional) Número de días de datos a obtener (por defecto 90)
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
    const { email, password, days = 90 } = body;

    // Validar datos requeridos
    if (!email || !password) {
      return NextResponse.json(
        { error: "Se requieren email y password de LibreView" },
        { status: 400 }
      );
    }

    // Sincronizar datos de LibreView
    const result = await syncLibreLinkData(userId, email, password, days);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error al sincronizar datos de LibreView:", error);

    return NextResponse.json(
      {
        error: "Error al sincronizar datos de LibreView",
        message: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 }
    );
  }
}
