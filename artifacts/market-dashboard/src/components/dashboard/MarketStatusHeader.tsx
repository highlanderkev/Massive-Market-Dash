import React from "react";
import { Activity, RefreshCw, Clock, Globe } from "lucide-react";
import type { MarketStatus } from "../../types/market";

interface Props {
  status?: MarketStatus;
  isFetching: boolean;
  onRefresh: () => void;
}

export function MarketStatusHeader({ status, isFetching, onRefresh }: Props) {
  const [nowStr, setNowStr] = React.useState(() =>
    new Date().toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    })
  );

  React.useEffect(() => {
    const timer = setInterval(() => {
      setNowStr(
        new Date().toLocaleDateString("en-US", {
          weekday: "short",
          month: "short",
          day: "numeric",
          year: "numeric",
          hour: "numeric",
          minute: "2-digit",
          second: "2-digit",
          hour12: true,
        })
      );
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const exchanges = status?.exchanges;
  const currencies = status?.currencies;

  const marketList = [
    { name: "NYSE", status: exchanges?.nyse ?? "closed" },
    { name: "NASDAQ", status: exchanges?.nasdaq ?? "closed" },
    { name: "OTC", status: exchanges?.otc ?? "closed" },
    { name: "Crypto", status: currencies?.crypto ?? "open" },
    { name: "Forex", status: currencies?.fx ?? "open" },
  ];

  return (
    <header className="border-b border-border/80 bg-card/60 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          {/* Logo & Title */}
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-primary to-chart-1 flex items-center justify-center shadow-md shadow-primary/20 text-white font-bold">
              <Activity className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-extrabold tracking-tight text-foreground">
                  Massive Market Dash
                </h1>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
                  LIVE
                </span>
              </div>
              <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                <Globe className="h-3.5 w-3.5" />
                Global Equities, Crypto & Fixed Income Terminal
              </p>
            </div>
          </div>

          {/* Clock & Action */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-lg border border-border">
              <Clock className="h-3.5 w-3.5 text-primary" />
              <span>{nowStr}</span>
            </div>

            <button
              onClick={onRefresh}
              disabled={isFetching}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-primary text-primary-foreground hover:opacity-90 active:scale-95 transition-all shadow-sm disabled:opacity-50 cursor-pointer"
              title="Refresh market data"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? "animate-spin" : ""}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Market Status Pills */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5 mt-4 pt-3 border-t border-border/40">
          {marketList.map((m) => {
            const isOpen = m.status.toLowerCase() === "open";
            return (
              <div
                key={m.name}
                className="flex items-center justify-between px-3 py-2 rounded-lg bg-card/80 border border-border/80 text-xs shadow-2xs"
              >
                <span className="font-semibold text-muted-foreground uppercase tracking-wider text-[10px]">
                  {m.name}
                </span>
                <span className="inline-flex items-center gap-1.5 font-medium">
                  <span
                    className={`h-2 w-2 rounded-full ${
                      isOpen ? "bg-emerald-500 animate-pulse" : "bg-rose-500"
                    }`}
                  />
                  <span className={isOpen ? "text-emerald-500 font-semibold" : "text-rose-500 font-semibold"}>
                    {isOpen ? "Open" : "Closed"}
                  </span>
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </header>
  );
}
