"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const CHART_COLOR = "var(--blue-600)";
const GRID_COLOR = "var(--border)";
const TICK_COLOR = "var(--ink-500)";

export function SqdBarChart({ data }: { data: Array<{ dimension: string; average: number }> }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} vertical={false} />
        <XAxis dataKey="dimension" tick={{ fill: TICK_COLOR, fontSize: 11 }} interval={0} angle={-20} textAnchor="end" height={60} />
        <YAxis domain={[0, 5]} tick={{ fill: TICK_COLOR, fontSize: 12 }} />
        <Tooltip formatter={(value) => Number(value).toFixed(2)} />
        <Bar dataKey="average" fill={CHART_COLOR} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function VolumeLineChart({ data }: { data: Array<{ date: string; count: number }> }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={data} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} vertical={false} />
        <XAxis dataKey="date" tick={{ fill: TICK_COLOR, fontSize: 11 }} />
        <YAxis allowDecimals={false} tick={{ fill: TICK_COLOR, fontSize: 12 }} />
        <Tooltip />
        <Line type="monotone" dataKey="count" stroke={CHART_COLOR} strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function BreakdownBarChart({ data }: { data: Array<{ label: string; count: number }> }) {
  return (
    <ResponsiveContainer width="100%" height={Math.max(180, data.length * 34)}>
      <BarChart data={data} layout="vertical" margin={{ top: 8, right: 24, bottom: 8, left: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} horizontal={false} />
        <XAxis type="number" allowDecimals={false} tick={{ fill: TICK_COLOR, fontSize: 12 }} />
        <YAxis type="category" dataKey="label" width={220} tick={{ fill: TICK_COLOR, fontSize: 11 }} />
        <Tooltip />
        <Bar dataKey="count" fill={CHART_COLOR} radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
