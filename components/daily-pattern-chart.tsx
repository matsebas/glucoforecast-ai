"use client";

import { Area, AreaChart, CartesianGrid, ReferenceLine, XAxis, YAxis } from "recharts";

import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

interface GlucoseReading {
  id: number;
  userId: string;
  glucose: number;
  timestamp: Date;
  trend?: string;
  notes?: string | null;
}

interface DailyPatternChartProps {
  data: GlucoseReading[];
}

const chartConfig = {} satisfies ChartConfig;

export function DailyPatternChart({ data = [] }: DailyPatternChartProps) {
  // Agrupar lecturas por hora del día
  const hourlyData = Array(24)
    .fill(null)
    .map((_, hour) => ({
      hour: hour.toString().padStart(2, "0"),
      min: 0,
      max: 0,
      avg: 0,
      readings: [] as number[],
    }));

  // Procesar los datos
  data.forEach((reading) => {
    const date = new Date(reading.timestamp);
    const hour = date.getHours();
    hourlyData[hour].readings.push(reading.glucose);
  });

  // Calcular min, max y avg para cada hora
  hourlyData.forEach((hourData) => {
    if (hourData.readings.length > 0) {
      hourData.min = Math.min(...hourData.readings);
      hourData.max = Math.max(...hourData.readings);
      hourData.avg = Math.round(
        hourData.readings.reduce((sum, val) => sum + val, 0) / hourData.readings.length
      );
    } else {
      // Si no hay lecturas para esta hora, usar valores predeterminados
      hourData.min = 100;
      hourData.max = 100;
      hourData.avg = 100;
    }
  });

  return (
    <ChartContainer config={chartConfig} className="h-full w-full">
      <AreaChart
        data={hourlyData}
        margin={{
          top: 10,
          right: 30,
          left: 0,
          bottom: 0,
        }}
      >
        <CartesianGrid strokeDasharray="1 1" />
        <XAxis dataKey="hour" fontSize={12} />
        <YAxis domain={[40, 250]} fontSize={12} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <ReferenceLine y={180} stroke="green" strokeDasharray="5 5" strokeWidth={1.5} />
        <ReferenceLine y={70} stroke="green" strokeDasharray="5 5" strokeWidth={1.5} />
        <Area type="monotone" dataKey="min" stackId="1" fillOpacity={0.1} name="Mínimo" />
        <Area type="monotone" dataKey="max" stackId="1" fillOpacity={0.3} name="Máximo" />
        <Area type="monotone" dataKey="avg" fillOpacity={0.5} name="Promedio" />
      </AreaChart>
    </ChartContainer>
  );
}
