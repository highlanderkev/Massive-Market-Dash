import React, { useState } from "react";
import { useMarketOverview } from "../../hooks/use-market-data";
import { MarketStatusHeader } from "./MarketStatusHeader";
import { IndexCards } from "./IndexCards";
import { MainInteractiveChart } from "./MainInteractiveChart";
import { CryptoSection } from "./CryptoSection";
import { TreasuryYieldSection } from "./TreasuryYieldSection";
import { ShieldCheck, Info } from "lucide-react";

export function MarketDashboardPage() {
  const { data, isFetching, refetch } = useMarketOverview();
  const [selectedTicker, setSelectedTicker] = useState<string>("SPY");

  const indices = data?.indices ?? {};
  const selectedIndexInfo = indices[selectedTicker] || indices["SPY"] || Object.values(indices)[0];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col antialiased selection:bg-primary/20">
      {/* Top Header */}
      <MarketStatusHeader
        status={data?.status}
        isFetching={isFetching}
        onRefresh={() => refetch()}
      />

      {/* Main Content Dashboard */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Indices Section */}
        {data?.indices && (
          <IndexCards
            indices={data.indices}
            selectedTicker={selectedTicker}
            onSelectTicker={setSelectedTicker}
          />
        )}

        {/* Main Interactive Chart for selected index */}
        {selectedIndexInfo && (
          <MainInteractiveChart indexInfo={selectedIndexInfo} />
        )}

        {/* Crypto & Yield Sections */}
        <div className="grid grid-cols-1 gap-6">
          {data?.crypto && <CryptoSection crypto={data.crypto} />}
          {data?.treasury && <TreasuryYieldSection treasury={data.treasury} />}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/60 bg-card/40 py-6 mt-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
            <span>Massive Market Dash • Real-time Financial Terminal</span>
          </div>

          <div className="flex items-center gap-2">
            <Info className="h-3.5 w-3.5" />
            <span>Prices are end-of-day/intraday composites. Past performance does not guarantee future results.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
