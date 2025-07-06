import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { LoginButton } from "@/components/login-button";

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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            GlucoForecast AI
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mb-8">
            Gestión Inteligente de Diabetes Tipo 1
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 shadow-xl rounded-lg p-8 space-y-6">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Inicia sesión para continuar
            </h2>
            <LoginButton />
          </div>

          <div className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
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
        </div>
      </div>
    </div>
  );
}
