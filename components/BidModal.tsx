"use client";

import { useState, useEffect } from "react";
import { X, Zap, Shield, TrendingUp } from "lucide-react";
import CompanyLogo from "@/components/CompanyLogo";
import type { Company } from "@/app/page";

declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

type RazorpayOptions = {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  handler: (response: RazorpayResponse) => void;
  prefill: { name: string; email: string };
  notes: Record<string, string>;
  theme: { color: string };
  modal: { ondismiss: () => void };
};

type RazorpayInstance = { open: () => void };

type RazorpayResponse = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};

type Props = { company: Company; onClose: () => void; onSuccess: () => void };

const QUICK_BIDS = [100, 500, 1000, 5000];

export default function BidModal({ company, onClose, onSuccess }: Props) {
  const [amount, setAmount] = useState<string>("500");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState<"form" | "processing" | "success">("form");

  useEffect(() => {
    if (typeof window !== "undefined" && !window.Razorpay) {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  const handleBid = async () => {
    setError("");
    const amt = parseInt(amount);
    if (!name.trim()) { setError("Your name is required"); return; }
    if (!email.trim() || !email.includes("@")) { setError("Need a valid email"); return; }
    if (!amt || amt < 100) { setError("Minimum bid is ₹100"); return; }

    setLoading(true);
    setStep("processing");

    try {
      const res = await fetch("/api/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ company_id: company.id, amount: amt, bidder_name: name, bidder_email: email }),
      });

      const order = await res.json();
      if (!res.ok) { setError(order.error || "Failed to create order"); setStep("form"); setLoading(false); return; }

      const options: RazorpayOptions = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
        amount: order.amount,
        currency: order.currency,
        name: "BidRise",
        description: `Bid for ${company.name}`,
        order_id: order.order_id,
        handler: async (response: RazorpayResponse) => {
          try {
            const verRes = await fetch("/api/verify-payment", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });
            const verData = await verRes.json();
            if (verRes.ok && verData.success) {
              setStep("success");
              setTimeout(() => onSuccess(), 2500);
            } else {
              setError("Payment verification failed. Contact support.");
              setStep("form");
            }
          } catch {
            setError("Something went wrong during verification");
            setStep("form");
          } finally {
            setLoading(false);
          }
        },
        prefill: { name, email },
        notes: { company: company.name },
        theme: { color: "#7c3aed" },
        modal: { ondismiss: () => { setLoading(false); setStep("form"); } },
      };

      const rz = new window.Razorpay(options);
      rz.open();
    } catch {
      setError("Something went wrong. Try again.");
      setLoading(false);
      setStep("form");
    }
  };

  const inputClass = "w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 px-3 text-gray-900 text-sm focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-all placeholder:text-gray-300";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-md bg-white rounded-3xl overflow-hidden shadow-2xl border border-gray-100">
        <div className="h-1 w-full" style={{ background: "linear-gradient(90deg, #7c3aed, #ec4899, #f97316)" }} />

        {step === "success" ? (
          <div className="p-8 text-center">
            <div className="text-6xl mb-4 animate-bounce">🎉</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Bid placed!</h2>
            <p className="text-gray-400 text-sm mb-1">₹{amount} placed for</p>
            <p className="text-violet-600 font-bold text-xl">{company.name}</p>
            <p className="text-emerald-500 text-sm mt-4 font-mono">Rankings updating...</p>
          </div>
        ) : (
          <div className="p-6">
            {/* Header */}
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-3">
                <CompanyLogo domain={company.logo} name={company.name} size={44} />
                <div>
                  <h2 className="text-lg font-bold text-gray-900 leading-tight">{company.name}</h2>
                  <p className="text-xs text-gray-400 font-mono">Current: ₹{company.total_bid.toLocaleString()}</p>
                </div>
              </div>
              <button onClick={onClose} className="text-gray-300 hover:text-gray-600 transition-colors">
                <X size={18} />
              </button>
            </div>

            {/* Quick bids */}
            <div className="mb-4">
              <p className="text-xs font-semibold text-gray-400 mb-2 uppercase tracking-widest">Quick Select</p>
              <div className="grid grid-cols-4 gap-2">
                {QUICK_BIDS.map((q) => (
                  <button
                    key={q}
                    onClick={() => setAmount(String(q))}
                    className={`text-xs font-mono py-2 rounded-xl border transition-all ${
                      amount === String(q)
                        ? "border-violet-400 bg-violet-50 text-violet-600 font-semibold"
                        : "border-gray-200 text-gray-400 hover:border-violet-300 hover:text-violet-500"
                    }`}
                  >
                    ₹{q}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom amount */}
            <div className="mb-4">
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-widest block mb-2">
                Custom Amount (₹)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300 font-mono">₹</span>
                <input
                  type="number"
                  min="100"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-8 pr-4 text-gray-900 font-mono text-lg focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-all"
                  placeholder="Enter amount"
                />
              </div>
            </div>

            {/* Name + Email */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-widest block mb-1">Your Name</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} className={inputClass} placeholder="John Doe" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-widest block mb-1">Email</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} placeholder="you@email.com" />
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="mb-4 px-3 py-2 rounded-xl bg-rose-50 border border-rose-200 text-rose-500 text-xs">
                {error}
              </div>
            )}

            {/* CTA */}
            <button
              onClick={handleBid}
              disabled={loading || step === "processing"}
              className="w-full py-4 rounded-2xl font-bold text-white text-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90"
              style={{ background: "linear-gradient(135deg, #7c3aed, #6d28d9)" }}
            >
              <span className="flex items-center justify-center gap-2">
                {step === "processing" ? (
                  <><span className="animate-spin text-lg">⚡</span> Processing...</>
                ) : (
                  <><Zap size={16} /> Drop ₹{parseInt(amount || "0").toLocaleString()} on {company.name}</>
                )}
              </span>
            </button>

            {/* Trust signals */}
            <div className="flex items-center justify-center gap-4 mt-3 text-gray-300 text-[10px] font-mono">
              <span className="flex items-center gap-1"><Shield size={10} /> Secured by Razorpay</span>
              <span>·</span>
              <span className="flex items-center gap-1"><TrendingUp size={10} /> Rankings update instantly</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
