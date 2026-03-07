import { finnhubFetch } from "@/lib/finnhub";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q") || "AAPL";

    try {
        const data = await finnhubFetch("/search", { q: query });
        return NextResponse.json(data);
    } catch (error) {
        return NextResponse.json({ error: "Failed to search symbols" }, { status: 500 });
    }
}