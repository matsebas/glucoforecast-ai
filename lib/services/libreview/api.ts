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
   * @returns LibreUserData si la autenticación fue exitosa
   */
  async authenticate(email: string, password: string): Promise<LibreUserData> {
    if (!email || !password) {
      return Promise.reject(new Error("Email y contraseña son obligatorios"));
    }

    try {
      // Inicializar el cliente
      this.client = new LibreLinkClient({ email, password });

      // Intentar login
      const response = await this.client.login();

      // Validar respuesta de login
      if (!response || response.status !== 0) {
        return Promise.reject(
          new Error(
            `Autenticación fallida con LibreLink. Estado: ${response?.status || "desconocido"}`
          )
        );
      }

      // Obtener conexiones
      const connectionData: LibreConnectionsResponse = await this.client.fetchConnections();

      // Validar respuesta de conexiones
      if (!connectionData || connectionData.status !== 0) {
        return Promise.reject(
          new Error(
            `No se pudieron obtener las conexiones de LibreLink. Estado: ${connectionData?.status || "desconocido"}`
          )
        );
      }

      // Validar que existan conexiones
      if (!connectionData.data || connectionData.data.length === 0) {
        return Promise.reject(
          new Error("No se encontraron conexiones asociadas a esta cuenta de LibreLink.")
        );
      }

      // Construcción del objeto de retorno
      return {
        id: response.data.user.id,
        email: response.data.user.email,
        firstName: response.data.user.firstName,
        lastName: response.data.user.lastName,
        connections: connectionData.data,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Error desconocido";
      return Promise.reject(
        Error(`Error al autenticar con LibreLink: ${errorMessage}`, { cause: error })
      );
    }
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

    try {
      if (!patientConnection) {
        return {
          success: false,
          message: "No se pudo obtener la conexión del paciente de LibreLink",
        };
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
    } catch (error) {
      console.error("Error al obtener datos de LibreLink:", error);
      throw error instanceof Error
        ? error
        : new Error("Error desconocido al obtener datos de LibreLink");
    }
  }
}

/**
 * Función para sincronizar datos de LibreLink para un usuario
 * @param userId ID del usuario
 * @param email Email del usuario en LibreLink
 * @param password Contraseña del usuario en LibreLink
 * @returns Respuesta con información sobre el proceso
 */
export async function syncLibreLinkData(
  userId: string,
  email: string,
  password: string
): Promise<UploadResponse> {
  const service = new LibreLinkService(userId);

  const authenticated = await service.authenticate(email, password);
  if (!authenticated) {
    return {
      success: false,
      message: "No se pudo autenticar con LibreLink. Verifique sus credenciales.",
    };
  }

  return await service.fetchAndStoreGlucoseData(authenticated.connections[0]); // Usar la primera conexión disponible
}
