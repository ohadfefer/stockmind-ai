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
