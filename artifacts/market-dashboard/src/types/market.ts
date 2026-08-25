export interface AggBar {
  timestamp: number;
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface IndexInfo {
  ticker: string;
  label: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  bars: AggBar[];
}

export interface CryptoInfo {
  ticker: string;
  label: string;
  price: number;
  change: number;
  changePercent: number;
  bars: AggBar[];
}

export interface TreasuryMaturity {
  label: string;
  maturity: string;
  yield: number;
}

export interface TreasuryData {
  date: string;
  curve: TreasuryMaturity[];
  history10Y: { date: string; yield: number }[];
}

export interface MarketStatus {
  updatedAt: string;
  exchanges: {
    nyse: "open" | "closed" | string;
    nasdaq: "open" | "closed" | string;
    otc: "open" | "closed" | string;
  };
  currencies: {
    crypto: "open" | "closed" | string;
    fx: "open" | "closed" | string;
  };
  serverTime: string;
}

export interface MarketOverviewResponse {
  status: MarketStatus;
  indices: Record<string, IndexInfo>;
  crypto: Record<string, CryptoInfo>;
  treasury: TreasuryData;
}
