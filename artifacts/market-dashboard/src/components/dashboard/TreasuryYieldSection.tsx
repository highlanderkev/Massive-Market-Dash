import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { Landmark, ArrowRightLeft } from "lucide-react";
import type { TreasuryData } from "../../types/market";

interface Props {
  treasury?: TreasuryData;
}

export function TreasuryYieldSection({ treasury }: Props) {
  if (!treasury) {
    return null;
  }

  const curveData = treasury.curve.map((m) => ({
    maturity: m.label,
    name: m.maturity,
    yield: m.yield,
  }));

  const historyData = treasury.history10Y || [];

  // Calculate 10Y - 2Y spread
  const yield2Y = treasury.curve.find((c) => c.label === "2Y")?.yield;
  const yield10Y = treasury.curve.find((c) => c.label === "10Y")?.yield;
  const spread = yield10Y !== undefined && yield2Y !== undefined ? yield10Y - yield2Y : null;
  const isInverted = spread !== null && spread < 0;

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div className="flex items-center gap-2">
          <Landmark className="h-4 w-4 text-violet-400" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            U.S. Treasury Yield Curve & Fixed Income
          </h2>
        </div>

        {spread !== null && (
          <div className="flex items-center gap-2 text-xs">
            <span className="text-muted-foreground">10Y-2Y Spread:</span>
            <span
              className={`inline-flex items-center gap-1 font-mono font-bold px-2 py-0.5 rounded-md ${
                isInverted
                  ? "bg-rose-500/10 text-rose-500 border border-rose-500/20"
                  : "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
              }`}
            >
              <ArrowRightLeft className="h-3 w-3" />
              {spread >= 0 ? "+" : ""}
              {spread.toFixed(2)}% ({isInverted ? "Inverted" : "Normal"})
            </span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Yield Curve */}
        <div className="bg-card border border-border/80 rounded-2xl p-5 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-foreground">
              Current Yield Curve
            </h3>
            <span className="text-xs text-muted-foreground">
              As of {treasury.date}
            </span>
          </div>

          <div className="h-56 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={curveData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148, 163, 184, 0.15)" />
                <XAxis
                  dataKey="maturity"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: "#94a3b8" }}
                />
                <YAxis
                  domain={["auto", "auto"]}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: "#94a3b8" }}
                  tickFormatter={(v) => `${v}%`}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const d = payload[0].payload;
                      return (
                        <div className="bg-popover border border-border p-2.5 rounded-lg shadow-lg text-xs">
                          <div className="font-bold text-foreground">{d.name} ({d.maturity})</div>
                          <div className="text-violet-400 font-mono font-semibold mt-0.5">
                            Yield: {d.yield.toFixed(2)}%
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="yield"
                  stroke="#a78bfa"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: "#a78bfa", strokeWidth: 1, stroke: "#1e1b4b" }}
                  activeDot={{ r: 6, fill: "#c4b5fd" }}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 10-Year Historical Yield */}
        <div className="bg-card border border-border/80 rounded-2xl p-5 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-foreground">
              10-Year Benchmark Yield
            </h3>
            <span className="text-xs font-mono font-bold text-emerald-400">
              {historyData[historyData.length - 1]?.yield.toFixed(2)}%
            </span>
          </div>

          <div className="h-56 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={historyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148, 163, 184, 0.15)" />
                <XAxis
                  dataKey="date"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: "#94a3b8" }}
                />
                <YAxis
                  domain={["auto", "auto"]}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: "#94a3b8" }}
                  tickFormatter={(v) => `${v}%`}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const d = payload[0].payload;
                      return (
                        <div className="bg-popover border border-border p-2.5 rounded-lg shadow-lg text-xs">
                          <div className="font-bold text-foreground">{d.date}</div>
                          <div className="text-emerald-400 font-mono font-semibold mt-0.5">
                            10Y Yield: {d.yield.toFixed(2)}%
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="yield"
                  stroke="#34d399"
                  strokeWidth={2}
                  dot={{ r: 3, fill: "#34d399" }}
                  activeDot={{ r: 5, fill: "#6ee7b7" }}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
