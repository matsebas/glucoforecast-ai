import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/auth";
import { LibreLinkService } from "@/lib/services/libreview/api";

/**
 * POST /api/libreview
 * Autentica con LibreView y devuelve información del usuario
 *
 * Body:
 * - email: Email del usuario en LibreView
 * - password: Contraseña del usuario en LibreView
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
    const { email, password } = body;

    // Validar datos requeridos
    if (!email || !password) {
      return NextResponse.json(
        { error: "Se requieren email y password de LibreView" },
        { status: 400 }
      );
    }

    // Autenticar con LibreView
    const service = new LibreLinkService(userId);
    const userData = await service.authenticate(email, password);

    return NextResponse.json({
      success: true,
      data: userData,
    });
  } catch (error) {
    console.error("Error al autenticar con LibreView:", error);

    return NextResponse.json(
      {
        error: "Error al autenticar con LibreView",
        message: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 }
    );
  }
}
