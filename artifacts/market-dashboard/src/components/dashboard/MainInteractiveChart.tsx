import React, { useState } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { BarChart2, DollarSign, ArrowUpRight, ArrowDownRight } from "lucide-react";
import type { IndexInfo } from "../../types/market";

interface Props {
  indexInfo?: IndexInfo;
}

export function MainInteractiveChart({ indexInfo }: Props) {
  const [timeRange, setTimeRange] = useState<"7D" | "14D" | "30D">("30D");

  if (!indexInfo) {
    return null;
  }

  const allBars = indexInfo.bars || [];
  const count = timeRange === "7D" ? 7 : timeRange === "14D" ? 14 : 30;
  const bars = allBars.slice(-count);

  const closes = bars.map((b) => b.close);
  const minPrice = Math.min(...closes);
  const maxPrice = Math.max(...closes);
  const startPrice = bars[0]?.close ?? indexInfo.price;
  const endPrice = bars[bars.length - 1]?.close ?? indexInfo.price;
  const periodDiff = endPrice - startPrice;
  const periodPct = startPrice > 0 ? (periodDiff / startPrice) * 100 : 0;
  const isPositive = periodDiff >= 0;

  return (
    <div className="bg-card border border-border/80 rounded-2xl p-5 md:p-6 shadow-sm">
      {/* Header with Title & Stats */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-5 border-b border-border/60">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-primary">
              Interactive Chart
            </span>
            <span className="text-xs text-muted-foreground">•</span>
            <span className="text-xs text-muted-foreground font-medium">
              {indexInfo.name}
            </span>
          </div>
          <div className="flex items-baseline gap-3 mt-1">
            <h3 className="text-2xl md:text-3xl font-extrabold text-foreground font-mono">
              ${indexInfo.price.toFixed(2)}
            </h3>
            <span
              className={`inline-flex items-center gap-1 text-sm font-semibold px-2 py-0.5 rounded-md ${
                isPositive
                  ? "bg-emerald-500/10 text-emerald-500"
                  : "bg-rose-500/10 text-rose-500"
              }`}
            >
              {isPositive ? (
                <ArrowUpRight className="h-4 w-4" />
              ) : (
                <ArrowDownRight className="h-4 w-4" />
              )}
              {isPositive ? "+" : ""}
              {periodPct.toFixed(2)}% ({timeRange})
            </span>
          </div>
        </div>

        {/* Timeframe Selector */}
        <div className="flex items-center bg-muted/60 p-1 rounded-xl border border-border/80 self-start md:self-auto">
          {(["7D", "14D", "30D"] as const).map((r) => (
            <button
              key={r}
              onClick={() => setTimeRange(r)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                timeRange === r
                  ? "bg-card text-foreground shadow-xs border border-border"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Quick Stats Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-4 py-3 px-4 rounded-xl bg-muted/30 border border-border/40 text-xs">
        <div>
          <span className="text-muted-foreground block text-[11px]">Period High</span>
          <span className="font-semibold text-foreground font-mono text-sm">${maxPrice.toFixed(2)}</span>
        </div>
        <div>
          <span className="text-muted-foreground block text-[11px]">Period Low</span>
          <span className="font-semibold text-foreground font-mono text-sm">${minPrice.toFixed(2)}</span>
        </div>
        <div>
          <span className="text-muted-foreground block text-[11px]">Open (Period)</span>
          <span className="font-semibold text-foreground font-mono text-sm">${startPrice.toFixed(2)}</span>
        </div>
        <div>
          <span className="text-muted-foreground block text-[11px]">Period Spread</span>
          <span className="font-semibold text-foreground font-mono text-sm">
            ${(maxPrice - minPrice).toFixed(2)}
          </span>
        </div>
      </div>

      {/* Main Chart Area */}
      <div className="h-72 sm:h-80 w-full mt-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={bars} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="mainAreaGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148, 163, 184, 0.15)" />
            <XAxis
              dataKey="date"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: "#94a3b8" }}
            />
            <YAxis
              domain={["auto", "auto"]}
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: "#94a3b8" }}
              tickFormatter={(v) => `$${v}`}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-popover border border-border p-3 rounded-xl shadow-xl text-xs space-y-1">
                      <div className="font-bold text-foreground border-b border-border/60 pb-1">
                        {data.date}
                      </div>
                      <div className="flex justify-between gap-4 text-muted-foreground">
                        <span>Close:</span>
                        <span className="font-semibold text-foreground font-mono">${data.close}</span>
                      </div>
                      <div className="flex justify-between gap-4 text-muted-foreground">
                        <span>High:</span>
                        <span className="font-semibold text-foreground font-mono">${data.high}</span>
                      </div>
                      <div className="flex justify-between gap-4 text-muted-foreground">
                        <span>Low:</span>
                        <span className="font-semibold text-foreground font-mono">${data.low}</span>
                      </div>
                      <div className="flex justify-between gap-4 text-muted-foreground">
                        <span>Volume:</span>
                        <span className="font-semibold text-foreground font-mono">
                          {(data.volume / 1000000).toFixed(1)}M
                        </span>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Area
              type="monotone"
              dataKey="close"
              stroke="#3b82f6"
              strokeWidth={2.5}
              fill="url(#mainAreaGradient)"
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
