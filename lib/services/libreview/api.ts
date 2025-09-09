import { LibreLinkClient } from "libre-link-unofficial-api";
import { LibreConnection } from "libre-link-unofficial-api/dist/types";

import { LibreConnectionsResponse, LibreUserData, UploadResponse } from "@/lib/types";

import { parseGlucoseReadings } from "./parsers";
import { GlucoseRecordProcessor } from "./processor";

/**
 * Clase para gestionar la conexión con LibreLink API
 */
export class LibreLinkService {
  private client: LibreLinkClient | null = null;
  private userId: string;

  constructor(userId: string) {
    this.userId = userId;
  }

  /**
   * Inicializa y autentica el cliente de LibreLink
   * @param email Email del usuario en LibreLink
   * @param password Contraseña del usuario en LibreLink
   * @param patientId Id del paciente (opcional)
   * @returns LibreUserData si la autenticación fue exitosa
   */
  async authenticate(email: string, password: string, patientId?: string): Promise<LibreUserData> {
    if (!email || !password) {
      return Promise.reject(new Error("Email y contraseña son obligatorios"));
    }

    try {
      this.client = new LibreLinkClient({
        email,
        password,
        patientId,
      });

      console.info(
        "Cliente de LibreLink inicializado:",
        email,
        patientId || "SIN Paciente específico"
      );

      const response = await this.client.login();

      // 🚨 Manejar caso "debe aceptar términos"
      if (response?.status === 4) {
        console.warn("El usuario debe aceptar términos, enviando aceptación...");

        const token = response.data.authTicket.token; // el Bearer
        const api = "https://api.libreview.io/auth/continue/pp";

        const touRes = await fetch(api, {
          method: "POST",
          headers: {
            Accept: "application/json, application/xml",
            "Content-Type": "application/json",
            product: "llu.android",
            version: "4.7",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({}), // algunos back aceptan vacío, otros requieren {"accept": true}
        });

        console.info(touRes);
        if (!touRes.ok) {
          throw new Error(`Falló aceptación de términos: ${touRes.status}`);
        }

        console.info("Términos aceptados, reintentando login...");
        const retryResponse = await this.client.login();

        if (!retryResponse || retryResponse.status !== 0) {
          throw new Error(
            `Autenticación fallida después de aceptar términos. Estado: ${retryResponse?.status || "desconocido"}`
          );
        }

        return await this.fetchUserData(retryResponse);
      }

      // 🚨 Validar login normal
      if (!response || response.status !== 0) {
        throw new Error(
          `Autenticación fallida con LibreLink. Estado: ${response?.status || "desconocido"}`
        );
      }

      return await this.fetchUserData(response);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Error desconocido";
      return Promise.reject(
        Error(`Error al autenticar con LibreLink: ${errorMessage}`, { cause: error })
      );
    }
  }

  private async fetchUserData(loginResponse: any): Promise<LibreUserData> {
    const connectionData: LibreConnectionsResponse = await this.client!.fetchConnections();

    if (!connectionData || connectionData.status !== 0) {
      throw new Error(
        `No se pudieron obtener las conexiones de LibreLink. Estado: ${connectionData?.status || "desconocido"}`
      );
    }

    if (!connectionData.data || connectionData.data.length === 0) {
      throw new Error("No se encontraron conexiones asociadas a esta cuenta de LibreLink.");
    }

    return {
      id: loginResponse.data.user.id,
      email: loginResponse.data.user.email,
      firstName: loginResponse.data.user.firstName,
      lastName: loginResponse.data.user.lastName,
      connections: connectionData.data,
    };
  }

  /**
   * Obtiene las lecturas de glucosa desde LibreLink y las guarda en la base de datos
   * @param patientConnection Conexión del paciente obtenida de LibreLink
   * @returns Respuesta con información sobre el proceso
   */
  async fetchAndStoreGlucoseData(patientConnection: LibreConnection): Promise<UploadResponse> {
    if (!this.client) {
      return Promise.reject(
        new Error("No se ha autenticado con LibreLink. Llame a authenticate() primero.")
      );
    }

    const glucoseReadings = await this.client.history();

    if (!glucoseReadings || !glucoseReadings.length) {
      return {
        success: false,
        message: "No se encontraron datos de glucosa en LibreLink",
      };
    }

    const { records, errors } = parseGlucoseReadings(
      glucoseReadings,
      this.userId,
      patientConnection
    );

    // Log errores de parsing si existen
    if (errors.length > 0) {
      console.warn(
        `Errores de parsing en API LibreLink: ${errors.length} registros fallaron`,
        errors
      );
    }

    // Usar el procesador centralizado
    const processor = new GlucoseRecordProcessor(this.userId, {
      sourceName: "LibreLink API",
    });

    return await processor.processAndStore(records);
  }
}
