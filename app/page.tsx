"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Plus, ChevronUp, Search, X } from "lucide-react";
import BidModal from "@/components/BidModal";
import RankCard from "@/components/RankCard";
import LiveFeed from "@/components/LiveFeed";
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
  const [, setLastUpdate] = useState<Date | null>(null);
  const [mounted, setMounted] = useState(false);
  const [elapsed, setElapsed] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Company[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    // Launch time: Oct 12 2026, 10:00am IST (UTC+5:30)
    const LAUNCH = new Date("2026-10-12T04:30:00.000Z");
    const tick = () => {
      const diff = Math.max(0, Math.floor((Date.now() - LAUNCH.getTime()) / 1000));
      const h = Math.floor(diff / 3600).toString().padStart(2, "0");
      const m = Math.floor((diff % 3600) / 60).toString().padStart(2, "0");
      const s = (diff % 60).toString().padStart(2, "0");
      setElapsed(`${h}:${m}:${s}`);
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, []);

  const lastBidCountRef = useRef<number>(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const IDLE_INTERVAL = 60 * 1000;  // 60 sec normally
  const ACTIVE_INTERVAL = 5 * 1000; // 5 sec burst when new bid detected

  const scheduleNext = useCallback((hasActivity: boolean) => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    const delay = hasActivity ? ACTIVE_INTERVAL : IDLE_INTERVAL;
    intervalRef.current = setInterval(() => fetchData(), delay);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/rankings", { cache: "no-store" });
      const data = await res.json();
      const newBidCount = (data.recentBids || []).length;
      const hasActivity = newBidCount !== lastBidCountRef.current;
      lastBidCountRef.current = newBidCount;
      setRankings(data.rankings || []);
      setRecentBids(data.recentBids || []);
      setLastUpdate(new Date());
      scheduleNext(hasActivity);
    } catch (e) {
      console.error(e);
      scheduleNext(false);
    } finally {
      setLoading(false);
    }
  }, [scheduleNext]);

  useEffect(() => {
    fetchData();
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [fetchData]);

  useEffect(() => {
    if (!searchQuery.trim()) { setSearchResults([]); return; }
    const t = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`);
        const data = await res.json();
        setSearchResults(data.results || []);
      } finally {
        setSearchLoading(false);
      }
    }, 250);
    return () => clearTimeout(t);
  }, [searchQuery]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSearch(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const topThree = rankings.slice(0, 3);
  const rest = rankings.slice(3);
  const totalBids = rankings.reduce((s, c) => s + c.total_bid, 0);

  return (
    <main className="relative min-h-screen" style={{ background: "linear-gradient(135deg, #f0eeff 0%, #fdf4ff 50%, #fff7f0 100%)" }}>
      {/* Dot grid */}
      <div className="fixed inset-0 pointer-events-none" style={{
        backgroundImage: "radial-gradient(rgba(124,58,237,0.12) 1px, transparent 1px)",
        backgroundSize: "28px 28px",
      }} />
      {/* Color blobs */}
      <div className="fixed pointer-events-none" style={{ top: "-10%", left: "-5%", width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(circle, rgba(167,139,250,0.25) 0%, transparent 60%)", filter: "blur(60px)" }} />
      <div className="fixed pointer-events-none" style={{ top: "30%", right: "-5%", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, rgba(251,146,60,0.2) 0%, transparent 60%)", filter: "blur(60px)" }} />
      <div className="fixed pointer-events-none" style={{ bottom: "0", left: "30%", width: 600, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(236,72,153,0.15) 0%, transparent 60%)", filter: "blur(60px)" }} />

      <div className="relative z-10">


        {/* Nav bar */}
        <nav className="flex items-center justify-between px-6 py-4 max-w-6xl mx-auto">
          <div className="flex items-center gap-2">
            <a href="/" className="text-xl font-black tracking-tight text-gray-900 hover:opacity-80 transition-opacity">BID <span className="text-violet-600">RISE</span></a>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-medium text-gray-500 font-mono">LIVE</span>
            {mounted && elapsed && (
              <span className="text-xs text-gray-400 font-mono ml-1">{elapsed}</span>
            )}
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all"
            style={{ background: "linear-gradient(135deg, #7c3aed, #6d28d9)" }}
          >
            <Plus size={14} />
            List yourself
          </button>
        </nav>

        {/* Hero */}
        <section className="pt-10 pb-12 px-6 text-center max-w-3xl mx-auto">
          <h1 className="text-6xl md:text-8xl font-black tracking-tighter leading-none mb-5 text-gray-900 whitespace-nowrap">
            Bid to be{" "}
            <span style={{ background: "linear-gradient(90deg, #7c3aed, #ec4899, #f97316)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              #1
            </span>
          </h1>
          <p className="text-gray-500 text-lg max-w-md mx-auto leading-relaxed">
            The world&apos;s first pay-to-rank leaderboard for startups. Place a bid, climb the board, go viral.
          </p>

          {/* Stats row */}
          <div className="flex items-center justify-center gap-8 mt-8 flex-wrap">
            <Stat label="On the board" value={`${rankings.length} startups`} />
            <div className="w-px h-8 bg-black/10" />
            <Stat label="Total staked" value={`₹${totalBids.toLocaleString()}`} accent />
            <div className="w-px h-8 bg-black/10" />
            <Stat label="Recent bids" value={`${recentBids.length}`} />
          </div>

          {/* Search bar */}
          <div ref={searchRef} className="relative mt-8 max-w-md mx-auto">
            <div className="flex items-center gap-3 bg-white rounded-2xl px-4 py-3 shadow-sm border border-gray-100">
              <Search size={16} className="text-gray-300 flex-shrink-0" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setShowSearch(true); }}
                onFocus={() => setShowSearch(true)}
                className="flex-1 text-sm text-gray-900 placeholder:text-gray-300 focus:outline-none bg-transparent"
                placeholder="Search any company..."
              />
              {searchQuery && (
                <button onClick={() => { setSearchQuery(""); setSearchResults([]); }} className="text-gray-300 hover:text-gray-500 transition-colors">
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Dropdown results */}
            {showSearch && (searchQuery.trim()) && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50">
                {searchLoading ? (
                  <div className="px-4 py-3 text-sm text-gray-400">Searching...</div>
                ) : searchResults.length === 0 ? (
                  <div className="px-4 py-3 text-sm text-gray-400">No companies found</div>
                ) : (
                  searchResults.map((c) => (
                    <div key={c.id} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0">
                      <a href={`https://${c.logo}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 flex-1 min-w-0">
                        <CompanyLogo domain={c.logo} name={c.name} size={32} />
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-gray-900 truncate">{c.name}</p>
                          <p className="text-xs text-gray-400 truncate">{c.description}</p>
                        </div>
                        <span className="text-xs font-mono text-violet-600 font-semibold flex-shrink-0">₹{c.total_bid.toLocaleString()}</span>
                      </a>
                      <button
                        onClick={() => { setSelectedCompany(c); setShowSearch(false); setSearchQuery(""); }}
                        className="flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold text-white"
                        style={{ background: "linear-gradient(135deg, #7c3aed, #6d28d9)" }}
                      >
                        Bid
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </section>

        {/* Top 3 podium */}
        {!loading && topThree.length > 0 && (
          <section className="px-6 max-w-6xl mx-auto mb-8">
            <div className="flex items-center gap-3 mb-5">
              <div className="h-px flex-1 bg-black/8" />
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Top Ranked</span>
              <div className="h-px flex-1 bg-black/8" />
            </div>
            <div className="grid grid-cols-3 gap-4 items-end">
              {/* 2nd */}
              <PodiumCard company={topThree[1]} rank={2} onBid={() => setSelectedCompany(topThree[1])} />
              {/* 1st */}
              <PodiumCard company={topThree[0]} rank={1} onBid={() => setSelectedCompany(topThree[0])} />
              {/* 3rd */}
              <PodiumCard company={topThree[2]} rank={3} onBid={() => setSelectedCompany(topThree[2])} />
            </div>
          </section>
        )}

        {/* Leaderboard + live feed */}
        <section className="px-6 max-w-6xl mx-auto pb-24">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
            {/* Rankings */}
            <div className="lg:col-span-3 space-y-2.5">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Full Leaderboard</span>
                <span className="text-xs text-gray-400 font-mono">{rankings.length} companies</span>
              </div>
              {loading ? (
                [...Array(4)].map((_, i) => (
                  <div key={i} className="h-[72px] rounded-2xl shimmer" />
                ))
              ) : (
                rest.map((company, i) => (
                  <RankCard key={company.id} company={company} rank={i + 4} onBid={() => setSelectedCompany(company)} />
                ))
              )}
            </div>

            {/* Right col */}
            <div className="lg:col-span-2 space-y-4">
              <LiveFeed bids={recentBids} />

              {/* How it works */}
              <div className="glass rounded-2xl p-5">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">How it works</p>
                <div className="space-y-3">
                  {[
                    { n: "1", t: "Pick a startup", d: "Find your favourite on the board" },
                    { n: "2", t: "Place a bid", d: "Min ₹500 — no upper limit" },
                    { n: "3", t: "Watch them rise", d: "Rankings update in real time" },
                  ].map((s) => (
                    <div key={s.n} className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold text-violet-600 flex-shrink-0 mt-0.5" style={{ background: "rgba(124,58,237,0.1)" }}>
                        {s.n}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-800">{s.t}</p>
                        <p className="text-xs text-gray-400">{s.d}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      {selectedCompany && (
        <BidModal
          company={selectedCompany}
          onClose={() => setSelectedCompany(null)}
          onSuccess={() => { setSelectedCompany(null); fetchData(); }}
        />
      )}

      {showAddModal && (
        <AddCompanyModal
          onClose={() => setShowAddModal(false)}
          onAdded={(company) => { setShowAddModal(false); setSelectedCompany(company); fetchData(); }}
        />
      )}

      <button
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        className="fixed bottom-6 right-6 w-9 h-9 glass-strong rounded-full flex items-center justify-center text-white/50 hover:text-white transition-all z-50"
      >
        <ChevronUp size={16} />
      </button>
    </main>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="text-center">
      <p className={`text-2xl font-bold ${accent ? "text-violet-600" : "text-gray-900"}`}>{value}</p>
      <p className="text-xs text-gray-400 mt-0.5">{label}</p>
    </div>
  );
}

function PodiumCard({ company, rank, onBid }: { company: Company; rank: number; onBid: () => void }) {
  if (!company) return <div />;

  const logoSize = rank === 1 ? 88 : rank === 2 ? 68 : 60;

  const cardStyles: Record<number, React.CSSProperties> = {
    1: {
      background: "linear-gradient(160deg, #3b0764 0%, #6d28d9 60%, #9333ea 100%)",
      border: "1.5px solid rgba(250,204,21,0.6)",
      padding: "28px 20px",
      boxShadow: "0 20px 60px rgba(109,40,217,0.45), 0 0 0 1px rgba(250,204,21,0.2)",
    },
    2: {
      background: "linear-gradient(160deg, #1e293b 0%, #334155 100%)",
      border: "1px solid rgba(148,163,184,0.4)",
      padding: "20px 16px",
      boxShadow: "0 10px 30px rgba(30,41,59,0.3)",
    },
    3: {
      background: "linear-gradient(160deg, #431407 0%, #9a3412 100%)",
      border: "1px solid rgba(251,146,60,0.4)",
      padding: "20px 16px",
      boxShadow: "0 10px 30px rgba(67,20,7,0.3)",
    },
  };

  const rankBadgeStyles: Record<number, string> = {
    1: "linear-gradient(135deg,#fbbf24,#f97316)",
    2: "linear-gradient(135deg,#94a3b8,#cbd5e1)",
    3: "linear-gradient(135deg,#fb923c,#ea580c)",
  };

  const nameColor = rank === 1 ? "#fff" : rank === 2 ? "#e2e8f0" : "#fed7aa";
  const amountColor = rank === 1 ? "#c4b5fd" : rank === 2 ? "#94a3b8" : "#fb923c";
  const topOffset = rank === 1 ? "pt-0" : rank === 2 ? "pt-10" : "pt-16";

  return (
    <div className={`${topOffset} relative`}>
      <button
        onClick={onBid}
        className="w-full rounded-3xl flex flex-col items-center gap-3 transition-all duration-200 hover:scale-[1.03] group overflow-hidden"
        style={cardStyles[rank]}
      >
        {/* Crown for #1 */}
        {rank === 1 && <span className="text-2xl -mb-1">👑</span>}

        {/* Logo */}
        <div style={{
          padding: 8,
          borderRadius: 20,
          background: "rgba(255,255,255,0.15)",
          boxShadow: rank === 1 ? "0 0 40px rgba(250,204,21,0.3), inset 0 1px 0 rgba(255,255,255,0.2)" : "inset 0 1px 0 rgba(255,255,255,0.1)",
        }}>
          <CompanyLogo domain={company.logo} name={company.name} size={logoSize} />
        </div>

        {/* Rank badge */}
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-black text-gray-900 shadow-lg"
          style={{ background: rankBadgeStyles[rank] }}
        >
          {rank}
        </div>

        {/* Name & amount */}
        <div className="text-center">
          <p className={`font-bold leading-tight ${rank === 1 ? "text-base" : "text-sm"}`} style={{ color: nameColor }}>{company.name}</p>
          <p className="text-xs font-mono font-semibold mt-1" style={{ color: amountColor }}>
            ₹{company.total_bid.toLocaleString()}
          </p>
        </div>

        {/* Website link */}
        <a
          href={`https://${company.logo}`}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="text-[10px] font-mono px-3 py-1 rounded-full transition-all"
          style={{
            color: rank === 1 ? "rgba(196,181,253,0.8)" : "rgba(255,255,255,0.4)",
            background: "rgba(255,255,255,0.08)",
            border: "1px solid rgba(255,255,255,0.1)",
          }}
        >
          {company.logo} ↗
        </a>

        <span className="text-[10px] font-bold tracking-widest text-white opacity-80">
          BID NOW →
        </span>
      </button>
    </div>
  );
}
