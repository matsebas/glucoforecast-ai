import crypto from "crypto";

import { and, eq } from "drizzle-orm";

import { hashPassword } from "@/lib/auth";
import { db } from "@/lib/db";
import { users, verificationToken } from "@/lib/db/schema";

const TOKEN_EXPIRY_MINUTES = 30;

export async function createPasswordResetToken(
  email: string
): Promise<{ success: boolean; token?: string; expiresAt?: Date; expiresIn?: number }> {
  try {
    // Verificar que el usuario existe
    const userResult = await db.select().from(users).where(eq(users.email, email)).limit(1);
    const user = userResult[0];

    if (!user) {
      // Por seguridad, no revelamos si el email existe
      return { success: true };
    }

    // Generar token seguro
    const resetToken = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + TOKEN_EXPIRY_MINUTES * 60 * 1000);

    // Eliminar tokens existentes para este email
    await db.delete(verificationToken).where(eq(verificationToken.identifier, email));

    // Crear nuevo token
    await db.insert(verificationToken).values({
      identifier: email,
      token: resetToken,
      expires,
    });

    return {
      success: true,
      token: resetToken,
      expiresAt: expires,
      expiresIn: TOKEN_EXPIRY_MINUTES * 60,
    };
  } catch (error) {
    console.error("Error al crear el token de recuperación de contraseña:", error);
    return { success: false };
  }
}

export async function validatePasswordResetToken(
  token: string
): Promise<{ valid: boolean; email?: string }> {
  try {
    const now = new Date();

    const tokenResult = await db
      .select()
      .from(verificationToken)
      .where(and(eq(verificationToken.token, token)))
      .limit(1);

    const tokenRecord = tokenResult[0];

    if (!tokenRecord) {
      return { valid: false };
    }

    // Verificar que no haya expirado
    if (tokenRecord.expires < now) {
      // Eliminar token expirado
      await db.delete(verificationToken).where(eq(verificationToken.token, token));
      return { valid: false };
    }

    return { valid: true, email: tokenRecord.identifier };
  } catch (error) {
    console.error("Error al validar el token de recuperación de contraseña:", error);
    return { valid: false };
  }
}

export async function resetPassword(
  token: string,
  newPassword: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Validar token
    const { valid, email } = await validatePasswordResetToken(token);

    if (!valid || !email) {
      return { success: false, error: "Token inválido o expirado" };
    }

    // Hashear nueva contraseña
    const hashedPassword = await hashPassword(newPassword);

    // Actualizar contraseña del usuario
    await db.update(users).set({ password: hashedPassword }).where(eq(users.email, email));

    // Eliminar token usado
    await db.delete(verificationToken).where(eq(verificationToken.token, token));

    return { success: true };
  } catch (error) {
    console.error("Error al restablecer la contraseña:", error);
    return { success: false, error: "Error interno del servidor" };
  }
}
