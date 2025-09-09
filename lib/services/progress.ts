/* eslint-disable no-unused-vars */

/**
 * Servicios para gestionar el progreso de subida de archivos
 * @module services/progress
 */

// Definición de tipo para la función de callback de progreso
export type ProgressCallback = (
  progress: number,
  processedCount: number,
  totalCount: number,
  insertedCount?: number
) => void;

// Definición de tipo para callbacks de eventos específicos
export type EventCallback = (type: string, data: any) => void;

// Mapa para almacenar callbacks de progreso por fileId
export const globalProgressCallbacks = new Map<string, ProgressCallback>();

// Mapa para almacenar callbacks de eventos por fileId
export const globalEventCallbacks = new Map<string, EventCallback>();

// Registrar un callback de progreso para un archivo específico
export function registerProgressCallback(fileId: string, callback: ProgressCallback): void {
  globalProgressCallbacks.set(fileId, callback);
}

// Registrar un callback de eventos para un archivo específico  
export function registerEventCallback(fileId: string, callback: EventCallback): void {
  globalEventCallbacks.set(fileId, callback);
}

// Eliminar un callback de progreso cuando ya no sea necesario
export function removeProgressCallback(fileId: string): void {
  globalProgressCallbacks.delete(fileId);
}

// Eliminar un callback de eventos cuando ya no sea necesario
export function removeEventCallback(fileId: string): void {
  globalEventCallbacks.delete(fileId);
}

// Llamar al callback de progreso para un archivo específico
export function updateProgress(
  fileId: string | number,
  progress: number,
  processedCount: number,
  totalCount: number,
  insertedCount?: number
): void {
  const callback = globalProgressCallbacks.get(fileId.toString());
  if (callback) {
    callback(progress, processedCount, totalCount, insertedCount);
  }
}

// Enviar un evento específico para un archivo
export function sendEvent(fileId: string | number, type: string, data: any): void {
  const callback = globalEventCallbacks.get(fileId.toString());
  if (callback) {
    callback(type, data);
  }
}
