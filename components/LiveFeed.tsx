"use client";

import { useEffect, useRef, useState } from "react";
import { Activity } from "lucide-react";
import type { RecentBid } from "@/app/page";

type Props = {
  bids: RecentBid[];
};

function timeAgo(dateStr: string): string {
  const diff = Math.floor(
    (Date.now() - new Date(dateStr).getTime()) / 1000
  );
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

export default function LiveFeed({ bids }: Props) {
  const [visible, setVisible] = useState<RecentBid[]>([]);
  const prevIds = useRef<Set<number>>(new Set());

  useEffect(() => {
    setVisible(bids);
    bids.forEach((b) => prevIds.current.add(b.id));
  }, [bids]);

  return (
    <div className="glass rounded-2xl p-4 border border-white/5 h-fit sticky top-4">
      <div className="flex items-center gap-2 mb-4">
        <Activity size={14} className="text-neon-pink" />
        <span className="text-xs font-mono text-white/50 uppercase tracking-widest">
          Live Bids
        </span>
        <span className="ml-auto w-2 h-2 rounded-full bg-neon-pink animate-pulse" />
      </div>

      {visible.length === 0 ? (
        <div className="text-center py-8 text-white/20 text-xs font-mono">
          No bids yet. Be first.
        </div>
      ) : (
        <div className="space-y-3">
          {visible.map((bid, i) => (
            <div
              key={bid.id}
              className="flex items-start gap-3 text-sm"
              style={{
                opacity: 1 - i * 0.1,
              }}
            >
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs flex-shrink-0 mt-0.5"
                style={{
                  background: `hsl(${(bid.id * 37) % 360}, 70%, 50%)`,
                }}>
                {bid.bidder_name[0]?.toUpperCase() || "?"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white/80 text-xs leading-tight">
                  <span className="font-semibold">{bid.bidder_name}</span>
                  {" "}bid on{" "}
                  <span className="text-neon-purple">{bid.company_name}</span>
                </p>
                <p className="text-neon-green font-mono font-bold text-xs mt-0.5">
                  +₹{bid.amount.toLocaleString()}
                </p>
              </div>
              <span className="text-white/20 text-[10px] font-mono flex-shrink-0">
                {timeAgo(bid.created_at)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
