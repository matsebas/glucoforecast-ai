/**
 * Mensajes centralizados para el sistema de procesamiento de CSV
 */

export const PROCESSING_MESSAGES = {
  // Fase de validación
  VALIDATION_STARTED: "Iniciando validación de registros duplicados...",
  VALIDATION_IN_PROGRESS: "Validando registros duplicados...",
  VALIDATION_DESCRIPTION: "Verificando cuáles registros ya existen en la base de datos",
  
  // Resultados de validación
  ALL_DUPLICATES: "Validación completada. Todos los registros ya existían en la base de datos.",
  NEW_RECORDS_FOUND: (count: number) => `Validación completada. Se encontraron ${count} registros nuevos para procesar.`,
  
  // Procesamiento
  PROCESSING_RECORDS: "Procesando registros nuevos...",
  
  // Finalización
  COMPLETED_ALL_DUPLICATES: "Procesamiento completado. Todos los registros ya existían en la base de datos.",
  COMPLETED_WITH_INSERTS: (count: number) => `Procesamiento completado con éxito. Se insertaron ${count} registros nuevos.`,
  
  // Estados generales
  FILE_RECEIVED: "Archivo recibido!",
  SSE_CONNECTED: "Conexión SSE establecida",
  
  // Procesamiento de lotes  
  BATCH_PROCESSED: (processed: number, total: number, progress: number) => 
    `Lote procesado: ${processed}/${total} → ${progress}%`,
    
  // Contadores
  RECORDS_PROCESSED: (count: number) => `Se han procesado ${count} registros de glucosa.`,
} as const;

export const UI_LABELS = {
  VALIDATION_STATUS: "Analizando...",
  UPLOAD_SUCCESS: "Éxito",
  UPLOAD_ERROR: "Error",
} as const;