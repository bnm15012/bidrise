"use client";

import type { RecentBid } from "@/app/page";

type Props = {
  recentBids: RecentBid[];
};

export default function Ticker({ recentBids }: Props) {
  if (recentBids.length === 0) return null;

  const text = recentBids
    .map((b) => `🔥 ${b.bidder_name} dropped ₹${b.amount.toLocaleString()} on ${b.company_name}`)
    .join("   ·   ");

  return (
    <div className="bg-neon-green/10 border-b border-neon-green/20 overflow-hidden h-7 flex items-center">
      <div className="whitespace-nowrap ticker-animation text-[11px] font-mono text-neon-green font-semibold">
        {text} &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; {text}
      </div>
    </div>
  );
}
