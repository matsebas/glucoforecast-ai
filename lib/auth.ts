import { compare, hash } from "bcryptjs";

/**
 * Función para encriptar contraseñas
 * @param password
 */
export async function hashPassword(password: string): Promise<string> {
  return hash(password, 10);
}

/**
 * Función para verificar contraseñas.
 * @param plainPassword Contraseña plana
 * @param hashedPassword Contraseña encriptada
 */
export async function verifyPassword(
  plainPassword: string,
  hashedPassword: string
): Promise<boolean> {
  return await compare(plainPassword, hashedPassword);
}
