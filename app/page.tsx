"use client";

import { useEffect, useState, useCallback } from "react";
import { Trophy, Zap, TrendingUp, Users, ChevronUp } from "lucide-react";
import BidModal from "@/components/BidModal";
import RankCard from "@/components/RankCard";
import LiveFeed from "@/components/LiveFeed";
import Ticker from "@/components/Ticker";
import CompanyLogo from "@/components/CompanyLogo";
import AddCompanyModal from "@/components/AddCompanyModal";

export type Company = {
  id: number;
  name: string;
  logo: string;
  description: string;
  total_bid: number;
};

export type RecentBid = {
  id: number;
  company_name: string;
  bidder_name: string;
  amount: number;
  created_at: string;
};

export default function Home() {
  const [rankings, setRankings] = useState<Company[]>([]);
  const [recentBids, setRecentBids] = useState<RecentBid[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/rankings", { cache: "no-store" });
      const data = await res.json();
      setRankings(data.rankings || []);
      setRecentBids(data.recentBids || []);
      setLastUpdate(new Date());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const topThree = rankings.slice(0, 3);
  const rest = rankings.slice(3);

  const totalBids = rankings.reduce((s, c) => s + c.total_bid, 0);

  return (
    <main className="relative min-h-screen" style={{ background: "linear-gradient(135deg, #0d0d1a 0%, #110d2e 40%, #1a0d2e 70%, #0d1a2e 100%)" }}>
      {/* Background grid */}
      <div
        className="fixed inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(191,90,242,1) 1px, transparent 1px), linear-gradient(90deg, rgba(191,90,242,1) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      {/* Ambient glow blobs */}
      <div className="fixed top-[-10%] left-[-5%] w-[700px] h-[700px] rounded-full pointer-events-none" style={{ background: "radial-gradient(circle, rgba(139,92,246,0.25) 0%, transparent 70%)", filter: "blur(60px)" }} />
      <div className="fixed top-[30%] right-[-10%] w-[500px] h-[500px] rounded-full pointer-events-none" style={{ background: "radial-gradient(circle, rgba(236,72,153,0.2) 0%, transparent 70%)", filter: "blur(60px)" }} />
      <div className="fixed bottom-[-10%] left-[30%] w-[600px] h-[400px] rounded-full pointer-events-none" style={{ background: "radial-gradient(circle, rgba(99,102,241,0.2) 0%, transparent 70%)", filter: "blur(80px)" }} />

      <div className="relative z-10">
        {/* Ticker */}
        <Ticker recentBids={recentBids} />

        {/* Hero */}
        <section className="pt-16 pb-8 px-4 text-center">
          <div className="inline-flex items-center gap-2 glass rounded-full px-4 py-1.5 mb-6 text-xs font-mono text-neon-green border border-neon-green/20">
            <span className="w-2 h-2 rounded-full bg-neon-green animate-pulse" />
            LIVE RANKINGS • Updates every 5s
          </div>

          <h1 className="text-5xl md:text-8xl font-bold font-display mb-4 leading-none tracking-tight">
            <span className="text-white">RANK</span>
            <span
              className="text-transparent bg-clip-text"
              style={{
                backgroundImage:
                  "linear-gradient(135deg, #39FF14 0%, #FF2D78 50%, #BF5AF2 100%)",
              }}
            >
              IT
            </span>
          </h1>

          <p className="text-lg md:text-2xl text-white/50 font-display mb-2">
            Bid. Pay. Rise to the top.
          </p>
          <p className="text-sm text-white/30 max-w-md mx-auto">
            The world&apos;s first pay-to-rank leaderboard. Drop ₹ on your fav
            company and watch them climb. No cap.
          </p>

          {/* Stats bar */}
          <div className="flex justify-center gap-6 mt-8 flex-wrap">
            <StatPill
              icon={<Trophy size={14} />}
              label="Rankings"
              value={rankings.length}
              color="neon-yellow"
            />
            <StatPill
              icon={<Zap size={14} />}
              label="Total Bid"
              value={`₹${totalBids.toLocaleString()}`}
              color="neon-green"
            />
            <StatPill
              icon={<Users size={14} />}
              label="Bids Placed"
              value={recentBids.length}
              color="neon-pink"
            />
            <StatPill
              icon={<TrendingUp size={14} />}
              label="Last Updated"
              value={mounted && lastUpdate ? lastUpdate.toLocaleTimeString() : "--:--:--"}
              color="neon-purple"
            />
          </div>

          {/* Add startup CTA */}
          <button
            onClick={() => setShowAddModal(true)}
            className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold border border-neon-purple/40 text-neon-purple hover:bg-neon-purple/10 transition-all font-display"
          >
            <span className="text-base">+</span> List yourself or your company
          </button>
        </section>

        {/* Podium - Top 3 */}
        {!loading && topThree.length > 0 && (
          <section className="px-4 max-w-5xl mx-auto mb-10">
            <div className="text-center mb-6">
              <span className="text-xs font-mono text-white/30 uppercase tracking-widest">
                — Hall of Fame —
              </span>
            </div>
            <div className="grid grid-cols-3 gap-4 items-end">
              {/* #2 */}
              <div className="flex flex-col items-center gap-2">
                {topThree[1] && (
                  <PodiumCard
                    company={topThree[1]}
                    rank={2}
                    onBid={() => setSelectedCompany(topThree[1])}
                    height="h-36"
                  />
                )}
              </div>
              {/* #1 */}
              <div className="flex flex-col items-center gap-2">
                {topThree[0] && (
                  <PodiumCard
                    company={topThree[0]}
                    rank={1}
                    onBid={() => setSelectedCompany(topThree[0])}
                    height="h-48"
                    featured
                  />
                )}
              </div>
              {/* #3 */}
              <div className="flex flex-col items-center gap-2">
                {topThree[2] && (
                  <PodiumCard
                    company={topThree[2]}
                    rank={3}
                    onBid={() => setSelectedCompany(topThree[2])}
                    height="h-28"
                  />
                )}
              </div>
            </div>
          </section>
        )}

        {/* Rest of rankings + live feed */}
        <section className="px-4 max-w-5xl mx-auto pb-20">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Rankings list */}
            <div className="lg:col-span-2 space-y-3">
              <h2 className="text-xs font-mono text-white/40 uppercase tracking-widest mb-4">
                Full Leaderboard
              </h2>
              {loading ? (
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <div
                      key={i}
                      className="h-20 glass rounded-2xl animate-pulse"
                    />
                  ))}
                </div>
              ) : (
                rest.map((company, i) => (
                  <RankCard
                    key={company.id}
                    company={company}
                    rank={i + 4}
                    onBid={() => setSelectedCompany(company)}
                  />
                ))
              )}
            </div>

            {/* Live feed */}
            <div className="lg:col-span-1">
              <LiveFeed bids={recentBids} />
            </div>
          </div>
        </section>
      </div>

      {/* Bid modal */}
      {selectedCompany && (
        <BidModal
          company={selectedCompany}
          onClose={() => setSelectedCompany(null)}
          onSuccess={() => {
            setSelectedCompany(null);
            fetchData();
          }}
        />
      )}

      {/* Add company modal */}
      {showAddModal && (
        <AddCompanyModal
          onClose={() => setShowAddModal(false)}
          onAdded={(company) => {
            setShowAddModal(false);
            setSelectedCompany(company);
            fetchData();
          }}
        />
      )}

      {/* Scroll to top */}
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        className="fixed bottom-6 right-6 w-10 h-10 glass rounded-full flex items-center justify-center text-white/60 hover:text-white hover:glow-purple transition-all z-50"
      >
        <ChevronUp size={18} />
      </button>
    </main>
  );
}

