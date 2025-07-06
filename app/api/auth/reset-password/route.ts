import { NextRequest, NextResponse } from "next/server";

import { resetPassword } from "@/lib/services/auth";
import { resetPasswordSchema } from "@/lib/validations/auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, password } = resetPasswordSchema.parse(body);

    const result = await resetPassword(token, password);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Error al restablecer la contraseña" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      message: "Contraseña restablecida exitosamente",
    });
  } catch (error) {
    console.error("Error in reset-password:", error);
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }
}
