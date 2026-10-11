import { NextResponse } from "next/server";
import { getRankings, getRecentBids } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [rankings, recentBids] = await Promise.all([
      getRankings(),
      getRecentBids(8),
    ]);
    return NextResponse.json({ rankings, recentBids }, {
      headers: {
        // Cache on Vercel edge for 30 seconds — serves cached response to all users
        // Only 1 actual DB call per 30 sec regardless of how many users are on the page
        "Cache-Control": "public, s-maxage=30, stale-while-revalidate=10",
      },
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to fetch", detail: String(err) }, { status: 500 });
  }
}
