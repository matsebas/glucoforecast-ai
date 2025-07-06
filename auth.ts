import { eq } from "drizzle-orm";
import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { ZodError } from "zod";

import { verifyPassword } from "@/lib/auth";
import { users } from "@/lib/db/schema";

import { db } from "./lib/db";
import { signInSchema } from "./lib/validations/auth";

export const { handlers, auth } = NextAuth({
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
    maxAge: 2 * 24 * 60 * 60, // 2 días
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
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
    async jwt({ token, user, account }) {
      if (user && account) {
        token.id = user.id;
        token.name = user.name;
        token.email = user.email;
        token.picture = user.image;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        if (token.name) session.user.name = token.name;
        if (token.email) session.user.email = token.email;
        if (token.picture) session.user.image = token.picture;
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/login",
  },
});
