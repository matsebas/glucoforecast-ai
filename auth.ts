import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { eq } from "drizzle-orm";
import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { ZodError } from "zod";

import { verifyPassword } from "@/lib/auth";
import { accounts, sessions, users, verificationToken } from "@/lib/db/schema";

import authConfig from "./auth.config";
import { db } from "./lib/db";
import { signInSchema } from "./lib/validations/auth";

/**
 * Configuración completa de NextAuth v5 para la aplicación
 *
 * Extiende auth.config.ts con:
 * - Drizzle adapter para persistencia en base de datos
 * - CredentialsProvider para login con email/password
 * - Configuración de sesión JWT
 *
 * NO compatible con Edge Runtime debido al uso de DB
 */
export const { handlers, auth } = NextAuth({
  ...authConfig,
  // Configuración de base de datos
  adapter: DrizzleAdapter(db, {
    sessionsTable: sessions,
    usersTable: users,
    accountsTable: accounts,
    verificationTokensTable: verificationToken,
  }),
  // Configuración de sesión
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
    maxAge: 2 * 24 * 60 * 60, // 2 días
  },
  // Providers: combina edge-compatible + DB-dependent
  providers: [
    ...authConfig.providers, // Google (edge-compatible)
    // CredentialsProvider (requiere DB, no edge-compatible)
    CredentialsProvider({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        try {
          const { email, password } = await signInSchema.parseAsync(credentials);

          const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
          const user = result[0];

          if (!user) {
            throw new Error("Usuario no encontrado.");
          }

          if (!user.password) {
            throw new Error("Usuario registrado con la cuenta de Google.");
          }

          const isPasswordValid = await verifyPassword(password, user.password);

          if (!isPasswordValid) {
            throw new Error("Contraseña incorrecta.");
          }

          return user;
        } catch (error) {
          if (error instanceof ZodError) {
            (error as ZodError).errors.forEach((err) => {
              console.error(err.message);
            });
          } else {
            console.error(error);
          }
          return null;
        }
      },
    }),
  ],
});
