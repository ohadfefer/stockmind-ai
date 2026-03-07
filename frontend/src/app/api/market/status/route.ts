import { finnhubFetch } from "@/lib/finnhub";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const exchange = searchParams.get("exchange") || "US";

    try {
        const data = await finnhubFetch("/stock/market-status", { exchange });
        return NextResponse.json(data);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch market status" }, { status: 500 });
    }
}
