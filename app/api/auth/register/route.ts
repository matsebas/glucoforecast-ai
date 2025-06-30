import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { hashPassword } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { signUpSchema } from "@/lib/validations/auth";

export async function POST(request: Request) {
  try {
    console.debug("Iniciando registro de usuario..., request:", request);

    const body = await request.json();

    // Validar datos con Zod
    const result = signUpSchema.safeParse(body);

    if (!result.success) {
      // Formatear errores de Zod
      const formattedErrors = result.error.format();
      return NextResponse.json(
        { error: "Datos de registro inválidos", details: formattedErrors },
        { status: 400 }
      );
    }

    const { name, email, password } = result.data;

    // Verificar si el email ya existe
    const existingUser = await db.select().from(users).where(eq(users.email, email)).limit(1);

    if (existingUser.length > 0) {
      return NextResponse.json({ error: "El email ya está registrado" }, { status: 409 });
    }

    // Encriptar la contraseña
    const hashedPassword = await hashPassword(password);

    // Crear el usuario
    const newUser = await db
      .insert(users)
      .values({
        name,
        email,
        password: hashedPassword,
      })
      .returning({ id: users.id });

    return NextResponse.json({
      success: true,
      message: "Usuario registrado correctamente",
      userId: newUser[0].id,
    });
  } catch (error) {
    console.error("Error al registrar usuario:", error);

    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Datos de registro inválidos", details: error.format() },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: "Error al registrar usuario" }, { status: 500 });
  }
}
