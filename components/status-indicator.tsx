import {
  DatabaseBackup,
  DatabaseZap,
  ServerOffIcon as DatabaseOff,
  Settings2Icon,
  RouteOffIcon,
  Wifi,
  WifiOff,
} from "lucide-react";

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import Link from "next/link";

interface StatusIndicatorProps {
  isConnected: boolean;
  hasData: boolean;
  has90DaysData: boolean;
  hasPatientSettings: boolean;
}

export function StatusIndicator({ isConnected, hasData, has90DaysData, hasPatientSettings }: StatusIndicatorProps) {
  return (
    <div className="flex items-center gap-2">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-1 rounded-full bg-muted px-2 py-1">
              {isConnected ? (
                <Wifi className="size-4 text-green-500" />
              ) : (
                <WifiOff className="size-4 text-red-500" />
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
                <DatabaseZap className="size-4 text-green-500" />
              ) : (
                <DatabaseOff className="size-4 text-red-500" />
              )}
              <span className="text-xs font-medium">
                {hasData ? "Último día disponible" : "Sin datos último día"}
              </span>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>Estado de disponibilidad de datos de glucosa del último día</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-1 rounded-full bg-muted px-2 py-1">
              {has90DaysData ? (
                <DatabaseBackup className="size-4 text-green-500" />
              ) : (
                <DatabaseOff className="size-4 text-red-500" />
              )}
              <span className="text-xs font-medium">
                {has90DaysData ? "Últimos 90 días disponibles" : "Sin datos de los últimos 90 días"}
              </span>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>Estado de disponibilidad de datos de glucosa de los últimos 90 días</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Link href="/dashboard/settings">
              <div className="flex items-center gap-1 rounded-full bg-muted px-2 py-1 hover:bg-muted/80 transition-colors cursor-pointer">
                {hasPatientSettings ? (
                  <Settings2Icon className="size-4 text-green-500" />
                ) : (
                  <RouteOffIcon className="size-4 text-red-500" />
                )}
                <span className="text-xs font-medium">
                  {hasPatientSettings ? "Parámetros configurados" : "Parámetros sin configurar"}
                </span>
              </div>
            </Link>
          </TooltipTrigger>
          <TooltipContent>
            <p>Estado de configuración de parámetros del paciente (ISF, ICR, rangos objetivo)</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}
