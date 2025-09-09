import { NextRequest } from "next/server";

import { registerProgressCallback, removeProgressCallback, registerEventCallback, removeEventCallback } from "@/lib/services/progress";
import { PROCESSING_MESSAGES } from "@/lib/constants/messages";

// Configuración para Vercel - timeout extendido para procesamiento de CSV
export const maxDuration = 300; // 5 minutos
export const dynamic = "force-dynamic";

/**
 * Endpoint para manejar las actualizaciones de progreso de un archivo
 * @param request
 * @constructor
 */
export async function GET(request: NextRequest) {
  const fileId = request.nextUrl.searchParams.get("fileId");

  if (!fileId) {
    return new Response("No se encontró el fileId", { status: 400 });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      // Función para enviar diferentes tipos de eventos
      const sendEvent = (type: string, data: any) => {
        console.info(`[${new Date().toISOString()}] 📊 SSE enviando evento [${type}] para fileId=${fileId}:`, data);
        const eventData = JSON.stringify({ type, ...data });
        controller.enqueue(encoder.encode(`data: ${eventData}\n\n`));
      };

      // Función legacy para compatibilidad con progreso
      const sendProgress = (progress: number, processedCount: number, totalCount: number, insertedCount?: number) => {
        if (progress === 100) {
          const finalInsertedCount = insertedCount ?? processedCount;
          sendEvent("completed", {
            progress,
            processedCount,
            totalCount,
            insertedCount: finalInsertedCount,
            message: finalInsertedCount === 0 
              ? PROCESSING_MESSAGES.COMPLETED_ALL_DUPLICATES
              : PROCESSING_MESSAGES.COMPLETED_WITH_INSERTS(finalInsertedCount)
          });
        } else {
          sendEvent("processing", {
            progress,
            processedCount,
            totalCount,
            insertedCount: insertedCount ?? processedCount,
            message: PROCESSING_MESSAGES.PROCESSING_RECORDS
          });
        }
      };

      // Registrar ambos callbacks en el mapa global
      registerProgressCallback(fileId, sendProgress);
      registerEventCallback(fileId, sendEvent);

      // Enviar evento inicial
      sendEvent("ready", { message: PROCESSING_MESSAGES.SSE_CONNECTED });

      // Cerrar el controlador cuando se aborta la solicitud
      request.signal.addEventListener("abort", () => {
        removeProgressCallback(fileId);
        removeEventCallback(fileId);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
