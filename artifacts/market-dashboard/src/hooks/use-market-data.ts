import { useQuery } from "@tanstack/react-query";
import type { MarketOverviewResponse, AggBar, IndexInfo, CryptoInfo, TreasuryData } from "../types/market";

function generateDates(count: number): { timestamp: number; date: string }[] {
  const dates: { timestamp: number; date: string }[] = [];
  const now = new Date();
  let daysBack = 0;
  while (dates.length < count) {
    const d = new Date(now);
    d.setDate(d.getDate() - daysBack);
    const dayOfWeek = d.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      const dateStr = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      dates.unshift({
        timestamp: d.getTime(),
        date: dateStr,
      });
    }
    daysBack++;
  }
  return dates;
}

function generateWalk(startPrice: number, volatility: number, count: number): AggBar[] {
  const dates = generateDates(count);
  let current = startPrice;
  const bars: AggBar[] = [];

  for (let i = 0; i < count; i++) {
    const pct = (Math.sin(i * 0.4) * 0.005) + ((Math.random() - 0.48) * volatility);
    const open = current;
    current = Math.max(current * (1 + pct), 1);
    const high = Math.max(open, current) * (1 + Math.random() * 0.005);
    const low = Math.min(open, current) * (1 - Math.random() * 0.005);
    const volume = Math.floor(20000000 + Math.random() * 30000000);

    bars.push({
      timestamp: dates[i].timestamp,
      date: dates[i].date,
      open: Number(open.toFixed(2)),
      high: Number(high.toFixed(2)),
      low: Number(low.toFixed(2)),
      close: Number(current.toFixed(2)),
      volume,
    });
  }

  return bars;
}

export function getClientFallbackOverview(): MarketOverviewResponse {
  const now = new Date();
  const estHour = (now.getUTCHours() - 4 + 24) % 24;
  const isWeekday = now.getUTCDay() >= 1 && now.getUTCDay() <= 5;
  const isOpen = isWeekday && estHour >= 9.5 && estHour < 16;

  function calcMeta(bars: AggBar[], ticker: string, label: string, name: string): IndexInfo {
    const latest = bars[bars.length - 1].close;
    const prev = bars[bars.length - 2].close;
    const change = Number((latest - prev).toFixed(2));
    const changePercent = Number(((change / prev) * 100).toFixed(2));
    return {
      ticker,
      label,
      name,
      price: latest,
      change,
      changePercent,
      bars,
    };
  }

  function calcCryptoMeta(bars: AggBar[], ticker: string, label: string): CryptoInfo {
    const latest = bars[bars.length - 1].close;
    const prev = bars[bars.length - 2].close;
    const change = Number((latest - prev).toFixed(2));
    const changePercent = Number(((change / prev) * 100).toFixed(2));
    return {
      ticker,
      label,
      price: latest,
      change,
      changePercent,
      bars,
    };
  }

  const spyBars = generateWalk(592.5, 0.012, 30);
  const qqqBars = generateWalk(508.2, 0.015, 30);
  const diaBars = generateWalk(436.8, 0.009, 30);
  const iwmBars = generateWalk(222.1, 0.018, 30);

  const btcBars = generateWalk(94200, 0.025, 30);
  const ethBars = generateWalk(2680, 0.03, 30);

  const history10Y: { date: string; yield: number }[] = [];
  let currentYield = 4.38;
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    currentYield += (Math.random() - 0.48) * 0.04;
    history10Y.push({
      date: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      yield: Number(currentYield.toFixed(2)),
    });
  }

  return {
    status: {
      updatedAt: now.toISOString(),
      exchanges: {
        nyse: isOpen ? "open" : "closed",
        nasdaq: isOpen ? "open" : "closed",
        otc: isOpen ? "open" : "closed",
      },
      currencies: {
        crypto: "open",
        fx: isWeekday ? "open" : "closed",
      },
      serverTime: now.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true }),
    },
    indices: {
      SPY: calcMeta(spyBars, "SPY", "S&P 500", "SPDR S&P 500 ETF Trust"),
      QQQ: calcMeta(qqqBars, "QQQ", "Nasdaq 100", "Invesco QQQ Trust"),
      DIA: calcMeta(diaBars, "DIA", "Dow Jones", "SPDR Dow Jones Industrial Average"),
      IWM: calcMeta(iwmBars, "IWM", "Russell 2000", "iShares Russell 2000 ETF"),
    },
    crypto: {
      BTC: calcCryptoMeta(btcBars, "BTC", "Bitcoin (BTC/USD)"),
      ETH: calcCryptoMeta(ethBars, "ETH", "Ethereum (ETH/USD)"),
    },
    treasury: {
      date: now.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      curve: [
        { label: "1M", maturity: "1 Month", yield: 4.35 },
        { label: "3M", maturity: "3 Month", yield: 4.31 },
        { label: "6M", maturity: "6 Month", yield: 4.22 },
        { label: "1Y", maturity: "1 Year", yield: 4.15 },
        { label: "2Y", maturity: "2 Year", yield: 4.18 },
        { label: "3Y", maturity: "3 Year", yield: 4.21 },
        { label: "5Y", maturity: "5 Year", yield: 4.28 },
        { label: "7Y", maturity: "7 Year", yield: 4.39 },
        { label: "10Y", maturity: "10 Year", yield: 4.45 },
        { label: "20Y", maturity: "20 Year", yield: 4.72 },
        { label: "30Y", maturity: "30 Year", yield: 4.65 },
      ],
      history10Y,
    },
  };
}

async function fetchMarketOverview(): Promise<MarketOverviewResponse> {
  try {
    const res = await fetch("/api/market/overview");
    if (!res.ok) {
      return getClientFallbackOverview();
    }
    return await res.json();
  } catch (err) {
    return getClientFallbackOverview();
  }
}

export function useMarketOverview() {
  return useQuery<MarketOverviewResponse>({
    queryKey: ["market-overview"],
    queryFn: fetchMarketOverview,
    refetchInterval: 30000, // 30s auto-refresh
    staleTime: 15000,
  });
}
