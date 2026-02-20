"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  ArrowRight,
  Globe,
  Search,
  ChevronDown,
  ChevronUp,
  Zap,
  Loader2,
} from "lucide-react";
import Link from "next/link";

const COUNTRIES = [
  { code: "US", label: "United States" },
  { code: "GB", label: "United Kingdom" },
  { code: "IN", label: "India" },
  { code: "AU", label: "Australia" },
  { code: "DE", label: "Germany" },
  { code: "FR", label: "France" },
  { code: "CA", label: "Canada" },
];

export default function AnalyzePage() {
  const router = useRouter();
  const [domain, setDomain] = useState("");
  const [topic, setTopic] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [depth, setDepth] = useState<"quick" | "standard" | "deep">("standard");
  const [country, setCountry] = useState("US");
  const [competitors, setCompetitors] = useState(["", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [domainValid, setDomainValid] = useState<boolean | null>(null);

  const validateDomain = (value: string) => {
    setDomain(value);
    if (!value.trim()) {
      setDomainValid(null);
      return;
    }
    try {
      const url = value.startsWith("http") ? value : `https://${value}`;
      new URL(url);
      setDomainValid(true);
    } catch {
      setDomainValid(false);
    }
  };

  const handleSubmit = async () => {
    if (!domain.trim() || !topic.trim()) return;
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          domain: domain.trim(),
          topic: topic.trim(),
          config: {
            depth,
            country,
            sourceTypes: ["web"],
            outputFormat: "both",
            competitors: competitors.filter((c) => c.trim()),
          },
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create analysis");

      router.push(`/analyze/${data.jobId}/loading`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(false);
    }
  };

  const depthInfo = {
    quick: { label: "Quick", pages: 5, time: "~30s" },
    standard: { label: "Standard", pages: 10, time: "~60s" },
    deep: { label: "Deep", pages: 20, time: "~90s" },
  };

  const canSubmit = domain.trim() && topic.trim() && domainValid !== false && !loading;

  return (
    <div className="relative min-h-screen text-white font-sans bg-bg-dark">
      <div className="fixed inset-0 bg-grid pointer-events-none z-0"></div>
      <div className="fixed top-[-20%] right-[-10%] w-[800px] h-[800px] bg-red-600/10 rounded-full blur-[120px] pointer-events-none z-0"></div>

      {/* Nav */}
      <nav className="fixed top-6 left-0 right-0 z-50 flex justify-center px-4">
        <div className="bg-[#111]/80 backdrop-blur-xl border border-white/10 rounded-full pl-6 pr-2 py-2 flex items-center gap-8 shadow-2xl shadow-black/50">
          <Link href="/" className="flex items-center gap-3">
            <div className="relative w-6 h-6 flex items-center justify-center">
              <div className="absolute inset-0 bg-[#E74C3C] rotate-45 rounded-sm"></div>
              <Sparkles className="relative text-white w-3 h-3" />
            </div>
            <span className="font-serif font-bold text-lg tracking-tight">CiteFix</span>
          </Link>
          <Link
            href="/"
            className="text-xs font-medium text-gray-400 hover:text-white transition-colors hidden sm:block"
          >
            ← Back to Home
          </Link>
        </div>
      </nav>

      <main className="relative z-10 pt-32 pb-20 px-6 max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-red-500/20 bg-red-500/5 text-xs text-red-400 font-mono mb-6">
            <Zap className="w-3 h-3" />
            CITATION ANALYSIS ENGINE
          </div>
          <h1 className="text-4xl md:text-5xl font-serif mb-4">
            Analyze Your Citations
          </h1>
          <p className="text-gray-400 text-lg max-w-xl mx-auto">
            Enter your domain and target topic to discover how AI engines cite your
            competitors — and get deployment-ready fixes.
          </p>
        </div>

        {/* Main Form */}
        <div className="bg-[#0F0F0F] border border-white/10 rounded-2xl p-8 space-y-6">
          {/* Domain Input */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              <Globe className="w-4 h-4 inline mr-2" />
              Your Domain
            </label>
            <div className="relative">
              <input
                type="text"
                value={domain}
                onChange={(e) => validateDomain(e.target.value)}
                placeholder="e.g. nike.com"
                className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-[#E74C3C]/50 focus:ring-1 focus:ring-[#E74C3C]/20 transition-all"
              />
              {domainValid !== null && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {domainValid ? (
                    <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center">
                      <span className="text-green-400 text-xs">✓</span>
                    </div>
                  ) : (
                    <div className="w-5 h-5 rounded-full bg-red-500/20 flex items-center justify-center">
                      <span className="text-red-400 text-xs">✗</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Topic Input */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              <Search className="w-4 h-4 inline mr-2" />
              Target Topic
            </label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. vegan trail running shoes, B2B CRM software, home equity loans"
              className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-[#E74C3C]/50 focus:ring-1 focus:ring-[#E74C3C]/20 transition-all"
            />
          </div>

          {/* Advanced Config Toggle */}
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-300 transition-colors"
          >
            {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            Advanced Configuration
          </button>

          {/* Advanced Panel */}
          {showAdvanced && (
            <div className="space-y-6 pt-4 border-t border-white/5">
              {/* Depth */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">
                  Analysis Depth
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {(["quick", "standard", "deep"] as const).map((d) => (
                    <button
                      key={d}
                      onClick={() => setDepth(d)}
                      className={`p-3 rounded-lg border text-center transition-all ${
                        depth === d
                          ? "border-[#E74C3C] bg-[#E74C3C]/10 text-white"
                          : "border-white/10 text-gray-500 hover:border-white/20"
                      }`}
                    >
                      <div className="font-medium text-sm">{depthInfo[d].label}</div>
                      <div className="text-xs mt-1 opacity-60">
                        {depthInfo[d].pages} pages • {depthInfo[d].time}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Country */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Geographic Region
                </label>
                <select
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#E74C3C]/50"
                >
                  {COUNTRIES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Competitors */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Competitor Domains (Optional)
                </label>
                <div className="space-y-2">
                  {competitors.map((comp, i) => (
                    <input
                      key={i}
                      type="text"
                      value={comp}
                      onChange={(e) => {
                        const updated = [...competitors];
                        updated[i] = e.target.value;
                        setCompetitors(updated);
                      }}
                      placeholder={`Competitor ${i + 1}`}
                      className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg px-4 py-2 text-white text-sm placeholder-gray-700 focus:outline-none focus:border-white/20"
                    />
                  ))}
                </div>
                <p className="text-xs text-gray-600 mt-2">
                  Leave empty to auto-detect from search results
                </p>
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-sm text-red-400">
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className={`w-full py-4 rounded-lg text-sm font-semibold tracking-wide flex items-center justify-center gap-2 transition-all ${
              canSubmit
                ? "bg-[#E74C3C] text-white hover:bg-[#c0392b] hover:translate-y-[-1px] shadow-lg shadow-red-900/20"
                : "bg-gray-800 text-gray-600 cursor-not-allowed"
            }`}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Creating Analysis...
              </>
            ) : (
              <>
                Analyze Citations <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          <p className="text-xs text-gray-600 text-center">
            Analysis takes {depthInfo[depth].time}. CiteFix reads publicly available web
            data only.
          </p>
        </div>
      </main>
    </div>
  );
}
