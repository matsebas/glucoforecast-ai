import { LibreLinkClient } from "libre-link-unofficial-api";
import { LibreConnection } from "libre-link-unofficial-api/dist/types";

import { LibreConnectionsResponse, NewCsvRecord, UploadResponse } from "@/lib/types";

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
   * @returns true si la autenticación fue exitosa
   */
  async authenticate(email: string, password: string): Promise<boolean> {
    try {
      this.client = new LibreLinkClient({ email, password });
      await this.client.login();
      return true;
    } catch (error) {
      console.error("Error al autenticar con LibreLink:", error);
      return false;
    }
  }

  async getPatientsList(): Promise<LibreConnection[]> {
    if (!this.client) {
      throw new Error("No se ha autenticado con LibreLink. Llame a authenticate() primero.");
    }

    const { data: connections }: LibreConnectionsResponse = await this.client.fetchConnections();

    if (!connections) {
      throw new Error("No se pudieron obtener las conexiones de LibreLink");
    }

    return connections;
  }

  /**
   * Obtiene las lecturas de glucosa desde LibreLink y las guarda en la base de datos
   * @param days Número de días de datos a obtener (por defecto 90)
   * @returns Respuesta con información sobre el proceso
   */
  async fetchAndStoreGlucoseData(days: number = 90): Promise<UploadResponse> {
    if (!this.client) {
      throw new Error("No se ha autenticado con LibreLink. Llame a authenticate() primero.");
    }

    try {
      // Obtener datos de glucosa de LibreLink
      const patientData = this.client.me;

      if (!patientData) {
        return {
          success: false,
          message: "No se pudieron obtener los datos del paciente de LibreLink",
        };
      }
      const connectionData: LibreConnectionsResponse = await this.client.fetchConnections();
      const patientConnection = connectionData.data[0];

      if (!patientConnection) {
        return {
          success: false,
          message: "No se pudo obtener la conexión del paciente de LibreLink",
        };
      }

      const glucoseData = await this.client.logbook();

      if (!glucoseData || !glucoseData.length) {
        return {
          success: false,
          message: "No se encontraron datos de glucosa en LibreLink",
        };
      }

      // Transformar datos al formato esperado por la aplicación
      const recordsToInsert: NewCsvRecord[] = [];

      // Procesar lecturas de glucosa
      for (const reading of glucoseData) {
        const timestamp = new Date(reading.timestamp);

        // Crear registro para la base de datos
        const record: NewCsvRecord = {
          userId: this.userId,
          timestamp,
          recordType: "1", // 0 para histórico, 1 para escaneo
          device: patientConnection.patientDevice.did,
          serialNumber: patientConnection.sensor.sn || "Unknown",
          glucose: reading.value,
          rapidInsulin: null,
          longInsulin: null,
          carbs: null,
          notes: null,
        };

        recordsToInsert.push(record);
      }

      recordsToInsert.forEach((record) => {
        console.info("Insertando registro:", record);
      });

      // // Obtener registros existentes para evitar duplicados
      // const existingRecords = await db
      //   .select({
      //     userId: csvRecords.userId,
      //     timestamp: csvRecords.timestamp,
      //     recordType: csvRecords.recordType,
      //   })
      //   .from(csvRecords)
      //   .where(eq(csvRecords.userId, this.userId));
      //
      // // Crear un Set para búsquedas rápidas
      // const existingSet = new Set(
      //   existingRecords.map((r) => `${r.userId}-${r.timestamp.toISOString()}-${r.recordType}`)
      // );
      //
      // // Filtrar duplicados
      // const uniqueRecords = recordsToInsert.filter((record) => {
      //   const key = `${record.userId}-${record.timestamp.toISOString()}-${record.recordType}`;
      //   return !existingSet.has(key);
      // });
      //
      // // Insertar registros únicos en la base de datos
      // if (uniqueRecords.length > 0) {
      //   await db.insert(csvRecords).values(uniqueRecords);
      // }

      return {
        success: true,
        message: `Se importaron ${recordsToInsert.length} lecturas de glucosa desde LibreLink`,
        count: recordsToInsert.length,
      };
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
 * @param days Número de días de datos a obtener
 * @returns Respuesta con información sobre el proceso
 */
export async function syncLibreLinkData(
  userId: string,
  email: string,
  password: string,
  days: number = 90
): Promise<UploadResponse> {
  const service = new LibreLinkService(userId);

  const authenticated = await service.authenticate(email, password);
  if (!authenticated) {
    return {
      success: false,
      message: "No se pudo autenticar con LibreLink. Verifique sus credenciales.",
    };
  }

  return await service.fetchAndStoreGlucoseData(days);
}
