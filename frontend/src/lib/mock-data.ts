// =====================
// Watchlist Data
// =====================
export interface WatchlistStock {
  ticker: string
  company: string
  price: number
  changeDollar: number
  changePercent: number
  volume: string
  marketCap: string
  low52w: number
  high52w: number
  aiScore: number
  sparkline: number[]
}

export const watchlistStocks: WatchlistStock[] = [
  {
    ticker: "AAPL",
    company: "Apple Inc.",
    price: 189.43,
    changeDollar: 2.31,
    changePercent: 1.24,
    volume: "52.4M",
    marketCap: "$2.94T",
    low52w: 142.0,
    high52w: 199.62,
    aiScore: 8,
    sparkline: [40, 42, 38, 44, 46, 48, 45, 50, 52, 54, 53, 56],
  },
  {
    ticker: "TSLA",
    company: "Tesla Inc.",
    price: 168.1,
    changeDollar: -3.68,
    changePercent: -2.15,
    volume: "94.1M",
    marketCap: "$535B",
    low52w: 138.8,
    high52w: 299.29,
    aiScore: 4,
    sparkline: [60, 58, 55, 50, 52, 48, 45, 42, 40, 38, 36, 35],
  },
  {
    ticker: "MSFT",
    company: "Microsoft Corp.",
    price: 415.1,
    changeDollar: 1.87,
    changePercent: 0.45,
    volume: "22.8M",
    marketCap: "$3.08T",
    low52w: 309.45,
    high52w: 430.82,
    aiScore: 8,
    sparkline: [50, 52, 51, 53, 55, 54, 56, 58, 57, 59, 60, 62],
  },
  {
    ticker: "NVDA",
    company: "NVIDIA Corp.",
    price: 924.5,
    changeDollar: 58.87,
    changePercent: 6.8,
    volume: "102M",
    marketCap: "$2.28T",
    low52w: 373.56,
    high52w: 974.0,
    aiScore: 10,
    sparkline: [30, 35, 40, 45, 50, 55, 58, 62, 68, 72, 78, 82],
  },
  {
    ticker: "AMZN",
    company: "Amazon.com Inc.",
    price: 178.25,
    changeDollar: 1.05,
    changePercent: 0.59,
    volume: "48.2M",
    marketCap: "$1.86T",
    low52w: 118.35,
    high52w: 189.77,
    aiScore: 7,
    sparkline: [42, 44, 46, 45, 48, 50, 52, 55, 57, 56, 58, 60],
  },
  {
    ticker: "GOOGL",
    company: "Alphabet Inc.",
    price: 155.72,
    changeDollar: -0.43,
    changePercent: -0.28,
    volume: "25.6M",
    marketCap: "$1.94T",
    low52w: 115.83,
    high52w: 164.58,
    aiScore: 7,
    sparkline: [48, 50, 49, 52, 53, 51, 54, 55, 53, 52, 54, 53],
  },
  {
    ticker: "META",
    company: "Meta Platforms",
    price: 493.5,
    changeDollar: 4.12,
    changePercent: 0.84,
    volume: "18.3M",
    marketCap: "$1.26T",
    low52w: 274.38,
    high52w: 531.49,
    aiScore: 9,
    sparkline: [35, 40, 42, 48, 50, 55, 58, 60, 63, 65, 68, 70],
  },
]

// =====================
// Portfolio Holdings Data
// =====================
export interface Holding {
  ticker: string
  company: string
  sector: string
  shares: number
  avgBuy: number
  currentPrice: number
  totalValue: number
  plDollar: number
  plPercent: number
  dayChangeDollar: number
  dayChangePercent: number
  portfolioWeight: number
}

