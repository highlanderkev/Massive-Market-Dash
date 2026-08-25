import { ResponsiveContainer, AreaChart, Area, YAxis } from "recharts";
import { TrendingUp, TrendingDown } from "lucide-react";
import type { IndexInfo } from "../../types/market";

interface Props {
  indices: Record<string, IndexInfo>;
  selectedTicker: string;
  onSelectTicker: (ticker: string) => void;
}

const COLORS: Record<string, { stroke: string; fill: string }> = {
  SPY: { stroke: "#3b82f6", fill: "rgba(59, 130, 246, 0.15)" },
  QQQ: { stroke: "#8b5cf6", fill: "rgba(139, 92, 246, 0.15)" },
  DIA: { stroke: "#06b6d4", fill: "rgba(6, 182, 212, 0.15)" },
  IWM: { stroke: "#f59e0b", fill: "rgba(245, 158, 11, 0.15)" },
};

export function IndexCards({ indices, selectedTicker, onSelectTicker }: Props) {
  const list = Object.values(indices);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Major Markets — 30-Day Performance
        </h2>
        <span className="text-[11px] text-muted-foreground">Click card to inspect</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {list.map((item) => {
          const isPositive = item.change >= 0;
          const isSelected = selectedTicker === item.ticker;
          const colorConfig = COLORS[item.ticker] || {
            stroke: "#3b82f6",
            fill: "rgba(59, 130, 246, 0.15)",
          };

          return (
            <button
              key={item.ticker}
              onClick={() => onSelectTicker(item.ticker)}
              className={`text-left p-4 rounded-xl transition-all duration-200 border cursor-pointer relative overflow-hidden group ${
                isSelected
                  ? "bg-card border-primary ring-1 ring-primary shadow-md"
                  : "bg-card/80 border-border/80 hover:border-border hover:bg-card shadow-2xs"
              }`}
            >
              {/* Top Row: Label & Arrow */}
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-xs font-semibold text-muted-foreground">
                    {item.label}
                  </span>
                  <div className="flex items-baseline gap-1.5 mt-0.5">
                    <span className="text-xl font-bold tracking-tight text-foreground font-mono">
                      ${item.price.toFixed(2)}
                    </span>
                    <span className="text-xs font-medium text-muted-foreground">
                      {item.ticker}
                    </span>
                  </div>
                </div>

                <div
                  className={`flex items-center gap-0.5 text-xs font-semibold px-2 py-1 rounded-md ${
                    isPositive
                      ? "bg-emerald-500/10 text-emerald-500"
                      : "bg-rose-500/10 text-rose-500"
                  }`}
                >
                  {isPositive ? (
                    <TrendingUp className="h-3.5 w-3.5" />
                  ) : (
                    <TrendingDown className="h-3.5 w-3.5" />
                  )}
                  <span>
                    {isPositive ? "+" : ""}
                    {item.changePercent.toFixed(2)}%
                  </span>
                </div>
              </div>

              {/* Sparkline Chart */}
              <div className="h-16 mt-3 -mx-2 -mb-2">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={item.bars}>
                    <defs>
                      <linearGradient id={`grad-${item.ticker}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={colorConfig.stroke} stopOpacity={0.4} />
                        <stop offset="100%" stopColor={colorConfig.stroke} stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <YAxis domain={["dataMin", "dataMax"]} hide />
                    <Area
                      type="monotone"
                      dataKey="close"
                      stroke={colorConfig.stroke}
                      strokeWidth={2}
                      fill={`url(#grad-${item.ticker})`}
                      isAnimationActive={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Selection indicator bar */}
              {isSelected && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
