import { NextResponse } from "next/server";
import NextAuth from "next-auth";

import authConfig from "./auth.config";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { nextUrl } = req;
  const isAuthenticated = !!req.auth;

  // Rutas públicas que no requieren autenticación
  const publicPaths = ["/auth"];
  const isPublicPath = nextUrl.pathname === "/" || publicPaths.some((path) => nextUrl.pathname.startsWith(path));

  // Redirigir a login si no está autenticado y la ruta no es pública
  if (!isAuthenticated && !isPublicPath) {
    const url = new URL("/auth/login", nextUrl.origin);
    url.searchParams.set("callbackUrl", encodeURI(nextUrl.pathname));
    return NextResponse.redirect(url);
  }

  // Redirigir al dashboard si está autenticado y está en una ruta pública o raíz
  if (isAuthenticated && (isPublicPath || nextUrl.pathname === "/")) {
    return NextResponse.redirect(new URL("/dashboard", nextUrl.origin));
  }

  return NextResponse.next();
});

// Configurar las rutas que deben ser manejadas por el middleware
export const config = {
  matcher: [
    "/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
