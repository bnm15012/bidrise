"use client";

import type { Company } from "@/app/page";
import CompanyLogo from "@/components/CompanyLogo";

type Props = { company: Company; rank: number; onBid: () => void };

export default function RankCard({ company, rank, onBid }: Props) {
  const pct = company.total_bid > 0 ? Math.min(100, (company.total_bid / 10000) * 100) : 0;

  return (
    <button
      onClick={onBid}
      className="w-full glass rounded-2xl px-4 py-3.5 flex items-center gap-4 text-left group hover:shadow-md transition-all duration-200"
    >
      <span className="w-7 text-center text-sm font-bold text-gray-900 flex-shrink-0 font-mono">
        {rank}
      </span>

      <a href={`https://${company.logo}`} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="flex-shrink-0 hover:scale-105 transition-transform" title={`Visit ${company.name}`}>
        <CompanyLogo domain={company.logo} name={company.name} size={38} />
      </a>

      <div className="flex-1 min-w-0">
        <span className="text-sm font-semibold text-gray-900 truncate block">{company.name}</span>
        <p className="text-xs text-gray-400 truncate mt-0.5">{company.description}</p>
        <div className="mt-2 h-0.5 rounded-full bg-black/5 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{ width: `${pct}%`, background: "linear-gradient(90deg, #7c3aed, #ec4899)" }}
          />
        </div>
      </div>

      <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
        <span className="text-sm font-bold font-mono text-violet-600">
          ₹{company.total_bid.toLocaleString()}
        </span>
        <span className="text-[10px] font-semibold text-violet-400 group-hover:text-violet-600 transition-colors">
          BID →
        </span>
      </div>
    </button>
  );
}
