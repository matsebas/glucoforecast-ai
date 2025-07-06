import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

import { createPasswordResetToken } from "@/lib/services/auth";
import { forgotPasswordSchema } from "@/lib/validations/auth";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = forgotPasswordSchema.parse(body);

    const result = await createPasswordResetToken(email);

    if (!result.success) {
      return NextResponse.json({ error: "Error al procesar la solicitud" }, { status: 500 });
    }

    const token = result.token!;
    const expiresIn = result.expiresIn || 15 * 60; // 15 minutos por defecto

    // Construir link de recuperación
    const resetLink = `${process.env.RESET_URL_BASE}?token=${encodeURIComponent(token)}&email=${encodeURIComponent(email)}`;

    // Enviar email con Resend
    await resend.emails.send({
      from: process.env.RESEND_FROM!,
      to: email,
      subject: "Recuperación de contraseña - Gluco Forecast AI",
      html: `
        <p>Hola,</p>
        <p>Haz clic en el siguiente enlace para recuperar tu contraseña:</p>
        <p><a href="${resetLink}">${resetLink}</a></p>
        <p>Este enlace expirará en ${expiresIn} minutos.</p>
      `,
    });

    return NextResponse.json({
      message: "Si el email existe, recibirás un enlace de recuperación",
      // En desarrollo, devolvemos el token para testing
      ...(process.env.NODE_ENV === "development" && { token: result.token }),
    });
  } catch (error) {
    console.error("Error en forgot-password:", error);
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }
}
