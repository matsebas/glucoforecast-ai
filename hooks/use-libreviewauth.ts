import { useCallback, useEffect, useState } from "react";

// Tipos para las respuestas de la API
interface LoginResponse {
  status: number;
  data: {
    user: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
      country: string;
      devices: Record<string, Device>;
    };
    authTicket: {
      token: string;
      expires: number;
      duration: number;
    };
  };
}

interface Device {
  id: string;
  nickname: string;
  sn: string;
  type: number;
  uploadDate: number;
}

// Parámetros de entrada
interface LoginCredentials {
  email: string;
  password: string;
}

interface ReportParams {
  reportId: string;
  sessionId: string;
}

export const useLibreViewAuth = <T = any>(
  credentials: LoginCredentials | null,
  reportParams?: ReportParams
) => {
  const [loginData, setLoginData] = useState<LoginResponse["data"] | null>(null);
  const [reportData, setReportData] = useState<T | null>(null);
  const [loginLoading, setLoginLoading] = useState<boolean>(false);
  const [reportLoading, setReportLoading] = useState<boolean>(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [reportError, setReportError] = useState<string | null>(null);

  // Login function
  const login = useCallback(async (): Promise<void> => {
    if (!credentials) {
      setLoginError("Credenciales requeridas");
      return;
    }

    setLoginLoading(true);
    setLoginError(null);

    try {
      const response = await fetch("https://api-la.libreview.io/auth/login", {
        method: "POST",
        headers: {
          Accept: "application/json, text/plain, */*",
          "Content-Type": "application/json;charset=UTF-8",
          Origin: "https://www.libreview.com",
          Referer: "https://www.libreview.com/",
          Product: "lv",
          "Cache-Control": "no-cache",
        },
        body: JSON.stringify({
          email: credentials.email,
          password: credentials.password,
        }),
      });

      if (!response.ok) {
        throw new Error(`Login failed: ${response.status}`);
      }

      const loginResponse: LoginResponse = await response.json();

      if (loginResponse.status !== 0) {
        throw new Error("Login failed: Invalid credentials");
      }

      setLoginData(loginResponse.data);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Error desconocido en el login";

      setLoginError(errorMessage);
      setLoginData(null);
    } finally {
      setLoginLoading(false);
    }
  }, [credentials]);

  // Extract window.report from HTML
  const extractReportData = (htmlContent: string): T | null => {
    try {
      const reportMatch = htmlContent.match(/window\.report\s*=\s*({[\s\S]*?});/);

      if (!reportMatch || !reportMatch[1]) {
        throw new Error("No se encontró window.report en el HTML");
      }

      const reportData = JSON.parse(reportMatch[1]);
      return reportData as T;
    } catch (parseError) {
      throw new Error(`Error al parsear window.report: ${parseError}`);
    }
  };

  // Fetch report
  const fetchReport = useCallback(async (): Promise<void> => {
    if (!loginData || !reportParams) {
      setReportData(null);
      setReportError(null);
      return;
    }

    setReportLoading(true);
    setReportError(null);

    try {
      const url = `https://lrs-la.libreview.io/report/${reportParams.reportId}/${reportParams.sessionId}?session=${loginData.authTicket.token}`;

      const response = await fetch(url, {
        method: "GET",
        headers: {
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Cache-Control": "max-age=0",
          "Upgrade-Insecure-Requests": "1",
        },
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const htmlContent = await response.text();
      const data = extractReportData(htmlContent);

      setReportData(data);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Error desconocido al obtener el reporte";

      setReportError(errorMessage);
      setReportData(null);
    } finally {
      setReportLoading(false);
    }
  }, [loginData, reportParams]);

  const refetchReport = useCallback(async (): Promise<void> => {
    await fetchReport();
  }, [fetchReport]);

  // Auto login on mount
  useEffect(() => {
    if (credentials && !loginData) {
      login();
    }
  }, [credentials, loginData, login]);

  // Auto fetch report when login data is available
  useEffect(() => {
    if (loginData && reportParams) {
      fetchReport();
    }
  }, [loginData, reportParams, fetchReport]);

  return {
    // Datos de usuario
    user: loginData?.user || null,
    authToken: loginData?.authTicket.token || null,
    tokenExpires: loginData?.authTicket.expires || null,

    // Datos del reporte
    reportData,

    // Estados de carga
    loginLoading,
    reportLoading,
    loading: loginLoading || reportLoading,

    // Errores
    loginError,
    reportError,
    error: loginError || reportError,

    // Acciones
    login,
    refetchReport,

    // Estado de autenticación
    isAuthenticated: !!loginData?.authTicket.token,
    isTokenValid: loginData ? Date.now() < loginData.authTicket.expires * 1000 : false,
  };
};

// Helper para parsear URL de reporte
export const parseLibreViewUrl = (url: string): ReportParams | null => {
  try {
    const urlObj = new URL(url);
    const match = urlObj.pathname.match(/\/report\/([^\/]+)\/([^\/]+)/);
    if (!match) {
      throw new Error("URL no válida");
    }

    return {
      reportId: match[1],
      sessionId: match[2],
    };
  } catch {
    return null;
  }
};
