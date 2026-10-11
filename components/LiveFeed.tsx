"use client";

import type { RecentBid } from "@/app/page";

type Props = { bids: RecentBid[] };

function timeAgo(dateStr: string): string {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

export default function LiveFeed({ bids }: Props) {
  return (
    <div className="glass rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Live Bids</span>
      </div>

      {bids.length === 0 ? (
        <div className="py-6 text-center">
          <p className="text-gray-400 text-sm">No bids yet.</p>
          <p className="text-gray-300 text-xs mt-1">Be the first to place one.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {bids.map((bid, i) => (
            <div key={bid.id} className="flex items-center gap-3" style={{ opacity: Math.max(0.4, 1 - i * 0.1) }}>
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                style={{ background: `hsl(${(bid.id * 47) % 360}, 60%, 50%)` }}
              >
                {bid.bidder_name[0]?.toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-600 truncate">
                  <span className="font-semibold text-gray-800">{bid.bidder_name}</span>
                  {" → "}
                  <span className="text-violet-600">{bid.company_name}</span>
                </p>
                <p className="text-xs font-bold font-mono text-emerald-600">+₹{bid.amount.toLocaleString()}</p>
              </div>
              <span className="text-[10px] text-gray-300 font-mono flex-shrink-0">{timeAgo(bid.created_at)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
