import { NextRequest } from "next/server";

import { registerProgressCallback, removeProgressCallback } from "@/lib/services/progress";

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
      // Function to send progress updates
      const sendProgress = (progress: number, processedCount: number, totalCount: number) => {
        const data = JSON.stringify({ progress, processedCount, totalCount });
        controller.enqueue(encoder.encode(`data: ${data}\n\n`));
      };

      // Registrar esta función en el mapa global para que la función de procesamiento pueda llamarla
      registerProgressCallback(fileId, sendProgress);

      // Enviar la primera actualización de progreso
      sendProgress(0, 0, 0);

      // Cerrar el controlador cuando se aborta la solicitud
      request.signal.addEventListener("abort", () => {
        removeProgressCallback(fileId);
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
