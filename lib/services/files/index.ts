import { desc, eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { uploadedFiles } from "@/lib/db/schema";
import { UploadedFile } from "@/lib/types";

/**
 * Registra un archivo subido
 * @param userId Identificador del usuario
 * @param originalFilename Nombre original del archivo
 * @param fileSize Tamaño del archivo
 * @param mimeType Tipo MIME del archivo (default: "application/csv")
 */
export async function registerUploadedFile(
  userId: string,
  originalFilename: string,
  fileSize: number,
  mimeType: string = "application/csv"
): Promise<number> {
  try {
    const [result] = await db
      .insert(uploadedFiles)
      .values({
        userId,
        originalFilename,
        fileSize,
        mimeType,
        recordsProcessed: 0,
        uploadedAt: new Date(),
      })
      .returning({ id: uploadedFiles.id });

    return result.id;
  } catch (error) {
    console.error("Error al registrar archivo subido:", error);
    throw new Error("Error al registrar el archivo subido");
  }
}

/**
 * Actualiza el número de registros procesados para un archivo subido
 * @param fileId Identificador del archivo
 * @param recordsProcessed Número de registros procesados
 */
export async function updateProcessedRecords(
  fileId: number,
  recordsProcessed: number
): Promise<void> {
  try {
    await db.update(uploadedFiles).set({ recordsProcessed }).where(eq(uploadedFiles.id, fileId));
  } catch (error) {
    console.error("Error al actualizar registros procesados:", error);
    throw new Error("Error al actualizar la información del archivo");
  }
}

/**
 * Obtiene la lista de archivos subidos por un usuario
 */
export async function getUserUploadedFiles(userId: string): Promise<UploadedFile[]> {
  try {
    return await db
      .select()
      .from(uploadedFiles)
      .where(eq(uploadedFiles.userId, userId))
      .orderBy(desc(uploadedFiles.uploadedAt));
  } catch (error) {
    console.error("Error al obtener archivos subidos:", error);
    throw new Error("Error al obtener la lista de archivos subidos");
  }
}
