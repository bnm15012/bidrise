"use client";

import { useState } from "react";
import { X, Plus, Globe, Building2, FileText } from "lucide-react";
import CompanyLogo from "@/components/CompanyLogo";
import type { Company } from "@/app/page";

type Props = {
  onClose: () => void;
  onAdded: (company: Company) => void;
};

export default function AddCompanyModal({ onClose, onAdded }: Props) {
  const [name, setName] = useState("");
  const [domain, setDomain] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const cleanDomain = domain.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/$/, "");

  const handleSubmit = async () => {
    setError("");
    if (!name.trim()) { setError("Company name is required"); return; }
    if (!cleanDomain) { setError("Website domain is required"); return; }
    if (!description.trim()) { setError("A short description is required"); return; }

    setLoading(true);
    try {
      const res = await fetch("/api/add-company", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), domain: cleanDomain, description: description.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Something went wrong"); return; }
      onAdded(data as Company);
    } catch {
      setError("Failed to add company. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-md glass border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
        <div className="h-1 w-full" style={{ background: "linear-gradient(90deg, #BF5AF2, #39FF14, #FF2D78)" }} />

        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-bold font-display text-white">List your startup</h2>
              <p className="text-xs text-white/40 mt-0.5">Add it to the board and start bidding</p>
            </div>
            <button onClick={onClose} className="text-white/40 hover:text-white transition-colors">
              <X size={18} />
            </button>
          </div>

          {/* Logo preview */}
          {cleanDomain && (
            <div className="flex items-center gap-3 glass rounded-2xl px-4 py-3 mb-5 border border-white/5">
              <CompanyLogo domain={cleanDomain} name={name || "?"} size={36} />
              <div>
                <p className="text-white text-sm font-semibold">{name || "Your startup"}</p>
                <p className="text-white/30 text-xs font-mono">{cleanDomain}</p>
              </div>
              <span className="ml-auto text-[10px] text-white/30 font-mono">logo preview</span>
            </div>
          )}

          {/* Fields */}
          <div className="space-y-4">
            <div>
              <label className="text-xs font-mono text-white/30 uppercase tracking-widest block mb-1.5">
                <Building2 size={10} className="inline mr-1" />Startup Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-3 text-white text-sm focus:outline-none focus:border-neon-purple/60 transition-colors"
                placeholder="e.g. Acme AI"
              />
            </div>

            <div>
              <label className="text-xs font-mono text-white/30 uppercase tracking-widest block mb-1.5">
                <Globe size={10} className="inline mr-1" />Website Domain
              </label>
              <input
                type="text"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-3 text-white text-sm focus:outline-none focus:border-neon-purple/60 transition-colors font-mono"
                placeholder="e.g. acme.ai"
              />
              <p className="text-white/20 text-[10px] mt-1 font-mono">Used to fetch your logo automatically</p>
            </div>

            <div>
              <label className="text-xs font-mono text-white/30 uppercase tracking-widest block mb-1.5">
                <FileText size={10} className="inline mr-1" />One-liner
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={80}
                className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-3 text-white text-sm focus:outline-none focus:border-neon-purple/60 transition-colors"
                placeholder="e.g. AI that does the boring stuff."
              />
              <p className="text-white/20 text-[10px] mt-1 text-right font-mono">{description.length}/80</p>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="mt-4 px-3 py-2 rounded-xl bg-neon-pink/10 border border-neon-pink/30 text-neon-pink text-xs font-mono">
              {error}
            </div>
          )}

          {/* CTA */}
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="mt-5 w-full py-3.5 rounded-2xl font-bold text-sm font-display flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: "linear-gradient(135deg, #BF5AF2, #FF2D78)" }}
          >
            {loading ? (
              <span className="animate-spin">⚡</span>
            ) : (
              <><Plus size={16} /> Add & start bidding</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
