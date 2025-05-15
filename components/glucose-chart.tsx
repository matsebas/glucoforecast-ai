"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface GlucoseReading {
  id: number;
  userId: number;
  value: number;
  timestamp: string;
  trend?: string;
  notes?: string;
}

interface GlucoseChartProps {
  data: GlucoseReading[];
}

export function GlucoseChart({ data = [] }: GlucoseChartProps) {
  // Formatear los datos para el gráfico
  const chartData = data.map((reading) => ({
    time: new Date(reading.timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    }),
    value: reading.value,
    timestamp: reading.timestamp,
  }));

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart
        data={chartData}
        margin={{
          top: 5,
          right: 30,
          left: 20,
          bottom: 5,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="time" />
        <YAxis domain={[40, 250]} />
        <Tooltip
          labelFormatter={(value) => `Hora: ${value}`}
          formatter={(value) => [`${value} mg/dL`, "Glucosa"]}
        />
        <ReferenceLine y={180} stroke="red" strokeDasharray="3 3" />
        <ReferenceLine y={70} stroke="red" strokeDasharray="3 3" />
        <Line
          type="monotone"
          dataKey="value"
          stroke="#8884d8"
          activeDot={{ r: 8 }}
          strokeWidth={2}
          connectNulls
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