export const holdings: Holding[] = [
  {
    ticker: "AAPL",
    company: "Apple Inc.",
    sector: "TECH",
    shares: 120,
    avgBuy: 148.5,
    currentPrice: 189.43,
    totalValue: 22731.6,
    plDollar: 4911.6,
    plPercent: 27.56,
    dayChangeDollar: 214.2,
    dayChangePercent: 0.95,
    portfolioWeight: 26.96,
  },
  {
    ticker: "NVDA",
    company: "NVIDIA Corp.",
    sector: "TECH",
    shares: 45,
    avgBuy: 215.2,
    currentPrice: 460.18,
    totalValue: 20708.1,
    plDollar: 11024.1,
    plPercent: 113.8,
    dayChangeDollar: 645.1,
    dayChangePercent: 3.21,
    portfolioWeight: 24.56,
  },
  {
    ticker: "JPM",
    company: "JPMorgan Chase",
    sector: "FINANCE",
    shares: 100,
    avgBuy: 154.2,
    currentPrice: 153.45,
    totalValue: 15345.0,
    plDollar: -75.0,
    plPercent: -0.49,
    dayChangeDollar: -12.5,
    dayChangePercent: -0.08,
    portfolioWeight: 18.2,
  },
  {
    ticker: "JNJ",
    company: "Johnson & Johnson",
    sector: "HEALTH",
    shares: 60,
    avgBuy: 155.8,
    currentPrice: 162.35,
    totalValue: 9741.0,
    plDollar: 393.0,
    plPercent: 4.2,
    dayChangeDollar: 48.6,
    dayChangePercent: 0.5,
    portfolioWeight: 11.56,
  },
  {
    ticker: "AMZN",
    company: "Amazon.com Inc.",
    sector: "CONSUMER",
    shares: 55,
    avgBuy: 128.4,
    currentPrice: 178.25,
    totalValue: 9803.75,
    plDollar: 2741.75,
    plPercent: 38.81,
    dayChangeDollar: 57.75,
    dayChangePercent: 0.59,
    portfolioWeight: 11.63,
  },
  {
    ticker: "PFE",
    company: "Pfizer Inc.",
    sector: "HEALTH",
    shares: 200,
    avgBuy: 31.5,
    currentPrice: 29.95,
    totalValue: 5990.0,
    plDollar: -310.0,
    plPercent: -4.92,
    dayChangeDollar: -22.0,
    dayChangePercent: -0.37,
    portfolioWeight: 7.09,
  },
]

export const portfolioSummary = {
  totalValue: 84320.0,
  totalInvested: 71200.0,
  totalPL: 13120.0,
  totalPLPercent: 18.4,
  todayPL: 842.15,
  todayPLPercent: 1.01,
}

export const sectorAllocation = [
  { name: "Tech", value: 52.4, color: "#3B82F6" },
  { name: "Finance", value: 18.2, color: "#F59E0B" },
  { name: "Health", value: 12.5, color: "#10B981" },
  { name: "Consumer", value: 10.9, color: "#A855F7" },
  { name: "Other", value: 6.0, color: "#6B7280" },
]

// =====================
// Alerts Data
// =====================
export interface Alert {
  id: string
  ticker: string
  alertType: "Price Above" | "Price Below" | "AI Signal" | "Earnings"
  condition: string
  status: "Active" | "Triggered"
  created: string
}

export const alerts: Alert[] = [
  {
    id: "1",
    ticker: "AAPL",
    alertType: "Price Above",
    condition: "Price > $195.00",
    status: "Active",
    created: "Feb 28, 2026",
  },
  {
    id: "2",
    ticker: "NVDA",
    alertType: "AI Signal",
    condition: "AI Score drops below 7",
    status: "Active",
    created: "Mar 01, 2026",
  },
  {
    id: "3",
    ticker: "TSLA",
    alertType: "Earnings",
    condition: "Earnings report Q1 2026",
    status: "Triggered",
    created: "Jan 15, 2026",
  },
  {
    id: "4",
    ticker: "JPM",
    alertType: "Price Below",
    condition: "Price < $150.00",
    status: "Active",
    created: "Mar 02, 2026",
  },
  {
    id: "5",
    ticker: "AMZN",
    alertType: "AI Signal",
    condition: "Strong Buy signal detected",
    status: "Triggered",
    created: "Feb 20, 2026",
  },
]
