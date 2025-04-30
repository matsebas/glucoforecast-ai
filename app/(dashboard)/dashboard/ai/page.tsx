import { AIAssistant } from "@/components/ai-assistant"

export default function AIPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Asistente de IA</h1>
        <p className="text-muted-foreground">
          Consulta con nuestro asistente de IA sobre tus tendencias de glucosa y patrones
        </p>
      </div>
      <AIAssistant />
    </div>
  )
}
