import { AIAssistant } from "@/components/ai-assistant";

export default function AIPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Asistente de IA</h1>
        <p className="text-muted-foreground">
          Asistente de IA para ayudarte a entender tus tendencias de glucosa
        </p>
      </div>
      <AIAssistant />
    </div>
  );
}
