"use client";

import { useEffect, useRef, useState } from "react";
import type { RecentBid } from "@/app/page";

type Props = { bids: RecentBid[] };

function timeAgo(dateStr: string): string {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

export default function LiveFeed({ bids }: Props) {
  const [displayed, setDisplayed] = useState<RecentBid[]>([]);
  const [newId, setNewId] = useState<number | null>(null);
  const indexRef = useRef(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (bids.length === 0) return;

    // Reset and restart whenever bids updates (new real bid came in)
    if (intervalRef.current) clearInterval(intervalRef.current);
    setDisplayed(bids.slice(0, 5));
    indexRef.current = 5;

    // Cycle through bids every 2.5 seconds
    intervalRef.current = setInterval(() => {
      const next = bids[indexRef.current % bids.length];
      setNewId(next.id);
      setDisplayed(prev => [next, ...prev.slice(0, 4)]);
      indexRef.current++;
      setTimeout(() => setNewId(null), 800);
    }, 2500);

    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [bids]); // re-runs whenever bids array changes (new real payment detected)

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
        <div className="space-y-3 overflow-hidden">
          {displayed.map((bid, i) => (
            <div
              key={`${bid.id}-${i}`}
              className="flex items-center gap-3 transition-all duration-500"
              style={{
                opacity: i === 0 ? 1 : Math.max(0.75, 1 - i * 0.08),
                transform: i === 0 && bid.id === newId ? "translateY(0)" : "translateY(0)",
                animation: i === 0 && bid.id === newId ? "slideIn 0.4s ease-out" : undefined,
              }}
            >
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                style={{ background: `hsl(${(bid.bidder_name.charCodeAt(0) * 47) % 360}, 60%, 45%)` }}
              >
                {bid.bidder_name[0]?.toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-600 truncate">
                  <span className="font-semibold text-gray-800">{bid.bidder_name}</span>
                  {" → "}
                  <span className="text-violet-600">{bid.company_name}</span>
                </p>
                <p className="text-xs font-bold font-mono text-emerald-700">+₹{bid.amount.toLocaleString()}</p>
              </div>
              <span className="text-[10px] text-gray-400 font-mono flex-shrink-0">{timeAgo(bid.created_at)}</span>
            </div>
          ))}
        </div>
      )}

      <style jsx>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(-16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
