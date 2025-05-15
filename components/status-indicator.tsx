import { Database, ServerOffIcon as DatabaseOff, Wifi, WifiOff } from "lucide-react";

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface StatusIndicatorProps {
  isConnected: boolean;
  hasData: boolean;
}

export function StatusIndicator({ isConnected, hasData }: StatusIndicatorProps) {
  return (
    <div className="flex items-center gap-2">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-1 rounded-full bg-muted px-2 py-1">
              {isConnected ? (
                <Wifi className="h-4 w-4 text-green-500" />
              ) : (
                <WifiOff className="h-4 w-4 text-red-500" />
              )}
              <span className="text-xs font-medium">
                {isConnected ? "Conectado" : "Desconectado"}
              </span>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>Estado de conexión con FreeStyle Libre API</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-1 rounded-full bg-muted px-2 py-1">
              {hasData ? (
                <Database className="h-4 w-4 text-green-500" />
              ) : (
                <DatabaseOff className="h-4 w-4 text-red-500" />
              )}
              <span className="text-xs font-medium">
                {hasData ? "Datos disponibles" : "Sin datos"}
              </span>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>Estado de disponibilidad de datos de glucosa</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}