function StatPill({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color: string;
}) {
  const colorMap: Record<string, string> = {
    "neon-yellow": "text-neon-yellow border-neon-yellow/20",
    "neon-green": "text-neon-green border-neon-green/20",
    "neon-pink": "text-neon-pink border-neon-pink/20",
    "neon-purple": "text-neon-purple border-neon-purple/20",
  };

  return (
    <div
      className={`glass border rounded-xl px-4 py-2 flex items-center gap-2 text-sm ${colorMap[color] || ""}`}
    >
      {icon}
      <span className="text-white/40 text-xs">{label}:</span>
      <span className="font-mono font-semibold">{value}</span>
    </div>
  );
}

function PodiumCard({
  company,
  rank,
  onBid,
  height,
  featured,
}: {
  company: Company;
  rank: number;
  onBid: () => void;
  height: string;
  featured?: boolean;
}) {
  const rankStyles: Record<number, string> = {
    1: "from-yellow-400/20 to-orange-500/10 border-yellow-400/30",
    2: "from-gray-400/20 to-gray-500/10 border-gray-400/30",
    3: "from-orange-700/20 to-orange-900/10 border-orange-700/30",
  };

  const badgeStyles: Record<number, string> = {
    1: "rank-1",
    2: "rank-2",
    3: "rank-3",
  };

  const rankEmojis: Record<number, string> = { 1: "👑", 2: "🥈", 3: "🥉" };

  return (
    <button
      onClick={onBid}
      className={`w-full glass bg-gradient-to-b ${rankStyles[rank]} border rounded-2xl p-4 flex flex-col items-center gap-2 hover:scale-105 transition-all duration-300 group ${featured ? "glow-purple" : ""}`}
    >
      {rank === 1 && (
        <span className="text-2xl animate-bounce-slow">👑</span>
      )}
      <CompanyLogo domain={company.logo} name={company.name} size={52} />
      <div
        className={`text-xs font-mono font-bold w-6 h-6 rounded-full flex items-center justify-center text-black ${badgeStyles[rank]}`}
      >
        {rank}
      </div>
      <p className="text-white font-semibold text-sm text-center leading-tight">
        {company.name}
      </p>
      <p className="text-neon-green font-mono text-xs font-bold">
        ₹{company.total_bid.toLocaleString()}
      </p>
      <span className="text-[10px] text-white/0 group-hover:text-white/60 transition-all font-mono">
        + BID NOW
      </span>
    </button>
  );
}
