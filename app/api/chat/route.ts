import { google } from "@ai-sdk/google";
import { streamText } from "ai";

import { auth } from "@/auth";
import { getSystemPrompt } from "@/lib/services/chat";
import { getUserMultiPeriodGlucoseAnalysis } from "@/lib/services/glucose";
import { getPatientSettings, PatientSettings } from "@/lib/services/settings";

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();
    const session = await auth();

    if (!session?.user?.id) {
      return new Response("Unauthorized", { status: 401 });
    }

    const userId = session.user.id;

    // Inicializar variables para el contexto de la IA
    let glucoseData = "No hay datos de glucosa disponibles.";
    let dayMetrics = "No hay métricas del último día disponibles.";
    let ninetyDaysMetrics = "No hay métricas de los últimos 90 días disponibles.";
    let patientSettings: Partial<PatientSettings> = {};

    try {
      // Obtener la configuración y los datos de glucosa del usuario
      patientSettings = await getPatientSettings(userId);
      const glucoseAnalysis = await getUserMultiPeriodGlucoseAnalysis(userId, ["day", "90days"]);

      if (glucoseAnalysis.day) {
        glucoseData = glucoseAnalysis.day.recentReadingsText;
        dayMetrics = glucoseAnalysis.day.metricsText;
      }

      if (glucoseAnalysis["90days"]) {
        ninetyDaysMetrics = glucoseAnalysis["90days"].metricsText;
      }
    } catch (error) {
      if (error instanceof Error && error.message === "PATIENT_SETTINGS_NOT_CONFIGURED") {
        console.info("Configuración del paciente no establecida para el usuario:", userId);
        // Dejar patientSettings como un objeto vacío, getSystemPrompt lo manejará
      } else {
        console.error("Error al obtener datos de glucosa para el contexto de IA:", error);
      }
    }

    // Generar el prompt del sistema usando la nueva función
    const systemPrompt = getSystemPrompt(
      patientSettings,
      glucoseData,
      dayMetrics,
      ninetyDaysMetrics
    );

    const messagesWithSystemPrompt = [
      {
        role: "system",
        content: systemPrompt,
      },
      ...messages,
    ];

    const result = streamText({
      model: google("gemini-2.0-flash"),
      messages: messagesWithSystemPrompt,
      onError({ error }) {
        console.error(error);
      },
    });

    return result.toDataStreamResponse();
  } catch (error) {
    console.error("Error processing request:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
