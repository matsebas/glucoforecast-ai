"use client";

import {
  Activity,
  AlertTriangle,
  Bot,
  Clock,
  RefreshCw,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { DailyPatternChart } from "@/components/daily-pattern-chart";
import { GlucoseChart } from "@/components/glucose-chart";
import { StatusIndicator } from "@/components/status-indicator";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CsvRecord, GlucoseAnalysis } from "@/lib/types";

export default function DashboardPage() {
  const [data, setData] = useState({
    currentGlucose: 0,
    trend: "stable",
    timeInRange: 0,
    timeAboveRange: 0,
    timeBelowRange: 0,
    averageGlucose: 0,
    glucoseVariability: 0,
    lastUpdate: new Date(),
    hasData: false,
    isConnected: false,
    readings: [] as CsvRecord[],
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchGlucoseData();
  }, []);

  const fetchGlucoseData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/glucose?period=day");

      if (!response.ok) {
        throw new Error("Error al obtener datos");
      }

      const result = (await response.json()) as GlucoseAnalysis;

      if (result.readings && result.readings.length > 0) {
        // Obtener la lectura más reciente
        const latestReading = result.readings[result.readings.length - 1];

        setData({
          currentGlucose: latestReading.glucose,
          // trend: latestReading.trend || "stable",
          trend: "stable",
          timeInRange: result.metrics.timeInRange,
          timeAboveRange: result.metrics.timeAboveRange,
          timeBelowRange: result.metrics.timeBelowRange,
          averageGlucose: result.metrics.averageGlucose,
          glucoseVariability: result.metrics.variability || 0,
          lastUpdate: latestReading.timestamp,
          hasData: true,
          isConnected: true,
          readings: result.readings,
        });
      } else {
        setData((prev) => ({
          ...prev,
          hasData: false,
          isConnected: true,
        }));
      }
    } catch (error) {
      console.error("Error fetching glucose data:", error);
      setData((prev) => ({
        ...prev,
        isConnected: false,
      }));
    } finally {
      setIsLoading(false);
    }
  };

  // Determine trend icon
  const getTrendIcon = () => {
    switch (data.trend) {
      case "rising":
        return <TrendingUp className="size-5 text-red-500" />;
      case "falling":
        return <TrendingDown className="size-5 text-blue-500" />;
      default:
        return <Activity className="size-5 text-green-500" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Monitoreo de glucosa y estadísticas principales</p>
        </div>
        <div className="flex items-center gap-2">
          <StatusIndicator isConnected={data.isConnected} hasData={data.hasData} />
          <Button variant="outline" size="sm" onClick={fetchGlucoseData} disabled={isLoading}>
            <RefreshCw className={`mr-2 size-4 ${isLoading ? "animate-spin" : ""}`} />
            Actualizar
          </Button>
        </div>
      </div>
      <>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Glucosa Actual</CardTitle>
              {getTrendIcon()}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.currentGlucose} mg/dL</div>
              <p className="text-xs text-muted-foreground">
                Última actualización: {new Date(data.lastUpdate).toLocaleTimeString()}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tiempo en Rango</CardTitle>
              <Clock className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.timeInRange}%</div>
              <Progress value={data.timeInRange} className="h-2 mt-2" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Glucosa Promedio</CardTitle>
              <Activity className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.averageGlucose} mg/dL</div>
              <p className="text-xs text-muted-foreground">
                Variabilidad: {data.glucoseVariability}%
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tiempo Fuera de Rango</CardTitle>
              <AlertTriangle className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="flex justify-between">
                <div>
                  <div className="text-sm font-medium text-red-500">Bajo</div>
                  <div className="text-xl font-bold">{data.timeBelowRange}%</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-orange-500">Alto</div>
                  <div className="text-xl font-bold">{data.timeAboveRange}%</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="md:col-span-2">
            <Tabs defaultValue="overview" className="space-y-4">
              <TabsList>
                <TabsTrigger value="overview">Vista General</TabsTrigger>
                <TabsTrigger value="daily">Patrones Diarios</TabsTrigger>
                <TabsTrigger value="analysis">Análisis</TabsTrigger>
              </TabsList>
              <TabsContent value="overview" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Tendencia de Glucosa</CardTitle>
                    <CardDescription>Niveles de glucosa en las últimas 24 horas</CardDescription>
                  </CardHeader>
                  <CardContent className="h-[300px]">
                    <GlucoseChart data={data.readings} />
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="daily" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Patrones Diarios</CardTitle>
                    <CardDescription>Variación de glucosa por hora del día</CardDescription>
                  </CardHeader>
                  <CardContent className="h-[300px]">
                    <DailyPatternChart data={data.readings} />
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="analysis" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Análisis de Patrones</CardTitle>
                    <CardDescription>
                      Análisis generado por IA de tus datos de glucosa
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="rounded-lg border p-4">
                      <p className="text-sm text-muted-foreground">
                        {data.hasData
                          ? "Utiliza el Asistente IA para obtener un análisis detallado de tus patrones de glucosa."
                          : "El análisis de IA estará disponible cuando conectes tu cuenta de FreeStyle Libre o subas un archivo CSV con tus datos de glucosa."}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Asistente IA</CardTitle>
              <CardDescription>Consulta sobre tus tendencias y patrones</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg border p-4 bg-muted">
                <p className="text-sm">¿Por qué tengo valores altos después del desayuno?</p>
              </div>
              <div className="rounded-lg border p-4 bg-muted">
                <p className="text-sm">
                  ¿Qué significa un tiempo en rango del {data.timeInRange}%?
                </p>
              </div>
              <div className="rounded-lg border p-4 bg-muted">
                <p className="text-sm">¿Cómo puedo reducir mi variabilidad glucémica?</p>
              </div>
              <Button asChild className="w-full">
                <Link href="/dashboard/ai">
                  <Bot className="mr-2 size-4" />
                  Abrir Asistente IA
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </>
      {/*)}*/}
    </div>
  );
}
