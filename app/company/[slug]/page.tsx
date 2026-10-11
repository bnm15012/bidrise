"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Share2, TrendingUp, Users, Trophy, Check } from "lucide-react";
import CompanyLogo from "@/components/CompanyLogo";
import BidModal from "@/components/BidModal";
import type { Company } from "@/app/page";

type Bid = { bidder_name: string; amount: number; created_at: string };

function timeAgo(dateStr: string): string {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function CompanyPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [company, setCompany] = useState<Company | null>(null);
  const [bids, setBids] = useState<Bid[]>([]);
  const [rank, setRank] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [showBidModal, setShowBidModal] = useState(false);
  const [copied, setCopied] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`/api/company/${slug}`);
      if (res.status === 404) { setNotFound(true); return; }
      const data = await res.json();
      setCompany(data.company);
      setBids(data.bids);
      setRank(data.rank);
    } catch {
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleShare = async () => {
    const url = window.location.href;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center" style={{ background: "linear-gradient(135deg, #f0eeff 0%, #fdf4ff 50%, #fff7f0 100%)" }}>
        <div className="w-8 h-8 rounded-full border-2 border-violet-400 border-t-transparent animate-spin" />
      </main>
    );
  }

  if (notFound || !company) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center gap-4" style={{ background: "linear-gradient(135deg, #f0eeff 0%, #fdf4ff 50%, #fff7f0 100%)" }}>
        <p className="text-4xl font-black text-gray-900">404</p>
        <p className="text-gray-400">Company not found</p>
        <Link href="/" className="text-violet-600 text-sm font-semibold hover:underline">← Back to rankings</Link>
      </main>
    );
  }

  const topBidder = bids[0];

  return (
    <main className="min-h-screen" style={{ background: "linear-gradient(135deg, #f0eeff 0%, #fdf4ff 50%, #fff7f0 100%)" }}>
      {/* Dot grid */}
      <div className="fixed inset-0 pointer-events-none" style={{
        backgroundImage: "radial-gradient(rgba(124,58,237,0.1) 1px, transparent 1px)",
        backgroundSize: "28px 28px",
      }} />
      <div className="fixed pointer-events-none" style={{ top: "-10%", left: "-5%", width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(circle, rgba(167,139,250,0.2) 0%, transparent 60%)", filter: "blur(60px)" }} />
      <div className="fixed pointer-events-none" style={{ bottom: "0", right: "0", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, rgba(251,146,60,0.15) 0%, transparent 60%)", filter: "blur(60px)" }} />

      <div className="relative z-10 max-w-2xl mx-auto px-6 py-8">
        {/* Back nav */}
        <div className="flex items-center justify-between mb-8">
          <Link href="/" className="flex items-center gap-2 text-sm text-gray-400 hover:text-gray-700 transition-colors font-medium">
            <ArrowLeft size={16} /> Back to rankings
          </Link>
          <button
            onClick={handleShare}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border border-violet-200 text-violet-600 hover:bg-violet-50 transition-all"
          >
            {copied ? <><Check size={14} /> Copied!</> : <><Share2 size={14} /> Share</>}
          </button>
        </div>

        {/* Hero card */}
        <div className="bg-white rounded-3xl p-8 shadow-lg border border-gray-100 mb-5">
          <div className="flex items-start gap-5">
            <div className="p-3 rounded-2xl bg-gray-50 border border-gray-100">
              <CompanyLogo domain={company.logo} name={company.name} size={72} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-2xl font-black text-gray-900">{company.name}</h1>
                {rank <= 3 && <span className="text-lg">{rank === 1 ? "👑" : rank === 2 ? "🥈" : "🥉"}</span>}
              </div>
              <p className="text-gray-400 text-sm leading-relaxed mb-4">{company.description}</p>
              <a href={`https://${company.logo}`} target="_blank" rel="noopener noreferrer" className="text-xs font-mono text-violet-400 hover:text-violet-600 transition-colors">
                {company.logo} ↗
              </a>
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-3 mt-6">
            <div className="bg-gray-50 rounded-2xl p-4 text-center">
              <Trophy size={16} className="mx-auto mb-1 text-amber-400" />
              <p className="text-xl font-black text-gray-900">#{rank}</p>
              <p className="text-xs text-gray-400">Current rank</p>
            </div>
            <div className="bg-violet-50 rounded-2xl p-4 text-center">
              <TrendingUp size={16} className="mx-auto mb-1 text-violet-500" />
              <p className="text-xl font-black text-violet-600">₹{company.total_bid.toLocaleString()}</p>
              <p className="text-xs text-gray-400">Total staked</p>
            </div>
            <div className="bg-gray-50 rounded-2xl p-4 text-center">
              <Users size={16} className="mx-auto mb-1 text-emerald-500" />
              <p className="text-xl font-black text-gray-900">{bids.length}</p>
              <p className="text-xs text-gray-400">Total bids</p>
            </div>
          </div>

          {/* Bid CTA */}
          <button
            onClick={() => setShowBidModal(true)}
            className="mt-6 w-full py-4 rounded-2xl font-bold text-white text-base transition-all hover:opacity-90 hover:scale-[1.01]"
            style={{ background: "linear-gradient(135deg, #7c3aed, #ec4899)" }}
          >
            Bid to push {company.name} up the ranks →
          </button>
        </div>

        {/* Top bidder */}
        {topBidder && (
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-amber-100 mb-5 flex items-center gap-3">
            <span className="text-2xl">🏆</span>
            <div>
              <p className="text-xs text-gray-400 font-semibold uppercase tracking-widest">Top Bidder</p>
              <p className="text-gray-900 font-bold">{topBidder.bidder_name} <span className="text-violet-600 font-mono">₹{topBidder.amount.toLocaleString()}</span></p>
            </div>
            <span className="ml-auto text-xs text-gray-300 font-mono">{timeAgo(topBidder.created_at)}</span>
          </div>
        )}

        {/* Bid history */}
        {bids.length > 0 && (
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">Bid History</p>
            <div className="space-y-3">
              {bids.map((bid, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                    style={{ background: `hsl(${(i * 53 + 200) % 360}, 60%, 50%)` }}
                  >
                    {bid.bidder_name[0]?.toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-800">{bid.bidder_name}</p>
                    <p className="text-xs text-gray-400">{timeAgo(bid.created_at)}</p>
                  </div>
                  <span className="text-sm font-bold font-mono text-emerald-600">+₹{bid.amount.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Share nudge */}
        <div className="mt-5 text-center">
          <p className="text-xs text-gray-400">Share this page with your community to climb the rankings</p>
          <button onClick={handleShare} className="mt-2 text-violet-600 text-sm font-semibold hover:underline">
            {copied ? "Copied!" : "Copy link →"}
          </button>
        </div>
      </div>

      {showBidModal && (
        <BidModal
          company={company}
          onClose={() => setShowBidModal(false)}
          onSuccess={() => { setShowBidModal(false); fetchData(); }}
        />
      )}
    </main>
  );
}
