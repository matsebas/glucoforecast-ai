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
  userId: string;
  glucose: number;
  timestamp: Date;
  trend?: string;
  notes?: string | null;
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
    value: reading.glucose,
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
        <CartesianGrid strokeDasharray="1 1" stroke="#e0dfdf" />
        <XAxis dataKey="time" fontSize={12} />
        <YAxis domain={[40, 250]} fontSize={12} />
        <Tooltip
          labelFormatter={(value) => `Hora: ${value}`}
          formatter={(value) => [`${value} mg/dL`, "Glucosa"]}
          contentStyle={{ fontSize: 12 }}
        />
        <ReferenceLine y={180} stroke="green" strokeDasharray="5 3" />
        <ReferenceLine y={70} stroke="green" strokeDasharray="5 3" />
        <Line
          type="monotone"
          dataKey="value"
          stroke="#8884d8"
          activeDot={{ r: 8 }}
          dot={false}
          strokeWidth={2}
          connectNulls
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
