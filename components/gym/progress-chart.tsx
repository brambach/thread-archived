"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import type { ExerciseHistory } from "@/types";

interface ProgressChartProps {
  history: ExerciseHistory[];
  metric: "maxWeight" | "totalVolume";
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;

  const value = payload[0]?.value;
  const isWeight = payload[0]?.dataKey === "maxWeight";

  return (
    <div className="bg-surface-2 border border-border rounded-[8px] px-3 py-2 text-[12px]">
      <p className="text-text-muted mb-0.5">{label}</p>
      <p className="text-text font-semibold">
        {value?.toLocaleString()} {isWeight ? "lbs" : "lbs vol"}
      </p>
    </div>
  );
}

export function ProgressChart({ history, metric }: ProgressChartProps) {
  if (history.length < 2) {
    return (
      <div className="h-[160px] flex items-center justify-center">
        <p className="text-[13px] text-text-muted">
          Log at least 2 sessions to see your progress chart.
        </p>
      </div>
    );
  }

  const data = history.map((h) => ({
    date: formatDate(h.date),
    maxWeight: h.maxWeight,
    totalVolume: h.totalVolume,
  }));

  return (
    <ResponsiveContainer width="100%" height={160}>
      <LineChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#222222" vertical={false} />
        <XAxis
          dataKey="date"
          tick={{ fill: "#555555", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          tick={{ fill: "#555555", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => v.toLocaleString()}
        />
        <Tooltip content={<CustomTooltip />} />
        <Line
          type="monotone"
          dataKey={metric}
          stroke="#8B7CF6"
          strokeWidth={2}
          dot={{ fill: "#8B7CF6", r: 3, strokeWidth: 0 }}
          activeDot={{ fill: "#8B7CF6", r: 4, strokeWidth: 0 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
