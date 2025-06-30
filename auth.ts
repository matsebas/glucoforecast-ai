import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { eq } from "drizzle-orm";
import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { ZodError } from "zod";

import { verifyPassword } from "@/lib/auth";
import { accounts, sessions, users, verificationToken } from "@/lib/db/schema";

import { db } from "./lib/db";
import { signInSchema } from "./lib/validations/auth";

export const { handlers, auth } = NextAuth({
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationToken,
  }),
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
    maxAge: 30 * 60, // 30 minutos
    // maxAge: 2 * 24 * 60 * 60, // 2 días
  },
  providers: [
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

          // Verificar contraseña
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
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.name = user.name;
        token.email = user.email;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
});
