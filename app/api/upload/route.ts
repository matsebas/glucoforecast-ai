import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/auth";
import { registerUploadedFile } from "@/lib/services/files";
import { processLibreViewCSV } from "@/lib/services/libreview";
import { globalProgressCallbacks } from "@/lib/services/progress";
import { UploadResponse } from "@/lib/types";

export async function POST(request: NextRequest): Promise<NextResponse<UploadResponse>> {
  try {
    // Verificar la autenticación del usuario
    const session = await auth();

    if (!session || !session.user?.id) {
      return NextResponse.json({ success: false, message: "No autorizado" }, { status: 401 });
    }

    const userId = session.user.id;

    // Obtener el archivo del formulario multipart
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, message: "No se ha proporcionado ningún archivo" },
        { status: 400 }
      );
    }

    // Verificar que el archivo sea un CSV
    if (file.type !== "text/csv" && !file.name.endsWith(".csv")) {
      return NextResponse.json(
        { success: false, message: "El archivo debe ser un CSV válido" },
        { status: 400 }
      );
    }

    // Verificar el tamaño del archivo (máximo 15MB)
    const maxSize = 15 * 1024 * 1024; // 15MB en bytes
    if (file.size > maxSize) {
      return NextResponse.json(
        { success: false, message: "El archivo es demasiado grande. El tamaño máximo es de 15MB" },
        { status: 400 }
      );
    }

    // Registrar el archivo en la base de datos
    const fileId = await registerUploadedFile(userId, file.name, file.size, file.type);

    // Iniciar el procesamiento en segundo plano
    processLibreViewCSV(userId, fileId, file, (progress, processed, total) => {
      // Esta función será llamada con actualizaciones de progreso
      // El endpoint SSE usará este callback para enviar actualizaciones al cliente
      const callback = globalProgressCallbacks.get(fileId.toString());
      if (callback) {
        callback(progress, processed, total);
      }
    }).catch(error => {
      console.error("Error en el procesamiento en segundo plano:", error);
    });

    // Devolver inmediatamente con el fileId
    return NextResponse.json({
      success: true,
      message: "Archivo recibido. Procesamiento iniciado.",
      fileId,
    });
  } catch (error) {
    console.error("Error al procesar el archivo de glucosa:", error);
    const errorMessage = error instanceof Error ? error.message : "Error al procesar el archivo";
    return NextResponse.json({ success: false, message: errorMessage }, { status: 500 });
  }
}
