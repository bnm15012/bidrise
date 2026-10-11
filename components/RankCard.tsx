"use client";

import { Flame } from "lucide-react";
import type { Company } from "@/app/page";
import CompanyLogo from "@/components/CompanyLogo";

type Props = {
  company: Company;
  rank: number;
  onBid: () => void;
};

export default function RankCard({ company, rank, onBid }: Props) {
  const barWidth =
    company.total_bid > 0
      ? Math.min(100, (company.total_bid / 10000) * 100)
      : 2;

  return (
    <button
      onClick={onBid}
      className="w-full glass rounded-2xl p-4 flex items-center gap-4 hover:border-white/20 border border-white/5 hover:bg-white/5 transition-all duration-200 text-left group"
    >
      {/* Rank number */}
      <div className="w-8 text-center flex-shrink-0">
        <span className="text-lg font-mono font-bold text-white/30">
          #{rank}
        </span>
      </div>

      {/* Logo */}
      <CompanyLogo domain={company.logo} name={company.name} size={40} />

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-white font-semibold text-sm">{company.name}</span>
          {company.total_bid > 5000 && (
            <Flame size={12} className="text-neon-orange" />
          )}
        </div>
        <p className="text-white/30 text-xs truncate">{company.description}</p>
        {/* Bid bar */}
        <div className="mt-2 h-1 bg-white/5 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${barWidth}%`,
              background:
                "linear-gradient(90deg, #BF5AF2, #FF2D78)",
            }}
          />
        </div>
      </div>

      {/* Bid amount + CTA */}
      <div className="flex flex-col items-end gap-1 flex-shrink-0">
        <span className="text-neon-green font-mono font-bold text-sm">
          ₹{company.total_bid.toLocaleString()}
        </span>
        <span className="text-[10px] font-mono text-white/0 group-hover:text-neon-purple transition-all border border-neon-purple/0 group-hover:border-neon-purple/40 rounded-md px-2 py-0.5">
          BID +
        </span>
      </div>
    </button>
  );
}
