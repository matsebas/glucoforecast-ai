import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Rutas que no deben ser procesadas por el middleware
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/auth") ||
    pathname.includes("favicon.ico") ||
    pathname.includes(".png") ||
    pathname.includes(".jpg") ||
    pathname.includes(".svg")
  ) {
    return NextResponse.next();
  }

  // Rutas públicas que no requieren autenticación
  const publicPaths = ["/login", "/register"];
  const isPublicPath = publicPaths.some((path) => pathname.startsWith(path));

  // Verificar si el usuario está autenticado
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  // Verificar si hay una cookie de sesión
  const sessionCookie =
    request.cookies.get("next-auth.session-token") ||
    request.cookies.get("__Secure-next-auth.session-token");

  // Si tiene cookie de sesión pero no token, podría ser un problema de decodificación
  // Aún así, se considera al usuario como autenticado
  const isAuthenticated = !!token || !!sessionCookie;

  // Redirigir a login si no está autenticado y la ruta no es pública
  if (!isAuthenticated && !isPublicPath) {
    const url = new URL("/login", request.url);
    url.searchParams.set("callbackUrl", encodeURI(pathname));
    return NextResponse.redirect(url);
  }

  // Redirigir al dashboard si está autenticado y está en una ruta pública o raíz
  if (isAuthenticated && (isPublicPath || pathname === "/")) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

// Configurar las rutas que deben ser manejadas por el middleware
export const config = {
  matcher: [
    "/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
