import { GoogleGenerativeAI } from "@google/generative-ai"
import { GoogleGenerativeAIStream, StreamingTextResponse } from "ai"
import { getServerSession } from "next-auth"
import { db } from "@/lib/db"
import { eq } from "drizzle-orm"
import { glucoseReadings } from "@/lib/db/schema"

// Create a client
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || "")

export async function POST(req: Request) {
  // Extract the `messages` from the body of the request
  const { messages } = await req.json()

  // Get user session
  const session = await getServerSession()

  if (!session?.user) {
    return new Response("Unauthorized", { status: 401 })
  }

  // Get user glucose data
  const userId = Number.parseInt(session.user.id as string)
  let glucoseData = "No hay datos de glucosa disponibles."
  let metrics = "No hay métricas disponibles."

  try {
    const readings = await db
      .select()
      .from(glucoseReadings)
      .where(eq(glucoseReadings.userId, userId))
      .orderBy(glucoseReadings.timestamp)

    if (readings.length > 0) {
      // Calculate metrics
      const inRange = readings.filter((r) => r.value >= 70 && r.value <= 180).length
      const below = readings.filter((r) => r.value < 70).length
      const above = readings.filter((r) => r.value > 180).length

      const timeInRange = Math.round((inRange / readings.length) * 100)
      const timeBelow = Math.round((below / readings.length) * 100)
      const timeAbove = Math.round((above / readings.length) * 100)

      const sum = readings.reduce((acc, r) => acc + r.value, 0)
      const avg = Math.round(sum / readings.length)

      // Get recent readings
      const recentReadings = readings
        .slice(-10)
        .map((r) => `${new Date(r.timestamp).toLocaleString()}: ${r.value} mg/dL (${r.trend || "sin tendencia"})`)
        .join("\n")

      glucoseData = `Últimas 10 lecturas de glucosa:\n${recentReadings}`

      metrics = `
        Métricas de glucosa:
        - Tiempo en Rango (70-180 mg/dL): ${timeInRange}%
        - Tiempo Bajo Rango (<70 mg/dL): ${timeBelow}%
        - Tiempo Alto Rango (>180 mg/dL): ${timeAbove}%
        - Glucosa Promedio: ${avg} mg/dL
      `
    }
  } catch (error) {
    console.error("Error fetching glucose data for AI context:", error)
  }

  // Initialize Gemini model with appropriate context
  const model = genAI.getGenerativeModel({ model: "gemini-pro" })

  // Prepare the conversation history for Gemini
  const prompt = `
    Eres un asistente especializado en diabetes tipo 1 (DM1) llamado GlucoForecast AI. 
    Tu objetivo es ayudar a pacientes con DM1 a entender sus datos de glucosa, identificar patrones y proporcionar información educativa.
    
    Contexto sobre el usuario:
    - El usuario tiene diabetes tipo 1
    - Utiliza un monitor continuo de glucosa FreeStyle Libre
    - Los rangos objetivo son: 70-180 mg/dL
    - Valores por debajo de 70 mg/dL se consideran hipoglucemia
    - Valores por encima de 180 mg/dL se consideran hiperglucemia
    
    Datos actuales del usuario:
    ${glucoseData}
    
    ${metrics}
    
    Responde de manera clara, empática y educativa. Proporciona explicaciones sobre los patrones que identifiques y sugiere posibles acciones, pero aclara que no estás reemplazando el consejo médico profesional.
    
    Historial de conversación:
    ${messages.map((message: any) => `${message.role === "user" ? "Usuario" : "Asistente"}: ${message.content}`).join("\n")}
  `

  // Convert messages to Gemini format
  const lastMessage = messages[messages.length - 1].content

  // Generate a response
  const response = await model.generateContentStream(prompt + "\n\nUsuario: " + lastMessage)

  // Convert the response to a streaming response
  const stream = GoogleGenerativeAIStream(response)

  // Return the streaming response
  return new StreamingTextResponse(stream)
}
