"use client";

import { parseLibreViewUrl, useLibreViewAuth } from "@/hooks/use-libreviewauth";

interface LibreViewDashboardProps {
  email: string;
  password: string;
  reportUrl: string;
}

export default function LibreViewDashboard({
  email,
  password,
  reportUrl,
}: LibreViewDashboardProps) {
  // Parsear la URL para obtener reportId y sessionId
  const reportParams = parseLibreViewUrl(reportUrl);

  const { user, reportData, loading, error, login, isAuthenticated, isTokenValid, refetchReport } =
    useLibreViewAuth({ email, password }, reportParams || undefined);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-lg">Cargando...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        <strong>Error:</strong> {error}
        {!isAuthenticated && (
          <button
            onClick={login}
            className="ml-4 bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
          >
            Reintentar Login
          </button>
        )}
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="text-center p-8">
        <p className="mb-4">No autenticado</p>
        <button
          onClick={login}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Iniciar Sesión
        </button>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">LibreView Dashboard</h1>
        <div className="text-sm text-gray-600">
          <p>
            Usuario: {user?.firstName} {user?.lastName}
          </p>
          <p>Email: {user?.email}</p>
          <p>País: {user?.country}</p>
          <p>Token: {isTokenValid ? "Válido" : "Expirado"}</p>
          <p>Dispositivos: {Object.keys(user?.devices || {}).length}</p>
        </div>
      </div>

      {reportData && (
        <div className="mt-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Datos del Reporte</h2>
            <button
              onClick={refetchReport}
              className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600"
            >
              Actualizar
            </button>
          </div>
          <div className="bg-gray-100 p-4 rounded max-h-96 overflow-auto">
            <pre className="text-sm">{JSON.stringify(reportData, null, 2)}</pre>
          </div>
        </div>
      )}

      {!reportData && reportParams && (
        <div className="mt-6 text-center">
          <p>No se pudieron cargar los datos del reporte</p>
          <button
            onClick={refetchReport}
            className="mt-2 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Cargar Reporte
          </button>
        </div>
      )}
    </div>
  );
}
