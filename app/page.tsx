import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { LoginButton } from "@/components/login-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function HomePage() {
  const session = await auth();

  // Si está autenticado, redirigir al dashboard
  if (session) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-md w-full space-y-8 p-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-foreground mb-2">GlucoForecast AI</h1>
          <p className="text-muted-foreground mb-8">Gestión Inteligente de Diabetes Tipo 1</p>
        </div>

        <Card className="shadow-xl">
          <CardHeader className="text-center">
            <CardTitle className="text-xl font-semibold">Inicia sesión para continuar</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center">
              <LoginButton />
            </div>

            <div className="text-center text-sm text-muted-foreground">
              <p>
                Al iniciar sesión, aceptas nuestra&nbsp;
                <a
                  href="https://matsebas.github.io/glucoforecast-ai/privacy-policy.html"
                  target="_blank"
                  className="anchor text-blue-600 dark:text-blue-400 hover:underline"
                >
                  política de privacidad
                </a>
                .
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
