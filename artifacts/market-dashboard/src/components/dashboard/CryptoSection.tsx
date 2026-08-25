import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from "recharts";
import { TrendingUp, TrendingDown, Coins } from "lucide-react";
import type { CryptoInfo } from "../../types/market";

interface Props {
  crypto: Record<string, CryptoInfo>;
}

export function CryptoSection({ crypto }: Props) {
  const items = Object.values(crypto);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Coins className="h-4 w-4 text-amber-500" />
        <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Digital Assets — BTC & ETH 30-Day Trend
        </h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {items.map((coin) => {
          const isPositive = coin.change >= 0;
          const isBtc = coin.ticker.toUpperCase().includes("BTC");
          const strokeColor = isBtc ? "#f59e0b" : "#6366f1";
          const gradientId = `cryptoGrad-${coin.ticker}`;

          return (
            <div
              key={coin.ticker}
              className="bg-card border border-border/80 rounded-2xl p-5 shadow-2xs space-y-3"
            >
              {/* Header */}
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-muted-foreground">
                    {coin.label}
                  </span>
                  <div className="flex items-baseline gap-2 mt-0.5">
                    <span className="text-2xl font-bold font-mono text-foreground">
                      ${coin.price.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>

                <div
                  className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg ${
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
                    {coin.changePercent.toFixed(2)}%
                  </span>
                </div>
              </div>

              {/* Chart */}
              <div className="h-48 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={coin.bars} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={strokeColor} stopOpacity={0.35} />
                        <stop offset="100%" stopColor={strokeColor} stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
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
                      tick={{ fontSize: 10, fill: "#94a3b8" }}
                      tickFormatter={(v) => `$${(v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v)}`}
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-popover border border-border p-2.5 rounded-lg shadow-lg text-xs">
                              <div className="font-bold text-foreground">{data.date}</div>
                              <div className="text-muted-foreground font-mono mt-0.5">
                                Price: ${data.close.toLocaleString()}
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
                      stroke={strokeColor}
                      strokeWidth={2}
                      fill={`url(#${gradientId})`}
                      isAnimationActive={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
