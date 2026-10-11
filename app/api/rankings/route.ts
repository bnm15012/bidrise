import { NextResponse } from "next/server";
import { getRankings, getRecentBids } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [rankings, recentBids] = await Promise.all([
      getRankings(),
      getRecentBids(8),
    ]);
    return NextResponse.json({ rankings, recentBids });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to fetch", detail: String(err) }, { status: 500 });
  }
}
