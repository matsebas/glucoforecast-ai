import GoogleProvider from "next-auth/providers/google";

import type { NextAuthConfig } from "next-auth";

/**
 * Configuración base de NextAuth v5 compatible con Edge Runtime
 *
 * Esta configuración se usa tanto en:
 * - middleware.ts (solo providers edge-compatible)
 * - auth.ts (configuración completa con DB)
 *
 * IMPORTANTE: Solo incluir providers y callbacks que funcionen en Edge Runtime
 */
export default {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true,
    }),
  ],
  callbacks: {
    async signIn({ account }) {
      // Permitir todos los logins de Google
      if (account?.provider === "google") {
        return true;
      }
      return true;
    },
    async jwt({ token, user, account }) {
      // Agregar datos del usuario al JWT
      if (user && account) {
        token.id = user.id;
        token.name = user.name;
        token.email = user.email;
        token.picture = user.image;
      }
      return token;
    },
    async session({ session, token }) {
      // Pasar datos del JWT a la sesión
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
} satisfies NextAuthConfig;
