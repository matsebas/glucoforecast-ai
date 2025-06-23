"use client";

import { CartesianGrid, Line, LineChart, ReferenceLine, XAxis, YAxis } from "recharts";

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

interface GlucoseChartProps {
  data: GlucoseReading[];
}

const chartConfig = {} satisfies ChartConfig;

export function GlucoseChart({ data = [] }: GlucoseChartProps) {
  // Formatear los datos para el gráfico
  const chartData = data.map((reading) => ({
    time: new Date(reading.timestamp).toLocaleTimeString("es-AR", {
      hour: "2-digit",
      minute: "2-digit",
      month: "2-digit",
      day: "2-digit",
      hour12: false,
    }),
    value: reading.glucose,
    timestamp: reading.timestamp,
  }));

  return (
    <ChartContainer config={chartConfig} className="w-full h-full">
      <LineChart
        data={chartData}
        margin={{
          top: 5,
          right: 30,
          left: 20,
          bottom: 5,
        }}
      >
        <CartesianGrid strokeDasharray="1 1" stroke="#e0dfdf" />
        <XAxis dataKey="time" fontSize={12} />
        <YAxis domain={[40, 250]} fontSize={12} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <ReferenceLine y={180} stroke="orange" strokeDasharray="5 3" />
        <ReferenceLine y={70} stroke="red" strokeDasharray="5 3" />
        <Line
          type="natural"
          dataKey="value"
          activeDot={{ r: 8 }}
          dot={false}
          strokeWidth={3}
          connectNulls
          stroke="#155dfc"
        />
      </LineChart>
    </ChartContainer>
  );
}
