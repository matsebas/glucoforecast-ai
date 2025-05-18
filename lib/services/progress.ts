/* eslint-disable no-unused-vars */

/**
 * Servicios para gestionar el progreso de subida de archivos
 * @module services/progress
 */

// Definición de tipo para la función de callback de progreso
export type ProgressCallback = (
  progress: number,
  processedCount: number,
  totalCount: number
) => void;

// Mapa para almacenar callbacks de progreso por fileId
export const globalProgressCallbacks = new Map<string, ProgressCallback>();

// Registrar un callback de progreso para un archivo específico
export function registerProgressCallback(fileId: string, callback: ProgressCallback): void {
  globalProgressCallbacks.set(fileId, callback);
}

// Eliminar un callback de progreso cuando ya no sea necesario
export function removeProgressCallback(fileId: string): void {
  globalProgressCallbacks.delete(fileId);
}

// Llamar al callback de progreso para un archivo específico
export function updateProgress(
  fileId: string | number,
  progress: number,
  processedCount: number,
  totalCount: number
): void {
  const callback = globalProgressCallbacks.get(fileId.toString());
  if (callback) {
    callback(progress, processedCount, totalCount);
  }
}
